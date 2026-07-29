import { Prisma, UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import { clerkIdentityService } from './clerkIdentity.service.js';
import {
    OnboardingNextStep,
    OnboardingStatus,
    type AuthenticatedUser,
    type ClinicOnboardingMutationResult,
    type CurrentUserProfile,
    type OnboardingClinicInput,
    type OnboardingClinicSummary,
    type OnboardingSummary,
    type OnboardingStatusResult,
    type OnboardingUserRecord,
    type OnboardingUserSummary,
    type SetupStatusSummary,
} from './auth.types.js';

const isSupportedOperationalRole = (role: UserRole): boolean => {
    return role === UserRole.ADMIN || role === UserRole.STAFF;
};

const toOnboardingUserSummary = (user: OnboardingUserRecord): OnboardingUserSummary => {
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
    };
};

const toOnboardingClinicSummary = (user: OnboardingUserRecord): OnboardingClinicSummary | null => {
    if (!user.clinic) {
        return null;
    }

    return {
        id: user.clinic.id,
        name: user.clinic.name,
        slug: user.clinic.slug,
    };
};

const isOnboardingComplete = (user: OnboardingUserRecord): boolean => {
    return (
        user.status === UserStatus.ACTIVE &&
        isSupportedOperationalRole(user.role) &&
        user.clinicId !== null &&
        user.clinic !== null &&
        user.clinic.id === user.clinicId &&
        user.clinic.isActive === true
    );
};

const completedOnboarding = {
    status: OnboardingStatus.COMPLETED,
    nextStep: OnboardingNextStep.OPEN_APPLICATION,
    isComplete: true,
} satisfies OnboardingSummary;

const toCompletedOnboardingResult = (user: OnboardingUserRecord): OnboardingStatusResult => {
    return {
        onboarding: completedOnboarding,
        user: toOnboardingUserSummary(user),
        clinic: toOnboardingClinicSummary(user),
        setup: null,
    };
};

const toCompletedOnboardingResultWithSetup = async (
    user: OnboardingUserRecord
): Promise<OnboardingStatusResult> => {
    const result = toCompletedOnboardingResult(user);

    return {
        ...result,
        setup: user.clinicId ? await authRepository.getClinicSetupStatus(user.clinicId) : null,
    };
};

const toAlreadyCompletedMutationResult = async (
    user: OnboardingUserRecord
): Promise<ClinicOnboardingMutationResult> => {
    return {
        outcome: 'ALREADY_COMPLETED',
        data: await toCompletedOnboardingResultWithSetup(user),
    };
};

const provisioningConflictError = () =>
    new AppError(
        409,
        'CLINIC_PROVISIONING_CONFLICT',
        'Account requires recovery before clinic onboarding can continue'
    );

const internalUserAlreadyExistsError = () =>
    new AppError(
        409,
        'INTERNAL_USER_ALREADY_EXISTS',
        'An internal user already exists for this identity'
    );

const isUniqueConstraintError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
};

const uniqueConstraintTargets = (error: Prisma.PrismaClientKnownRequestError): string[] => {
    const target = error.meta?.target;

    if (Array.isArray(target)) {
        return target
            .filter((value): value is string => typeof value === 'string')
            .map((value) => value.toLowerCase());
    }

    if (typeof target === 'string') {
        return [target.toLowerCase()];
    }

    return [];
};

const uniqueConstraintCategory = (
    error: Prisma.PrismaClientKnownRequestError
): 'slug' | 'identity' | 'unknown' => {
    const targets = uniqueConstraintTargets(error);

    if (targets.some((target) => target.includes('slug'))) {
        return 'slug';
    }

    if (
        targets.some(
            (target) =>
                target.includes('clerkuserid') ||
                target.includes('clerk_user_id') ||
                target.includes('email')
        )
    ) {
        return 'identity';
    }

    return 'unknown';
};

const logClinicOnboardingEvent = (event: string, details: Record<string, string> = {}): void => {
    const suffix = Object.entries(details)
        .map(([key, value]) => `${key}=${value}`)
        .join(' ');

    console.info(`[auth.onboarding.clinic] event=${event}${suffix ? ` ${suffix}` : ''}`);
};

