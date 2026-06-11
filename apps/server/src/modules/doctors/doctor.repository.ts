import { prisma } from '../../config/prisma.js';
import type { CreateDoctorInput } from './doctor.types.js';

export const doctorRepository = {
    findClinicById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    createDoctorWithClinicLink(clinicId: string, data: CreateDoctorInput) {
        return prisma.$transaction(async (tx) => {
            const doctor = await tx.doctor.create({
                data: {
                    fullName: data.fullName,

                    specialization: data.specialization ?? null,
                    qualification: data.qualification ?? null,
                    registrationNumber: data.registrationNumber ?? null,

                    phone: data.phone ?? null,
                    email: data.email ?? null,

                    gender: data.gender ?? null,
                    experienceYears: data.experienceYears ?? null,

                    isActive: true,
                },
            });

            await tx.doctorClinic.create({
                data: {
                    doctorId: doctor.id,
                    clinicId,
                    isActive: true,
                },
            });

            return doctor;
        });
    },

    findDoctorLinksByClinicId(clinicId: string) {
        return prisma.doctorClinic.findMany({
            where: {
                clinicId,
            },
            select: {
                id: true,
                isActive: true,
                doctor: {
                    select: {
                        id: true,
                        fullName: true,
                        specialization: true,
                        qualification: true,
                        registrationNumber: true,
                        phone: true,
                        email: true,
                        gender: true,
                        experienceYears: true,
                        isActive: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
    },
};
