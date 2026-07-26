import { prisma } from '../../config/prisma.js';

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
};
