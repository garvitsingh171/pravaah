import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';

const mockGetAuth = vi.hoisted(() => vi.fn());
const mockAuthService = vi.hoisted(() => ({
    getActiveUserByClerkUserId: vi.fn(),
}));

vi.mock('@clerk/express', () => ({
    getAuth: mockGetAuth,
}));

vi.mock('./auth.service.js', () => ({
    authService: mockAuthService,
}));

import { authenticateClerkIdentity, authenticateRequest } from './auth.middleware.js';

const createRequest = (authorizationHeader?: string): Request => {
    return {
        header: vi.fn((name: string) => {
            if (name.toLowerCase() === 'authorization') {
                return authorizationHeader;
            }

            return undefined;
        }),
    } as unknown as Request;
};

const createResponse = (): Response => {
    return {} as Response;
};

const activeAdminUser = {
    id: 'admin-user-id',
    clerkUserId: 'admin-clerk-user-id',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

const activeStaffUser = {
    id: 'staff-user-id',
    clerkUserId: 'staff-clerk-user-id',
    role: UserRole.STAFF,
    status: UserStatus.ACTIVE,
    clinicId: 'clinic-id',
};

describe('authenticateClerkIdentity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects requests without an Authorization header', async () => {
        const next = vi.fn() as NextFunction;

        await authenticateClerkIdentity(createRequest(), createResponse(), next);

        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );
        expect(mockGetAuth).not.toHaveBeenCalled();
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('rejects malformed Authorization headers', async () => {
        const next = vi.fn() as NextFunction;

        await authenticateClerkIdentity(createRequest('Token invalid'), createResponse(), next);

        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid or expired')
        );
        expect(mockGetAuth).not.toHaveBeenCalled();
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('rejects invalid or expired Clerk tokens', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer invalid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: false,
            userId: null,
        });

        await authenticateClerkIdentity(req, createResponse(), next);

        expect(mockGetAuth).toHaveBeenCalledWith(req);
        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid or expired')
        );
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('sets Clerk identity context for a valid Clerk identity without loading an internal user', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'clerk-user-id',
        });

        await authenticateClerkIdentity(req, createResponse(), next);

        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
        expect(req.authIdentity).toEqual({
            clerkUserId: 'clerk-user-id',
        });
        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });

    it('does not require an internal user for a valid Clerk identity', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'unprovisioned-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockRejectedValue(
            new AppError(
                401,
                'INTERNAL_USER_NOT_FOUND',
                'Authenticated user is not registered in Pravaah'
            )
        );

        await authenticateClerkIdentity(req, createResponse(), next);

        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
        expect(req.authIdentity).toEqual({
            clerkUserId: 'unprovisioned-clerk-user-id',
        });
        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith();
    });
});

describe('authenticateRequest', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('rejects requests without an Authorization header', async () => {
        const next = vi.fn() as NextFunction;

        await authenticateRequest(createRequest(), createResponse(), next);

        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );
        expect(mockGetAuth).not.toHaveBeenCalled();
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('rejects malformed Authorization headers', async () => {
        const next = vi.fn() as NextFunction;

        await authenticateRequest(createRequest('Token invalid'), createResponse(), next);

        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid or expired')
        );
        expect(mockGetAuth).not.toHaveBeenCalled();
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('rejects invalid or expired Clerk tokens', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer invalid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: false,
            userId: null,
        });

        await authenticateRequest(req, createResponse(), next);

        expect(mockGetAuth).toHaveBeenCalledWith(req);
        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'INVALID_AUTH_TOKEN', 'Authentication token is invalid or expired')
        );
        expect(mockAuthService.getActiveUserByClerkUserId).not.toHaveBeenCalled();
    });

    it('loads the internal user for a valid Clerk identity', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'admin-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockResolvedValue(activeAdminUser);

        await authenticateRequest(req, createResponse(), next);

        expect(mockAuthService.getActiveUserByClerkUserId).toHaveBeenCalledWith(
            'admin-clerk-user-id'
        );
        expect(req.authIdentity).toEqual({
            clerkUserId: 'admin-clerk-user-id',
        });
        expect(req.user).toEqual(activeAdminUser);
        expect(next).toHaveBeenCalledWith();
    });

    it('preserves INTERNAL_USER_NOT_FOUND for operational authentication', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');
        const internalUserNotFoundError = new AppError(
            401,
            'INTERNAL_USER_NOT_FOUND',
            'Authenticated user is not registered in Pravaah'
        );

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'unprovisioned-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockRejectedValue(internalUserNotFoundError);

        await authenticateRequest(req, createResponse(), next);

        expect(req.authIdentity).toEqual({
            clerkUserId: 'unprovisioned-clerk-user-id',
        });
        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(internalUserNotFoundError);
    });

    it('preserves USER_NOT_ACTIVE for inactive internal users', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');
        const inactiveUserError = new AppError(403, 'USER_NOT_ACTIVE', 'User is not active');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'inactive-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockRejectedValue(inactiveUserError);

        await authenticateRequest(req, createResponse(), next);

        expect(req.authIdentity).toEqual({
            clerkUserId: 'inactive-clerk-user-id',
        });
        expect(req.user).toBeUndefined();
        expect(next).toHaveBeenCalledWith(inactiveUserError);
    });

    it('allows an active Admin through operational authentication', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'admin-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockResolvedValue(activeAdminUser);

        await authenticateRequest(req, createResponse(), next);

        expect(req.user).toEqual(activeAdminUser);
        expect(next).toHaveBeenCalledWith();
    });

    it('allows an active Staff user through operational authentication', async () => {
        const next = vi.fn() as NextFunction;
        const req = createRequest('Bearer valid-token');

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'staff-clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockResolvedValue(activeStaffUser);

        await authenticateRequest(req, createResponse(), next);

        expect(req.user).toEqual(activeStaffUser);
        expect(next).toHaveBeenCalledWith();
    });
});
