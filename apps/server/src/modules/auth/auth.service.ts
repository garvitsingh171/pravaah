import { UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import type { AuthenticatedUser } from './auth.types.js';

export const authService = {
    async getActiveUserByClerkUserId(clerkUserId: string): Promise<AuthenticatedUser> {
        const user = await authRepository.findUserByClerkUserId(clerkUserId);

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
