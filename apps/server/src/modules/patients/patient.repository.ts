import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { GeocodingResult } from '../../integrations/geoapify/geoapify.types.js';
import type {
    CreatePatientInput,
    ListPatientsQueryInput,
    UpdatePatientInput,
} from './patient.types.js';

type GeocodingInvalidation = {
    sourceHash: string;
    attemptId: string;
};

const geocodingInvalidationData = (sourceHash: string, attemptId: string) => ({
    latitude: null,
    longitude: null,
    geocodingStatus: 'NOT_GEOCODED' as const,
    geocodingProvider: null,
    geocodingConfidence: null,
    geocodingResultType: null,
    geocodingMatchType: null,
    geocodingPlaceId: null,
    geocodedAddress: null,
    geocodedAt: null,
    geocodingSourceHash: sourceHash,
    geocodingAttemptId: attemptId,
});

const patientResponseSelect = {
    id: true,
    fullName: true,
    phone: true,
    email: true,
    gender: true,
    dateOfBirth: true,
    age: true,
    address: true,
    addressLine1: true,
    addressLine2: true,
    city: true,
    state: true,
    country: true,
    pincode: true,
    latitude: true,
    longitude: true,
    geocodingStatus: true,
    geocodingProvider: true,
    geocodingConfidence: true,
    geocodingResultType: true,
    geocodingMatchType: true,
    geocodedAddress: true,
    geocodedAt: true,
    emergencyContactName: true,
    emergencyContactPhone: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.PatientSelect;

export const patientRepository = {
    findClinicById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    findPatientById(id: string) {
        return prisma.patient.findUnique({
            where: {
                id,
            },
            select: patientResponseSelect,
        });
    },

    findPatientClinicLink(patientId: string, clinicId: string) {
        return prisma.patientClinic.findUnique({
            where: {
                patientId_clinicId: {
                    patientId,
                    clinicId,
                },
            },
        });
    },

    createPatientWithClinicLink(
        clinicId: string,
        data: CreatePatientInput,
        geocodingInvalidation?: GeocodingInvalidation
    ) {
        return prisma.$transaction(async (tx) => {
            const patient = await tx.patient.create({
                data: {
                    fullName: data.fullName,
                    phone: data.phone,

                    email: data.email ?? null,
                    gender: data.gender ?? null,
                    dateOfBirth: data.dateOfBirth ?? null,
                    age: data.age ?? null,
                    // Transitional compatibility: legacy address mirrors the
                    // structured primary line until the cleanup issue removes it.
                    address: data.addressLine1 ?? null,
                    addressLine1: data.addressLine1 ?? null,
                    addressLine2: data.addressLine2 ?? null,
                    city: data.city ?? null,
                    state: data.state ?? null,
                    country: data.country ?? null,
                    pincode: data.pincode ?? null,
                    ...(geocodingInvalidation
                        ? geocodingInvalidationData(
                              geocodingInvalidation.sourceHash,
                              geocodingInvalidation.attemptId
                          )
                        : {}),
                    emergencyContactName: data.emergencyContactName ?? null,
                    emergencyContactPhone: data.emergencyContactPhone ?? null,
                },
                select: patientResponseSelect,
            });

            await tx.patientClinic.create({
                data: {
                    patientId: patient.id,
                    clinicId,
                    notes: data.notes ?? null,
                    distanceFromClinicKm: data.distanceFromClinicKm ?? null,
                },
            });

            return patient;
        });
    },

    updatePatientWithClinicDetails(
        clinicId: string,
        patientId: string,
        data: UpdatePatientInput,
        geocodingInvalidation?: GeocodingInvalidation
    ) {
        const patientUpdateData: Prisma.PatientUpdateInput = {};

        if (data.fullName !== undefined) patientUpdateData.fullName = data.fullName;
        if (data.phone !== undefined) patientUpdateData.phone = data.phone;
        if (data.email !== undefined) patientUpdateData.email = data.email;
        if (data.gender !== undefined) patientUpdateData.gender = data.gender;
        if (data.dateOfBirth !== undefined) patientUpdateData.dateOfBirth = data.dateOfBirth;
        if (data.age !== undefined) patientUpdateData.age = data.age;
        if (data.addressLine1 !== undefined) {
            // Keep old readers coherent while Patient.address is transitional.
            patientUpdateData.address = data.addressLine1;
            patientUpdateData.addressLine1 = data.addressLine1;
        }
        if (data.addressLine2 !== undefined) patientUpdateData.addressLine2 = data.addressLine2;
        if (data.city !== undefined) patientUpdateData.city = data.city;
        if (data.state !== undefined) patientUpdateData.state = data.state;
        if (data.country !== undefined) patientUpdateData.country = data.country;
        if (data.pincode !== undefined) patientUpdateData.pincode = data.pincode;
        if (data.emergencyContactName !== undefined) {
            patientUpdateData.emergencyContactName = data.emergencyContactName;
        }
        if (data.emergencyContactPhone !== undefined) {
            patientUpdateData.emergencyContactPhone = data.emergencyContactPhone;
        }
        if (data.isActive !== undefined) patientUpdateData.isActive = data.isActive;

        if (geocodingInvalidation) {
            Object.assign(
                patientUpdateData,
                geocodingInvalidationData(
                    geocodingInvalidation.sourceHash,
                    geocodingInvalidation.attemptId
                )
            );
        }

        const patientClinicUpdateData: Prisma.PatientClinicUpdateInput = {};

        if (data.notes !== undefined) patientClinicUpdateData.notes = data.notes;
        if (data.distanceFromClinicKm !== undefined) {
            patientClinicUpdateData.distanceFromClinicKm = data.distanceFromClinicKm;
        }

        return prisma.$transaction(async (tx) => {
            if (Object.keys(patientUpdateData).length > 0) {
                await tx.patient.update({
                    where: {
                        id: patientId,
                    },
                    data: patientUpdateData,
                });
            }

            if (Object.keys(patientClinicUpdateData).length > 0) {
                await tx.patientClinic.update({
                    where: {
                        patientId_clinicId: {
                            patientId,
                            clinicId,
                        },
                    },
                    data: patientClinicUpdateData,
                });
            }

            return tx.patient.findUnique({
                where: {
                    id: patientId,
                },
                select: {
                    ...patientResponseSelect,
                    patientClinics: {
                        where: {
                            clinicId,
                        },
                    },
                },
            });
        });
    },

    prepareGeocoding(patientId: string, sourceHash: string, attemptId: string) {
        return prisma.patient.update({
            where: { id: patientId },
            data: geocodingInvalidationData(sourceHash, attemptId),
        });
    },

    saveGeocodingResultIfCurrent(
        patientId: string,
        sourceHash: string,
        attemptId: string,
        result: GeocodingResult
    ) {
        return prisma.patient.updateMany({
            where: {
                id: patientId,
                geocodingSourceHash: sourceHash,
                geocodingAttemptId: attemptId,
            },
            data: {
                latitude: result.latitude,
                longitude: result.longitude,
                geocodingStatus: 'GEOCODED',
                geocodingProvider: 'GEOAPIFY',
                geocodingConfidence: result.confidence,
                geocodingResultType: result.resultType,
                geocodingMatchType: result.matchType,
                geocodingPlaceId: result.placeId,
                geocodedAddress: result.formattedAddress,
                geocodedAt: new Date(),
            },
        });
    },

    markGeocodingFailedIfCurrent(patientId: string, sourceHash: string, attemptId: string) {
        return prisma.patient.updateMany({
            where: {
                id: patientId,
                geocodingSourceHash: sourceHash,
                geocodingAttemptId: attemptId,
            },
            data: {
                geocodingStatus: 'FAILED',
            },
        });
    },

    listPatientsByClinic(clinicId: string, query: ListPatientsQueryInput) {
        const patientWhere: Prisma.PatientWhereInput = {};

        if (query.search !== undefined) {
            patientWhere.OR = [
                {
                    fullName: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
                {
                    phone: {
                        contains: query.search,
                    },
                },
                {
                    email: {
                        contains: query.search,
                        mode: 'insensitive',
                    },
                },
            ];
        }

        if (query.isActive !== undefined) {
            patientWhere.isActive = query.isActive;
        }

        return prisma.patientClinic.findMany({
            where: {
                clinicId,
                patient: patientWhere,
            },
            include: {
                patient: {
                    select: patientResponseSelect,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },
};
