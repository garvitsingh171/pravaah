import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma, UserRole, UserStatus } from '../../../generated/prisma/client.js';
import { AppError } from '../../../utils/AppError.js';
import {
    OnboardingNextStep,
    OnboardingStatus,
    type OnboardingUserRecord,
    type SetupStatusSummary,
} from '../auth.types.js';

const mockAuthRepository = vi.hoisted(() => ({
    findUserByClerkUserId: vi.fn(),
    findCurrentUserProfileById: vi.fn(),
    findOnboardingUserByClerkUserId: vi.fn(),
    findClinicBySlug: vi.fn(),
    createClinicWithAdmin: vi.fn(),
    getClinicSetupStatus: vi.fn(),
}));

const mockClerkIdentityService = vi.hoisted(() => ({
    getTrustedUserIdentity: vi.fn(),
}));

vi.mock('../auth.repository.js', () => ({
    authRepository: mockAuthRepository,
}));

vi.mock('../clerkIdentity.service.js', () => ({
    clerkIdentityService: mockClerkIdentityService,
}));

import { authService } from '../auth.service.js';

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

const setupStatus = {
    clinicSettingsComplete: true,
    hasDoctor: true,
    hasPatient: true,
    hasAppointment: false,
} satisfies SetupStatusSummary;

const createdClinicSetupStatus = {
    clinicSettingsComplete: true,
    hasDoctor: false,
    hasPatient: false,
    hasAppointment: false,
} satisfies SetupStatusSummary;

describe('authService.getOnboardingStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthRepository.getClinicSetupStatus.mockResolvedValue(setupStatus);
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
            setup: null,
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
            setup: setupStatus,
        });

        expect(mockAuthRepository.getClinicSetupStatus).toHaveBeenCalledWith(activeClinic.id);
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
            setup: null,
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

const createUniqueConstraintError = (
    target?: string | string[]
): Prisma.PrismaClientKnownRequestError => {
    return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        ...(target === undefined ? {} : { meta: { target } }),
    });
};

