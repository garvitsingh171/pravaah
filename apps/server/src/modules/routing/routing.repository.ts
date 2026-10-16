import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { registerPredictionRefreshWork } from '../predictions/prediction.recalculation.service.js';
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

const withRoutingTransaction = <Result>(
    operation: (tx: Prisma.TransactionClient) => Promise<Result>
): Promise<Result> => {
    // Prisma always has $transaction in production. The fallback keeps the
    // repository's narrow unit-test double compatible while production writes
    // remain one transaction with durable work registration.
    const transaction = (prisma as unknown as { $transaction?: unknown }).$transaction;
    if (typeof transaction !== 'function') {
        return operation(prisma as unknown as Prisma.TransactionClient);
    }

    return prisma.$transaction(operation);
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

    async saveRoutingResultIfCurrent(
        patientId: string,
        clinicId: string,
        sourceHash: string,
        attemptId: string,
        result: PersistableRoutingResult
    ) {
        return withRoutingTransaction(async (tx) => {
            const before =
                typeof tx.patientClinic.findUnique === 'function'
                    ? await tx.patientClinic.findUnique({
                          where: { patientId_clinicId: { patientId, clinicId } },
                          select: { distanceFromClinicKm: true },
                      })
                    : null;
            const updated = await tx.patientClinic.updateMany({
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

            if (
                updated.count === 1 &&
                (before == null ||
                    Number(before.distanceFromClinicKm) !== Number(result.distanceKm))
            ) {
                await registerPredictionRefreshWork({
                    tx,
                    clinicId,
                    patientId,
                    trigger: 'TRAVEL_DISTANCE_CHANGED',
                });
            }
            return updated;
        });
    },

    async markRoutingFailedIfCurrent(
        patientId: string,
        clinicId: string,
        sourceHash: string,
        attemptId: string
    ) {
        return withRoutingTransaction(async (tx) => {
            const updated = await tx.patientClinic.updateMany({
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

            // beginRoutingAttempt has already cleared the previous distance.
            // A failed current attempt must refresh predictions against null;
            // an unchanged snapshot is deduplicated by the refresh worker.
            if (updated.count === 1) {
                await registerPredictionRefreshWork({
                    tx,
                    clinicId,
                    patientId,
                    trigger: 'TRAVEL_DISTANCE_CHANGED',
                });
            }
            return updated;
        });
    },

    async invalidateCalculatedRoutesForPatient(patientId: string) {
        return withRoutingTransaction(async (tx) => {
            const scopes =
                typeof tx.patientClinic.findMany === 'function'
                    ? await tx.patientClinic.findMany({
                          where: { patientId, routingSourceHash: { not: null } },
                          select: { clinicId: true, patientId: true },
                      })
                    : [];
            const updated = await tx.patientClinic.updateMany({
                where: { patientId, routingSourceHash: { not: null } },
                data: routingInvalidationData as unknown as Prisma.PatientClinicUpdateManyMutationInput,
            });
            for (const scope of scopes) {
                await registerPredictionRefreshWork({
                    tx,
                    clinicId: scope.clinicId,
                    patientId: scope.patientId,
                    trigger: 'TRAVEL_DISTANCE_CHANGED',
                });
            }
            return updated;
        });
    },

    async invalidateCalculatedRoutesForClinic(clinicId: string) {
        return withRoutingTransaction(async (tx) => {
            const scopes =
                typeof tx.patientClinic.findMany === 'function'
                    ? await tx.patientClinic.findMany({
                          where: { clinicId, routingSourceHash: { not: null } },
                          select: { clinicId: true, patientId: true },
                      })
                    : [];
            const updated = await tx.patientClinic.updateMany({
                where: { clinicId, routingSourceHash: { not: null } },
                data: routingInvalidationData as unknown as Prisma.PatientClinicUpdateManyMutationInput,
            });
            for (const scope of scopes) {
                await registerPredictionRefreshWork({
                    tx,
                    clinicId: scope.clinicId,
                    patientId: scope.patientId,
                    trigger: 'TRAVEL_DISTANCE_CHANGED',
                });
            }
            return updated;
        });
    },
};
