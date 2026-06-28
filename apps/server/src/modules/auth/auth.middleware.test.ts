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

import { authenticateRequest } from './auth.middleware.js';

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
        const user = {
            id: 'user-id',
            clerkUserId: 'clerk-user-id',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            clinicId: 'clinic-id',
        };

        mockGetAuth.mockReturnValue({
            isAuthenticated: true,
            userId: 'clerk-user-id',
        });
        mockAuthService.getActiveUserByClerkUserId.mockResolvedValue(user);

        await authenticateRequest(req, createResponse(), next);

        expect(mockAuthService.getActiveUserByClerkUserId).toHaveBeenCalledWith('clerk-user-id');
        expect(req.user).toEqual(user);
        expect(next).toHaveBeenCalledWith();
    });
});