describe('authService.createClinicOnboarding', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(null);
        mockClerkIdentityService.getTrustedUserIdentity.mockResolvedValue(trustedAdminIdentity);
        mockAuthRepository.findClinicBySlug.mockResolvedValue(null);
        mockAuthRepository.createClinicWithAdmin.mockResolvedValue(provisionedResult);
        mockAuthRepository.getClinicSetupStatus.mockResolvedValue(setupStatus);
    });

    it('rejects missing trusted Clerk identity before repository or Clerk profile work', async () => {
        await expect(
            authService.createClinicOnboarding('   ', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );

        expect(mockAuthRepository.findOnboardingUserByClerkUserId).not.toHaveBeenCalled();
        expect(mockClerkIdentityService.getTrustedUserIdentity).not.toHaveBeenCalled();
        expect(mockAuthRepository.findClinicBySlug).not.toHaveBeenCalled();
        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('provisions an unprovisioned identity and returns completed onboarding state', async () => {
        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).resolves.toEqual({
            outcome: 'CREATED',
            data: {
                onboarding: {
                    status: OnboardingStatus.COMPLETED,
                    nextStep: OnboardingNextStep.OPEN_APPLICATION,
                    isComplete: true,
                },
                user: provisionedResult.user,
                clinic: provisionedResult.clinic,
                setup: createdClinicSetupStatus,
            },
        });

        expect(mockAuthRepository.findOnboardingUserByClerkUserId).toHaveBeenCalledWith(
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

    it('returns ALREADY_COMPLETED for an existing active Admin with a valid active clinic', async () => {
        const existingUser = createOnboardingUser({
            id: 'existing-user-id',
            fullName: 'Existing Admin',
            email: 'existing-admin@example.com',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
        });

        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(existingUser);

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).resolves.toEqual({
            outcome: 'ALREADY_COMPLETED',
            data: {
                onboarding: {
                    status: OnboardingStatus.COMPLETED,
                    nextStep: OnboardingNextStep.OPEN_APPLICATION,
                    isComplete: true,
                },
                user: {
                    id: 'existing-user-id',
                    fullName: 'Existing Admin',
                    email: 'existing-admin@example.com',
                    role: UserRole.ADMIN,
                    status: UserStatus.ACTIVE,
                },
                clinic: {
                    id: activeClinic.id,
                    name: activeClinic.name,
                    slug: activeClinic.slug,
                },
                setup: setupStatus,
            },
        });

        expect(mockClerkIdentityService.getTrustedUserIdentity).not.toHaveBeenCalled();
        expect(mockAuthRepository.findClinicBySlug).not.toHaveBeenCalled();
        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('returns ALREADY_COMPLETED for an existing active Staff user with a valid active clinic', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                role: UserRole.STAFF,
            })
        );

        const result = await authService.createClinicOnboarding(
            'trusted-clerk-user-id',
            onboardingClinicInput
        );

        expect(result.outcome).toBe('ALREADY_COMPLETED');
        expect(result.data.user?.role).toBe(UserRole.STAFF);
        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('returns CLINIC_PROVISIONING_CONFLICT for an existing inactive user', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                status: UserStatus.INVITED,
            })
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );

        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('returns CLINIC_PROVISIONING_CONFLICT for an existing user without a clinic id', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinicId: null,
                clinic: null,
            })
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
    });

    it('returns CLINIC_PROVISIONING_CONFLICT for an existing user with an inactive clinic', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinic: {
                    ...activeClinic,
                    isActive: false,
                },
            })
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
    });

    it('returns CLINIC_PROVISIONING_CONFLICT for an existing user with a missing clinic relation', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId.mockResolvedValue(
            createOnboardingUser({
                clinic: null,
            })
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
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

    it('returns ALREADY_COMPLETED when the slug precheck races with a completed current account', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(createOnboardingUser());
        mockAuthRepository.findClinicBySlug.mockResolvedValue({
            id: 'existing-clinic-id',
        });

        const result = await authService.createClinicOnboarding(
            'trusted-clerk-user-id',
            onboardingClinicInput
        );

        expect(result.outcome).toBe('ALREADY_COMPLETED');
        expect(result.data.clinic?.slug).toBe(activeClinic.slug);
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

    it('maps unexpected slug precheck failures to a safe application error', async () => {
        mockAuthRepository.findClinicBySlug.mockRejectedValue(
            new Error('raw database precheck error should not leak')
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(500, 'CLINIC_PROVISIONING_FAILED', 'Clinic provisioning failed')
        );

        expect(mockAuthRepository.createClinicWithAdmin).not.toHaveBeenCalled();
    });

    it('returns ALREADY_COMPLETED when a clerkUserId P2002 is followed by a completed-user re-read', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(createOnboardingUser());
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['clerkUserId'])
        );

        const result = await authService.createClinicOnboarding(
            'trusted-clerk-user-id',
            onboardingClinicInput
        );

        expect(result.outcome).toBe('ALREADY_COMPLETED');
        expect(result.data.clinic).toEqual({
            id: activeClinic.id,
            name: activeClinic.name,
            slug: activeClinic.slug,
        });
    });

    it('returns ALREADY_COMPLETED when a slug P2002 is followed by a completed-user re-read', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(createOnboardingUser());
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['slug'])
        );

        const result = await authService.createClinicOnboarding(
            'trusted-clerk-user-id',
            onboardingClinicInput
        );

        expect(result.outcome).toBe('ALREADY_COMPLETED');
        expect(result.data.clinic?.slug).toBe(activeClinic.slug);
    });

    it('maps a slug P2002 with no current user to CLINIC_SLUG_ALREADY_EXISTS', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['slug'])
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists')
        );
    });

    it('maps an email P2002 with no current user to INTERNAL_USER_ALREADY_EXISTS', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['email'])
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'INTERNAL_USER_ALREADY_EXISTS',
                'An internal user already exists for this identity'
            )
        );
    });

    it('maps a Clerk identity P2002 followed by an inconsistent user to CLINIC_PROVISIONING_CONFLICT', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(
                createOnboardingUser({
                    clinicId: null,
                    clinic: null,
                })
            );
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['clerkUserId'])
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
    });

    it('maps an unknown P2002 target with no current user to CLINIC_PROVISIONING_CONFLICT', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError(['unknown_constraint'])
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
    });

    it('handles Prisma meta.target as a string', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError('User_email_key')
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'INTERNAL_USER_ALREADY_EXISTS',
                'An internal user already exists for this identity'
            )
        );
    });

    it('handles generated clinic slug constraint names', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError('Clinic_slug_key')
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists')
        );
    });

    it('handles generated Clerk user id constraint names', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(
            createUniqueConstraintError('User_clerkUserId_key')
        );

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'INTERNAL_USER_ALREADY_EXISTS',
                'An internal user already exists for this identity'
            )
        );
    });

    it('handles missing P2002 target metadata', async () => {
        mockAuthRepository.findOnboardingUserByClerkUserId
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        mockAuthRepository.createClinicWithAdmin.mockRejectedValue(createUniqueConstraintError());

        await expect(
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput)
        ).rejects.toThrow(
            new AppError(
                409,
                'CLINIC_PROVISIONING_CONFLICT',
                'Account requires recovery before clinic onboarding can continue'
            )
        );
    });

    it('recovers a simulated same-identity race with one CREATED and one ALREADY_COMPLETED result', async () => {
        let postConflictReadEnabled = false;

        mockAuthRepository.findOnboardingUserByClerkUserId.mockImplementation(async () => {
            if (postConflictReadEnabled) {
                return createOnboardingUser();
            }

            return null;
        });
        mockAuthRepository.createClinicWithAdmin
            .mockImplementationOnce(async () => {
                postConflictReadEnabled = true;
                return provisionedResult;
            })
            .mockImplementationOnce(async () => {
                throw createUniqueConstraintError(['clerkUserId']);
            });

        const results = await Promise.all([
            authService.createClinicOnboarding('trusted-clerk-user-id', onboardingClinicInput),
            authService.createClinicOnboarding('trusted-clerk-user-id', {
                ...onboardingClinicInput,
                slug: 'different-request-slug',
            }),
        ]);

        expect(results.map((result) => result.outcome).sort()).toEqual([
            'ALREADY_COMPLETED',
            'CREATED',
        ]);
        expect(
            results.find((result) => result.outcome === 'ALREADY_COMPLETED')?.data.clinic
        ).toEqual({
            id: activeClinic.id,
            name: activeClinic.name,
            slug: activeClinic.slug,
        });
    });
});
