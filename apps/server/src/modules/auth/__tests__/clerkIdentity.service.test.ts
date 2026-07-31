import type { User } from '@clerk/express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../utils/AppError.js';

const mockClerkClient = vi.hoisted(() => ({
    users: {
        getUser: vi.fn(),
    },
}));

vi.mock('@clerk/express', () => ({
    clerkClient: mockClerkClient,
}));

import { clerkIdentityService } from '../clerkIdentity.service.js';

const createClerkUser = (overrides: Partial<User> = {}): User =>
    ({
        primaryEmailAddressId: 'primary-email-id',
        emailAddresses: [
            {
                id: 'secondary-email-id',
                emailAddress: 'secondary@example.com',
            },
            {
                id: 'primary-email-id',
                emailAddress: ' admin@example.com ',
            },
        ],
        firstName: ' Clinic ',
        lastName: ' Admin ',
        ...overrides,
    }) as User;

describe('clerkIdentityService.getTrustedUserIdentity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches the Clerk user and selects the primary email address', async () => {
        mockClerkClient.users.getUser.mockResolvedValue(createClerkUser());

        await expect(
            clerkIdentityService.getTrustedUserIdentity('trusted-clerk-user-id')
        ).resolves.toEqual({
            clerkUserId: 'trusted-clerk-user-id',
            email: 'admin@example.com',
            fullName: 'Clinic Admin',
        });

        expect(mockClerkClient.users.getUser).toHaveBeenCalledWith('trusted-clerk-user-id');
    });

    it('throws CLERK_IDENTITY_DATA_MISSING when the primary email is unavailable', async () => {
        mockClerkClient.users.getUser.mockResolvedValue(
            createClerkUser({
                primaryEmailAddressId: 'missing-email-id',
            })
        );

        await expect(
            clerkIdentityService.getTrustedUserIdentity('trusted-clerk-user-id')
        ).rejects.toThrow(
            new AppError(
                422,
                'CLERK_IDENTITY_DATA_MISSING',
                'Clerk identity is missing required profile data'
            )
        );
    });

    it('throws CLERK_IDENTITY_DATA_MISSING when no usable trusted name exists', async () => {
        mockClerkClient.users.getUser.mockResolvedValue(
            createClerkUser({
                firstName: ' ',
                lastName: null,
            })
        );

        await expect(
            clerkIdentityService.getTrustedUserIdentity('trusted-clerk-user-id')
        ).rejects.toThrow(
            new AppError(
                422,
                'CLERK_IDENTITY_DATA_MISSING',
                'Clerk identity is missing required profile data'
            )
        );
    });

    it('uses the available trusted name part when one Clerk name value is missing', async () => {
        mockClerkClient.users.getUser.mockResolvedValue(
            createClerkUser({
                firstName: 'Asha',
                lastName: null,
            })
        );

        await expect(
            clerkIdentityService.getTrustedUserIdentity('trusted-clerk-user-id')
        ).resolves.toMatchObject({
            fullName: 'Asha',
        });
    });

    it('maps Clerk lookup failures to a safe auth error', async () => {
        mockClerkClient.users.getUser.mockRejectedValue(
            new Error('raw Clerk backend response should not leak')
        );

        await expect(
            clerkIdentityService.getTrustedUserIdentity('trusted-clerk-user-id')
        ).rejects.toThrow(
            new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid or expired')
        );
    });
});
