import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { PersistableRoutingResult } from './routing.types.js';

const routingInvalidationData = {
    distanceFromClinicKm: null,
    estimatedTravelTimeMinutes: null,
    routingStatus: 'NOT_CALCULATED' as const,
    routingProvider: null,
    routingMode: null,
    routingTrafficModel: null,
    routedAt: null,
    routingSourceHash: null,
    routingAttemptId: null,
};

const routingContextSelect = {
    id: true,
    patientId: true,
    clinicId: true,
    distanceFromClinicKm: true,
    estimatedTravelTimeMinutes: true,
    routingStatus: true,
    routingProvider: true,
    routingMode: true,
    routingTrafficModel: true,
    routedAt: true,
    routingSourceHash: true,
    routingAttemptId: true,
    patient: {
        select: {
            id: true,
            latitude: true,
            longitude: true,
            geocodingStatus: true,
        },
    },
    clinic: {
        select: {
            id: true,
            latitude: true,
            longitude: true,
            geocodingStatus: true,
        },
    },
} as unknown as Prisma.PatientClinicSelect;

type RoutingContext = {
    id: string;
    patientId: string;
    clinicId: string;
    distanceFromClinicKm: unknown;
    estimatedTravelTimeMinutes: number | null;
    routingStatus: string;
    routingProvider: string | null;
    routingMode: string | null;
    routingTrafficModel: string | null;
    routedAt: Date | null;
    routingSourceHash: string | null;
    routingAttemptId: string | null;
    patient: {
        id: string;
        latitude: number | null;
        longitude: number | null;
        geocodingStatus: string;
    };
    clinic: {
        id: string;
        latitude: number | null;
        longitude: number | null;
        geocodingStatus: string;
    };
};

export const routingRepository = {
    findRoutingContext(patientId: string, clinicId: string) {
        return prisma.patientClinic.findUnique({
            where: {
                patientId_clinicId: {
                    patientId,
                    clinicId,
                },
            },
            select: routingContextSelect,
        }) as unknown as Promise<RoutingContext | null>;
    },

    beginRoutingAttempt(
        patientId: string,
        clinicId: string,
        sourceHash: string,
        attemptId: string
    ) {
        return prisma.patientClinic.update({
            where: {
                patientId_clinicId: {
                    patientId,
                    clinicId,
                },
            },
            data: {
                ...routingInvalidationData,
                routingSourceHash: sourceHash,
                routingAttemptId: attemptId,
            } as unknown as Prisma.PatientClinicUpdateInput,
        });
    },

    saveRoutingResultIfCurrent(
        patientId: string,
        clinicId: string,
        sourceHash: string,
        attemptId: string,
        result: PersistableRoutingResult
    ) {
        return prisma.patientClinic.updateMany({
            where: {
                patientId,
                clinicId,
                routingSourceHash: sourceHash,
                routingAttemptId: attemptId,
            },
            data: {
                distanceFromClinicKm: result.distanceKm,
                estimatedTravelTimeMinutes: result.estimatedTravelTimeMinutes,
                routingStatus: 'CALCULATED',
                routingProvider: 'GEOAPIFY',
                routingMode: 'DRIVE',
                routingTrafficModel: 'FREE_FLOW',
                routedAt: new Date(),
            } as unknown as Prisma.PatientClinicUpdateManyMutationInput,
        });
    },

    markRoutingFailedIfCurrent(
        patientId: string,
        clinicId: string,
        sourceHash: string,
        attemptId: string
    ) {
        return prisma.patientClinic.updateMany({
            where: {
                patientId,
                clinicId,
                routingSourceHash: sourceHash,
                routingAttemptId: attemptId,
            },
            data: {
                distanceFromClinicKm: null,
                estimatedTravelTimeMinutes: null,
                routingStatus: 'FAILED',
                routingProvider: 'GEOAPIFY',
                routingMode: 'DRIVE',
                routingTrafficModel: 'FREE_FLOW',
                routedAt: null,
            } as unknown as Prisma.PatientClinicUpdateManyMutationInput,
        });
    },

    invalidateCalculatedRoutesForPatient(patientId: string) {
        return prisma.patientClinic.updateMany({
            where: {
                patientId,
                // A NOT_CALCULATED row with a non-null source hash can be an
                // in-flight attempt. Clear it too so an older provider
                // response cannot become current after coordinates change.
                routingSourceHash: { not: null },
            },
            data: routingInvalidationData as unknown as Prisma.PatientClinicUpdateManyMutationInput,
        });
    },

    invalidateCalculatedRoutesForClinic(clinicId: string) {
        return prisma.patientClinic.updateMany({
            where: {
                clinicId,
                routingSourceHash: { not: null },
            },
            data: routingInvalidationData as unknown as Prisma.PatientClinicUpdateManyMutationInput,
        });
    },
};
