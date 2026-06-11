import { prisma } from '../../config/prisma.js';
import type { CreatePatientInput } from './patient.types.js';

export const patientRepository = {
    findClinicById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
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

                    isActive: true,
                },
            });

            await tx.patientClinic.create({
                data: {
                    patientId: patient.id,
                    clinicId,

                    totalAppointments: 0,
                    totalNoShows: 0,
                    totalLateArrivals: 0,

                    notes: data.notes ?? null,
                    distanceFromClinicKm: data.distanceFromClinicKm ?? null,

                    isActive: true,
                },
            });

            return patient;
        });
    },
};
