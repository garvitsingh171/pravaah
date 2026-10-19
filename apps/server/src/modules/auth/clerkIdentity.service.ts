import { clerkClient, type User } from '@clerk/express';
import { AppError } from '../../utils/AppError.js';
import { normalizeEmail } from '../../utils/emailNormalization.js';
import type { TrustedClerkUserIdentity } from './auth.types.js';

const identityDataMissingError = () =>
    new AppError(
        422,
        'CLERK_IDENTITY_DATA_MISSING',
        'Clerk identity is missing required profile data'
    );

const getPrimaryEmailAddress = (user: User) => {
    const primaryEmail = user.emailAddresses.find(
        (emailAddress) => emailAddress.id === user.primaryEmailAddressId
    );
    if (!primaryEmail?.emailAddress.trim()) throw identityDataMissingError();
    return primaryEmail;
};

const resolvePrimaryEmail = (user: User): string => {
    const email = getPrimaryEmailAddress(user).emailAddress.trim();

    if (!email) {
        throw identityDataMissingError();
    }

    return normalizeEmail(email);
};

const resolveFullName = (user: User): string => {
    const firstName = user.firstName?.trim() ?? '';
    const lastName = user.lastName?.trim() ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    if (!fullName) {
        throw identityDataMissingError();
    }

    return fullName;
};

export const clerkIdentityService = {
    async getTrustedUserIdentity(clerkUserId: string): Promise<TrustedClerkUserIdentity> {
        let user: User;

        try {
            user = await clerkClient.users.getUser(clerkUserId);
        } catch {
            throw new AppError(
                401,
                'INVALID_AUTH_TOKEN',
                'Authentication token is invalid or expired'
            );
        }

        return {
            clerkUserId,
            email: resolvePrimaryEmail(user),
            fullName: resolveFullName(user),
        };
    },

    async getVerifiedUserIdentity(clerkUserId: string): Promise<TrustedClerkUserIdentity> {
        let user: User;
        try {
            user = await clerkClient.users.getUser(clerkUserId);
        } catch {
            throw new AppError(
                401,
                'INVALID_AUTH_TOKEN',
                'Authentication token is invalid or expired'
            );
        }
        if (getPrimaryEmailAddress(user).verification?.status !== 'verified') {
            throw new AppError(
                403,
                'CLERK_EMAIL_NOT_VERIFIED',
                'Verify your email address in Clerk before accepting this invitation'
            );
        }
        return {
            clerkUserId,
            email: resolvePrimaryEmail(user),
            fullName: resolveFullName(user),
        };
    },
};
