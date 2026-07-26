import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
    },
    $transaction: vi.fn(),
}));

vi.mock('../../config/prisma.js', () => ({
    prisma: mockPrisma,
}));

import { authRepository } from './auth.repository.js';

describe('authRepository.findOnboardingUserByClerkUserId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('queries onboarding state by trusted Clerk user id with a minimal select', async () => {
        const user = {
            id: 'user-id',
            fullName: 'Dr. Asha Rao',
            email: 'asha@example.com',
            role: 'ADMIN',
            status: 'ACTIVE',
            clinicId: 'clinic-id',
            clinic: {
                id: 'clinic-id',
                name: 'Pravaah Family Clinic',
                slug: 'pravaah-family-clinic',
                isActive: true,
            },
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);

        await expect(
            authRepository.findOnboardingUserByClerkUserId('clerk-user-id')
        ).resolves.toEqual(user);

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                clerkUserId: 'clerk-user-id',
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
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('returns null when no internal user exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            authRepository.findOnboardingUserByClerkUserId('missing-clerk-user-id')
        ).resolves.toBeNull();

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
        expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
});
