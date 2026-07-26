import { clerkClient, type User } from '@clerk/express';
import { AppError } from '../../utils/AppError.js';
import type { TrustedClerkUserIdentity } from './auth.types.js';

const identityDataMissingError = () =>
    new AppError(
        422,
        'CLERK_IDENTITY_DATA_MISSING',
        'Clerk identity is missing required profile data'
    );

const resolvePrimaryEmail = (user: User): string => {
    const primaryEmail = user.emailAddresses.find(
        (emailAddress) => emailAddress.id === user.primaryEmailAddressId
    );
    const email = primaryEmail?.emailAddress.trim();

    if (!email) {
        throw identityDataMissingError();
    }

    return email;
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
};
