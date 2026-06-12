import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { CreatePatientInput, UpdatePatientInput } from './patient.types.js';

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

    createPatientWithClinicLink(clinicId: string, data: CreatePatientInput) {
        return prisma.$transaction(async (tx) => {
            const patient = await tx.patient.create({
                data: {
                    fullName: data.fullName,
                    phone: data.phone,

                    email: data.email ?? null,
                    gender: data.gender ?? null,
                    dateOfBirth: data.dateOfBirth ?? null,
                    age: data.age ?? null,
                    address: data.address ?? null,
                    city: data.city ?? null,
                    emergencyContactName: data.emergencyContactName ?? null,
                    emergencyContactPhone: data.emergencyContactPhone ?? null,
                },
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

    updatePatientWithClinicDetails(clinicId: string, patientId: string, data: UpdatePatientInput) {
        const patientUpdateData: Prisma.PatientUpdateInput = {};

        if (data.fullName !== undefined) patientUpdateData.fullName = data.fullName;
        if (data.phone !== undefined) patientUpdateData.phone = data.phone;
        if (data.email !== undefined) patientUpdateData.email = data.email;
        if (data.gender !== undefined) patientUpdateData.gender = data.gender;
        if (data.dateOfBirth !== undefined) patientUpdateData.dateOfBirth = data.dateOfBirth;
        if (data.age !== undefined) patientUpdateData.age = data.age;
        if (data.address !== undefined) patientUpdateData.address = data.address;
        if (data.city !== undefined) patientUpdateData.city = data.city;
        if (data.emergencyContactName !== undefined) {
            patientUpdateData.emergencyContactName = data.emergencyContactName;
        }
        if (data.emergencyContactPhone !== undefined) {
            patientUpdateData.emergencyContactPhone = data.emergencyContactPhone;
        }
        if (data.isActive !== undefined) patientUpdateData.isActive = data.isActive;

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
                include: {
                    patientClinics: {
                        where: {
                            clinicId,
                        },
                    },
                },
            });
        });
    },
};
