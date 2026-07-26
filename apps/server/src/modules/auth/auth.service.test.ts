import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { OnboardingNextStep, OnboardingStatus, type OnboardingUserRecord } from './auth.types.js';

const mockAuthRepository = vi.hoisted(() => ({
    findUserByClerkUserId: vi.fn(),
    findCurrentUserProfileById: vi.fn(),
    findOnboardingUserByClerkUserId: vi.fn(),
}));

vi.mock('./auth.repository.js', () => ({
    authRepository: mockAuthRepository,
}));

import { authService } from './auth.service.js';

const activeClinic = {
    id: 'clinic-id',
    name: 'Pravaah Family Clinic',
    slug: 'pravaah-family-clinic',
    isActive: true,
};

const createOnboardingUser = (
    overrides: Partial<OnboardingUserRecord> = {}
): OnboardingUserRecord => ({
    id: 'user-id',
    fullName: 'Dr. Asha Rao',
    email: 'asha@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: activeClinic.id,
    clinic: activeClinic,
    ...overrides,
});

const completedOnboarding = {
    status: OnboardingStatus.COMPLETED,
    nextStep: OnboardingNextStep.OPEN_APPLICATION,
    isComplete: true,
};

const recoveryRequiredOnboarding = {
    status: OnboardingStatus.RECOVERY_REQUIRED,
    nextStep: OnboardingNextStep.RECOVER_ACCOUNT,
    isComplete: false,
};

describe('authService.getOnboardingStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns NOT_STARTED when no internal user exists', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(null);

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toEqual({
            onboarding: {
                status: OnboardingStatus.NOT_STARTED,
                nextStep: OnboardingNextStep.CREATE_CLINIC,
                isComplete: false,
            },
            user: null,
            clinic: null,
        });

        expect(mockAuthRepository.findOnboardingUserByClerkUserId).toHaveBeenCalledWith(
            'clerk-user-id'
        );
    });

    it('returns COMPLETED for an active Admin with an active clinic', async () => {
        const user = createOnboardingUser();

        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(user);

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toEqual({
            onboarding: completedOnboarding,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
            },
            clinic: {
                id: activeClinic.id,
                name: activeClinic.name,
                slug: activeClinic.slug,
            },
        });
    });

    it('returns COMPLETED for an active Staff user with an active clinic', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                role: UserRole.STAFF,
            })
        );

        const result = await authService.getOnboardingStatus('clerk-user-id');

        expect(result.onboarding).toEqual(completedOnboarding);
        expect(result.user?.role).toBe(UserRole.STAFF);
    });

    it('returns RECOVERY_REQUIRED for an invited user without throwing USER_NOT_ACTIVE', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                status: UserStatus.INVITED,
            })
        );

        const result = await authService.getOnboardingStatus('clerk-user-id');

        expect(result.onboarding).toEqual(recoveryRequiredOnboarding);
        expect(result.user?.status).toBe(UserStatus.INVITED);
    });

    it('returns RECOVERY_REQUIRED for a suspended user', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                status: UserStatus.SUSPENDED,
            })
        );

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toMatchObject({
            onboarding: recoveryRequiredOnboarding,
        });
    });

    it('returns RECOVERY_REQUIRED for an active user without a clinic assignment', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinicId: null,
                clinic: null,
            })
        );

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toMatchObject({
            onboarding: recoveryRequiredOnboarding,
            clinic: null,
        });
    });

    it('returns RECOVERY_REQUIRED when the assigned clinic relation is missing', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinic: null,
            })
        );

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toMatchObject({
            onboarding: recoveryRequiredOnboarding,
            clinic: null,
        });
    });

    it('returns RECOVERY_REQUIRED when the assigned clinic is inactive', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinic: {
                    ...activeClinic,
                    isActive: false,
                },
            })
        );

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toEqual({
            onboarding: recoveryRequiredOnboarding,
            user: expect.objectContaining({
                id: 'user-id',
            }),
            clinic: {
                id: activeClinic.id,
                name: activeClinic.name,
                slug: activeClinic.slug,
            },
        });
    });

    it('returns RECOVERY_REQUIRED for an unsupported role', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                role: 'PATIENT' as UserRole,
            })
        );

        await expect(authService.getOnboardingStatus('clerk-user-id')).resolves.toMatchObject({
            onboarding: recoveryRequiredOnboarding,
        });
    });

    it('propagates repository errors', async () => {
        const databaseError = new Error('database unavailable');

        mockAuthRepository.findOnboardingUserByClerkUserId.mockRejectedValue(databaseError);

        await expect(authService.getOnboardingStatus('clerk-user-id')).rejects.toBe(databaseError);
    });

    it('returns a deterministic response for repeated reads without mutating state', async () => {
        const user = createOnboardingUser();

        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(user);

        const firstResult = await authService.getOnboardingStatus('clerk-user-id');
        const secondResult = await authService.getOnboardingStatus('clerk-user-id');

        expect(firstResult).toEqual(secondResult);
        expect(user).toEqual(createOnboardingUser());
        expect(mockAuthRepository.findOnboardingUserByClerkUserId).toHaveBeenCalledTimes(2);
    });
});