export const authService = {
    async getActiveUserByClerkUserId(clerkUserId: string): Promise<AuthenticatedUser> {
        const user = await authRepository.findUserByClerkUserId(clerkUserId);

        if (!user) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(
                    `[auth] No internal Pravaah user found for Clerk user ID: ${clerkUserId}`
                );
            }

            throw new AppError(
                401,
                'INTERNAL_USER_NOT_FOUND',
                'Authenticated user is not registered in Pravaah'
            );
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError(403, 'USER_NOT_ACTIVE', 'User is not active');
        }

        return user;
    },

    async getCurrentUserProfile(
        authenticatedUser: AuthenticatedUser | undefined
    ): Promise<CurrentUserProfile> {
        if (!authenticatedUser) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        if (authenticatedUser.status !== UserStatus.ACTIVE) {
            throw new AppError(403, 'USER_NOT_ACTIVE', 'User is not active');
        }

        const user = await authRepository.findCurrentUserProfileById(authenticatedUser.id);

        if (!user) {
            throw new AppError(
                401,
                'INTERNAL_USER_NOT_FOUND',
                'Authenticated user is not registered in Pravaah'
            );
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new AppError(403, 'USER_NOT_ACTIVE', 'User is not active');
        }

        return user;
    },

    async getOnboardingStatus(clerkUserId: string): Promise<OnboardingStatusResult> {
        const user = await authRepository.findOnboardingUserByClerkUserId(clerkUserId);

        if (!user) {
            return {
                onboarding: {
                    status: OnboardingStatus.NOT_STARTED,
                    nextStep: OnboardingNextStep.CREATE_CLINIC,
                    isComplete: false,
                },
                user: null,
                clinic: null,
                setup: null,
            };
        }

        const userSummary = toOnboardingUserSummary(user);
        const clinicSummary = toOnboardingClinicSummary(user);

        if (isOnboardingComplete(user)) {
            return toCompletedOnboardingResultWithSetup(user);
        }

        return {
            onboarding: {
                status: OnboardingStatus.RECOVERY_REQUIRED,
                nextStep: OnboardingNextStep.RECOVER_ACCOUNT,
                isComplete: false,
            },
            user: userSummary,
            clinic: clinicSummary,
            setup: null,
        };
    },

    async createClinicOnboarding(
        clerkUserId: string,
        clinicInput: OnboardingClinicInput
    ): Promise<ClinicOnboardingMutationResult> {
        if (!clerkUserId.trim()) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const existingUser = await authRepository.findOnboardingUserByClerkUserId(clerkUserId);

        if (existingUser) {
            if (isOnboardingComplete(existingUser)) {
                logClinicOnboardingEvent('replayed', { outcome: 'ALREADY_COMPLETED' });

                return toAlreadyCompletedMutationResult(existingUser);
            }

            logClinicOnboardingEvent('conflicted', { code: 'CLINIC_PROVISIONING_CONFLICT' });
            throw provisioningConflictError();
        }

        const adminIdentity = await clerkIdentityService.getTrustedUserIdentity(clerkUserId);

        try {
            const existingClinic = await authRepository.findClinicBySlug(clinicInput.slug);

            if (existingClinic) {
                const currentUser =
                    await authRepository.findOnboardingUserByClerkUserId(clerkUserId);

                if (currentUser) {
                    if (isOnboardingComplete(currentUser)) {
                        logClinicOnboardingEvent('replayed_after_slug_precheck', {
                            outcome: 'ALREADY_COMPLETED',
                            conflict: 'slug',
                        });

                        return toAlreadyCompletedMutationResult(currentUser);
                    }

                    logClinicOnboardingEvent('conflicted_after_slug_precheck', {
                        code: 'CLINIC_PROVISIONING_CONFLICT',
                        conflict: 'slug',
                    });
                    throw provisioningConflictError();
                }

                logClinicOnboardingEvent('conflicted', {
                    code: 'CLINIC_SLUG_ALREADY_EXISTS',
                    conflict: 'slug',
                });
                throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
            }

            const result = await authRepository.createClinicWithAdmin({
                clinic: clinicInput,
                admin: adminIdentity,
            });

            logClinicOnboardingEvent('created', { outcome: 'CREATED' });

            return {
                outcome: 'CREATED',
                data: {
                    onboarding: completedOnboarding,
                    user: result.user,
                    clinic: result.clinic,
                    setup: {
                        clinicSettingsComplete: true,
                        hasDoctor: false,
                        hasPatient: false,
                        hasAppointment: false,
                    } satisfies SetupStatusSummary,
                },
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            if (isUniqueConstraintError(error)) {
                const currentUser =
                    await authRepository.findOnboardingUserByClerkUserId(clerkUserId);

                if (currentUser) {
                    if (isOnboardingComplete(currentUser)) {
                        logClinicOnboardingEvent('replayed_after_conflict', {
                            outcome: 'ALREADY_COMPLETED',
                            conflict: uniqueConstraintCategory(error),
                        });

                        return toAlreadyCompletedMutationResult(currentUser);
                    }

                    logClinicOnboardingEvent('conflicted_after_reread', {
                        code: 'CLINIC_PROVISIONING_CONFLICT',
                        conflict: uniqueConstraintCategory(error),
                    });
                    throw provisioningConflictError();
                }

                const category = uniqueConstraintCategory(error);

                if (category === 'slug') {
                    logClinicOnboardingEvent('conflicted', {
                        code: 'CLINIC_SLUG_ALREADY_EXISTS',
                        conflict: 'slug',
                    });
                    throw new AppError(
                        409,
                        'CLINIC_SLUG_ALREADY_EXISTS',
                        'Clinic slug already exists'
                    );
                }

                if (category === 'identity') {
                    logClinicOnboardingEvent('conflicted', {
                        code: 'INTERNAL_USER_ALREADY_EXISTS',
                        conflict: 'identity',
                    });
                    throw internalUserAlreadyExistsError();
                }

                logClinicOnboardingEvent('conflicted', {
                    code: 'CLINIC_PROVISIONING_CONFLICT',
                    conflict: 'unknown',
                });
                throw provisioningConflictError();
            }

            logClinicOnboardingEvent('failed', { code: 'CLINIC_PROVISIONING_FAILED' });
            throw new AppError(500, 'CLINIC_PROVISIONING_FAILED', 'Clinic provisioning failed');
        }
    },
};
