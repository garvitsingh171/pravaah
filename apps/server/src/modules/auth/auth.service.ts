import { Prisma, UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import { clerkIdentityService } from './clerkIdentity.service.js';
import {
    OnboardingNextStep,
    OnboardingStatus,
    type AuthenticatedUser,
    type CurrentUserProfile,
    type OnboardingClinicInput,
    type OnboardingClinicSummary,
    type OnboardingStatusResult,
    type OnboardingUserRecord,
    type OnboardingUserSummary,
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

const isUniqueConstraintError = (error: unknown): error is Prisma.PrismaClientKnownRequestError => {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
};

const uniqueConstraintTargets = (error: Prisma.PrismaClientKnownRequestError): string[] => {
    const target = error.meta?.target;

    if (!Array.isArray(target)) {
        return [];
    }

    return target.filter((value): value is string => typeof value === 'string');
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
            };
        }

        const userSummary = toOnboardingUserSummary(user);
        const clinicSummary = toOnboardingClinicSummary(user);

        if (isOnboardingComplete(user)) {
            return {
                onboarding: {
                    status: OnboardingStatus.COMPLETED,
                    nextStep: OnboardingNextStep.OPEN_APPLICATION,
                    isComplete: true,
                },
                user: userSummary,
                clinic: clinicSummary,
            };
        }

        return {
            onboarding: {
                status: OnboardingStatus.RECOVERY_REQUIRED,
                nextStep: OnboardingNextStep.RECOVER_ACCOUNT,
                isComplete: false,
            },
            user: userSummary,
            clinic: clinicSummary,
        };
    },

    async createClinicOnboarding(
        clerkUserId: string,
        clinicInput: OnboardingClinicInput
    ): Promise<OnboardingStatusResult> {
        if (!clerkUserId.trim()) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const existingUser = await authRepository.findUserByClerkUserId(clerkUserId);

        if (existingUser) {
            throw new AppError(
                409,
                'ONBOARDING_ALREADY_COMPLETED',
                'Onboarding has already been completed for this identity'
            );
        }

        const adminIdentity = await clerkIdentityService.getTrustedUserIdentity(clerkUserId);
        const existingClinic = await authRepository.findClinicBySlug(clinicInput.slug);

        if (existingClinic) {
            throw new AppError(409, 'CLINIC_SLUG_ALREADY_EXISTS', 'Clinic slug already exists');
        }

        try {
            const result = await authRepository.createClinicWithAdmin({
                clinic: clinicInput,
                admin: adminIdentity,
            });

            return {
                onboarding: {
                    status: OnboardingStatus.COMPLETED,
                    nextStep: OnboardingNextStep.OPEN_APPLICATION,
                    isComplete: true,
                },
                user: result.user,
                clinic: result.clinic,
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            if (isUniqueConstraintError(error)) {
                const targets = uniqueConstraintTargets(error);

                if (targets.includes('slug')) {
                    throw new AppError(
                        409,
                        'CLINIC_SLUG_ALREADY_EXISTS',
                        'Clinic slug already exists'
                    );
                }

                if (targets.includes('clerkUserId')) {
                    throw new AppError(
                        409,
                        'ONBOARDING_ALREADY_COMPLETED',
                        'Onboarding has already been completed for this identity'
                    );
                }
            }

            throw new AppError(500, 'CLINIC_PROVISIONING_FAILED', 'Clinic provisioning failed');
        }
    },
};
