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
};
