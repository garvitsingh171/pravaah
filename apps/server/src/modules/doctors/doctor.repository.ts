import { prisma } from '../../config/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { DoctorAvailabilityDayInput } from './doctorAvailability.js';
import type { CreateDoctorInput, UpdateDoctorInput } from './doctor.types.js';

const flattenAvailabilityPeriods = (
    doctorClinicId: string,
    days: DoctorAvailabilityDayInput[]
) => {
    return days.flatMap((day) =>
        day.periods.map((period) => ({
            doctorClinicId,
            weekday: day.weekday,
            startTime: period.startTime,
            endTime: period.endTime,
        }))
    );
};

export const doctorRepository = {
    findClinicById(id: string) {
        return prisma.clinic.findUnique({
            where: {
                id,
            },
        });
    },

    findDoctorById(id: string) {
        return prisma.doctor.findUnique({
            where: {
                id,
            },
        });
    },

    findDoctorClinicLink(clinicId: string, doctorId: string) {
        return prisma.doctorClinic.findUnique({
            where: {
                doctorId_clinicId: {
                    doctorId,
                    clinicId,
                },
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

    updateDoctor(id: string, data: UpdateDoctorInput) {
        const updateData: Prisma.DoctorUpdateInput = {};

        if (data.fullName !== undefined) updateData.fullName = data.fullName;

        if (data.specialization !== undefined) {
            updateData.specialization = data.specialization;
        }

        if (data.qualification !== undefined) {
            updateData.qualification = data.qualification;
        }

        if (data.registrationNumber !== undefined) {
            updateData.registrationNumber = data.registrationNumber;
        }

        if (data.phone !== undefined) updateData.phone = data.phone;
        if (data.email !== undefined) updateData.email = data.email;

        if (data.gender !== undefined) updateData.gender = data.gender;

        if (data.experienceYears !== undefined) {
            updateData.experienceYears = data.experienceYears;
        }

        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        return prisma.doctor.update({
            where: {
                id,
            },
            data: updateData,
        });
    },

    findDoctorAvailabilityPeriods(doctorClinicId: string) {
        return prisma.doctorAvailabilityPeriod.findMany({
            where: {
                doctorClinicId,
            },
            orderBy: [
                {
                    weekday: 'asc',
                },
                {
                    startTime: 'asc',
                },
            ],
        });
    },

    replaceDoctorAvailability(doctorClinicId: string, days: DoctorAvailabilityDayInput[]) {
        const replacementPeriods = flattenAvailabilityPeriods(doctorClinicId, days);

        return prisma.$transaction(async (tx) => {
            await tx.doctorAvailabilityPeriod.deleteMany({
                where: {
                    doctorClinicId,
                },
            });

            if (replacementPeriods.length > 0) {
                await tx.doctorAvailabilityPeriod.createMany({
                    data: replacementPeriods,
                });
            }

            return tx.doctorAvailabilityPeriod.findMany({
                where: {
                    doctorClinicId,
                },
                orderBy: [
                    {
                        weekday: 'asc',
                    },
                    {
                        startTime: 'asc',
                    },
                ],
            });
        });
    },
};
