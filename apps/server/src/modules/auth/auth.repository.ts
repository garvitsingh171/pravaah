import { prisma } from '../../config/prisma.js';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import type { ProvisionClinicWithAdminInput } from './auth.types.js';

export const authRepository = {
    findUserByClerkUserId(clerkUserId: string) {
        return prisma.user.findUnique({
            where: {
                clerkUserId,
            },
            select: {
                id: true,
                clerkUserId: true,
                role: true,
                status: true,
                clinicId: true,
            },
        });
    },

    findCurrentUserProfileById(id: string) {
        return prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                        timezone: true,
                    },
                },
            },
        });
    },

    findOnboardingUserByClerkUserId(clerkUserId: string) {
        return prisma.user.findUnique({
            where: {
                clerkUserId,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                clinicId: true,
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        isActive: true,
                    },
                },
            },
        });
    },

    findClinicBySlug(slug: string) {
        return prisma.clinic.findUnique({
            where: {
                slug,
            },
            select: {
                id: true,
            },
        });
    },

    createClinicWithAdmin(input: ProvisionClinicWithAdminInput) {
        return prisma.$transaction(async (tx) => {
            const clinic = await tx.clinic.create({
                data: {
                    name: input.clinic.name,
                    slug: input.clinic.slug,

                    phone: input.clinic.phone ?? null,
                    email: input.clinic.email ?? null,

                    addressLine1: input.clinic.addressLine1 ?? null,
                    addressLine2: input.clinic.addressLine2 ?? null,
                    city: input.clinic.city ?? null,
                    state: input.clinic.state ?? null,
                    country: input.clinic.country,
                    pincode: input.clinic.pincode ?? null,

                    timezone: input.clinic.timezone,

                    openingTime: input.clinic.openingTime,
                    closingTime: input.clinic.closingTime,

                    slotDurationMinutes: input.clinic.slotDurationMinutes,
                    bufferMinutes: input.clinic.bufferMinutes,
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            });

            const user = await tx.user.create({
                data: {
                    clerkUserId: input.admin.clerkUserId,
                    fullName: input.admin.fullName,
                    email: input.admin.email,
                    role: UserRole.ADMIN,
                    status: UserStatus.ACTIVE,
                    clinicId: clinic.id,
                },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    status: true,
                },
            });

            return {
                user,
                clinic,
            };
        });
    },

    async getClinicSetupStatus(clinicId: string) {
        const [clinic, doctorCount, patientCount, appointmentCount] = await Promise.all([
            prisma.clinic.findUnique({
                where: {
                    id: clinicId,
                },
                select: {
                    name: true,
                    slug: true,
                    country: true,
                    timezone: true,
                    openingTime: true,
                    closingTime: true,
                    slotDurationMinutes: true,
                    bufferMinutes: true,
                },
            }),
            prisma.doctorClinic.count({
                where: {
                    clinicId,
                    isActive: true,
                    doctor: {
                        isActive: true,
                    },
                },
            }),
            prisma.patientClinic.count({
                where: {
                    clinicId,
                    isActive: true,
                    patient: {
                        isActive: true,
                    },
                },
            }),
            prisma.appointment.count({
                where: {
                    clinicId,
                },
            }),
        ]);

        return {
            clinicSettingsComplete:
                clinic !== null &&
                clinic.name.trim().length >= 2 &&
                clinic.slug.trim().length >= 2 &&
                clinic.country.trim().length > 0 &&
                clinic.timezone.trim().length > 0 &&
                clinic.openingTime.trim().length > 0 &&
                clinic.closingTime.trim().length > 0 &&
                clinic.slotDurationMinutes > 0 &&
                clinic.bufferMinutes >= 0,
            hasDoctor: doctorCount > 0,
            hasPatient: patientCount > 0,
            hasAppointment: appointmentCount > 0,
        };
    },
};
