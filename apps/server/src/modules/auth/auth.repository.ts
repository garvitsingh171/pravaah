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
};
