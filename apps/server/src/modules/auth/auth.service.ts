import { UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import type { AuthenticatedUser, CurrentUserProfile } from './auth.types.js';

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
            throw new AppError(403, 'USER_INACTIVE', 'User account is not active');
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
            throw new AppError(403, 'USER_INACTIVE', 'User account is not active');
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
            throw new AppError(403, 'USER_INACTIVE', 'User account is not active');
        }

        return user;
    },
};
