import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import {
    OnboardingNextStep,
    OnboardingStatus,
    type AuthenticatedUser,
    type CurrentUserProfile,
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
};
