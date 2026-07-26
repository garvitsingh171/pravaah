import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { OnboardingNextStep, OnboardingStatus, type OnboardingUserRecord } from './auth.types.js';

const mockAuthRepository = vi.hoisted(() => ({
    findUserByClerkUserId: vi.fn(),
    findCurrentUserProfileById: vi.fn(),
    findOnboardingUserByClerkUserId: vi.fn(),
    findClinicBySlug: vi.fn(),
    createClinicWithAdmin: vi.fn(),
}));

const mockClerkIdentityService = vi.hoisted(() => ({
    getTrustedUserIdentity: vi.fn(),
}));

vi.mock('./auth.repository.js', () => ({
    authRepository: mockAuthRepository,
}));

vi.mock('./clerkIdentity.service.js', () => ({
    clerkIdentityService: mockClerkIdentityService,
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

const onboardingClinicInput = {
    name: 'Pravaah Family Clinic',
    slug: 'pravaah-family-clinic',
    email: 'clinic-profile@example.com',
    country: 'India',
    timezone: 'Asia/Kolkata',
    openingTime: '09:00',
    closingTime: '18:00',
    slotDurationMinutes: 15,
    bufferMinutes: 0,
};

const trustedAdminIdentity = {
    clerkUserId: 'trusted-clerk-user-id',
    email: 'admin@example.com',
    fullName: 'Clinic Admin',
};

const provisionedResult = {
    user: {
        id: 'internal-user-id',
        fullName: trustedAdminIdentity.fullName,
        email: trustedAdminIdentity.email,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    clinic: {
        id: 'clinic-id',
        name: onboardingClinicInput.name,
        slug: onboardingClinicInput.slug,
    },
};

describe('authService.createClinicOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthRepository.findUserByClerkUserId.mockResolvedValue(null);
        mockClerkIdentityService.getTrustedUserIdentity.mockResolvedValue(trustedAdminIdentity);
        mockAuthRepository.findClinicBySlug.mockResolvedValue(null);
        mockAuthRepository.createClinicWithAdmin.mockResolvedValue(provisionedResult);
    });

    it('provisions an unprovisioned identity and returns completed onboarding state', async () => {
        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).resolves.toEqual({
            onboarding: {
                status: OnboardingStatus.COMPLETED,
                nextStep: OnboardingNextStep.OPEN_APPLICATION,
                isComplete: true,
            },
            user: provisionedResult.user,
            clinic: provisionedResult.clinic,
        });

        expect(mockAuthRepository.findUserByClerkUserId).toHaveBeenCalledWith(
            'trusted-clerk-user-id'
        );
        expect(mockClerkIdentityService.getTrustedUserIdentity).toHaveBeenCalledWith(
            'trusted-clerk-user-id'
        );
        expect(mockAuthRepository.findClinicBySlug).toHaveBeenCalledWith('pravaah-family-clinic');
    });

    it('uses trusted Clerk email instead of clinic profile email for the internal admin', async () => {
        await authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput);

        expect(mockAuthRepository.createClinicWithAdmin).toHaveBeenCalledWith({
            clinic: onboardingClinicInput,
            admin: {
                clerkUserId: 'trusted-clerk-user-id',
                email: 'admin@example.com',
                fullName: 'Clinic Admin',
            },
        });
        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalledWith(
            expect.objectContaining({
                admin: expect.objectContaining({
                    email: 'clinic-profile@example.com',
                }),
            })
        );
    });

    it('uses trusted Clerk name for the internal admin', async () => {
        mockClerkIdentityService.getTrustedUserIdentity.mockResolvedValue({
            ...trustedAdminIdentity,
            fullName: 'Dr. Trusted Name',
        });

        await authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput);

        expect(mockAuthRepository.createClinicWithAdmin).toHaveBeenCalledWith(
            expect.objectContaining({
                admin: expect.objectContaining({
                    fullName: 'Dr. Trusted Name',
                }),
            })
        );
    });

    it('rejects existing internal users with ONBOARDING_ALREADY_COMPLETED', async () => {
        mockAuthRepository.findUserByClerkUserId.mockResolvedValue({
            id: 'existing-user-id',
            clerkUserId: 'trusted-clerk-user-id',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: 'clinic-id',
        });

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'ONBOARDING_ALREADY_COMPLETED',
                'Onboarding has already been completed for this identity'
            )
        );

        expect(mockClerkIdentityService.getTrustedUserIdentity).not.toHaveBeenCalled();
        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('rejects duplicate clinic slugs before opening the transaction', async () => {
        mockAuthRepository.findClinicBySlug.mockResolvedValue({
            id: 'existing-clinic-id',
        });

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists')
        );

        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('preserves missing trusted Clerk email errors from the identity lookup', async () => {
        const error = new AppError(
            422,
            'CLERK_IDENTITY_DATA_MISSING',
            'Clerk identity is missing required profile data'
        );

        mockClerkIdentityService.getTrustedUserIdentity.mockRejectedValue(error);

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toBe(error);

        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('preserves missing trusted Clerk name errors from the identity lookup', async () => {
        const error = new AppError(
            422,
            'CLERK_IDENTITY_DATA_MISSING',
            'Clerk identity is missing required profile data'
        );

        mockClerkIdentityService.getTrustedUserIdentity.mockRejectedValue(error);

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toBe(error);

        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('calls the repository transaction with trusted identity and validated clinic fields', async () => {
        await authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput);

        expect(mockAuthRepository.createClinicWithAdmin).toHaveBeenCalledWith({
            clinic: onboardingClinicInput,
            admin: trustedAdminIdentity,
        });
    });

    it('maps unknown provisioning errors to a safe application error', async () => {
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            new Error('database secret leaked in raw message')
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(500, 'CLINIC_PROVISIONING_FAILED', 'Clinic provisioning failed')
        );
    });
});
