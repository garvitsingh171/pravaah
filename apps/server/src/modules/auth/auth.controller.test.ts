import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole, UserStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { OnboardingNextStep, OnboardingStatus } from './auth.types.js';

const mockAuthService = vi.hoisted(() => ({
    getActiveUserByClerkUserId: vi.fn(),
    getCurrentUserProfile: vi.fn(),
    getOnboardingStatus: vi.fn(),
}));

vi.mock('./auth.service.js', () => ({
    authService: mockAuthService,
}));

import { getOnboardingStatusController } from './auth.controller.js';

describe('getOnboardingStatusController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns onboarding status from the trusted Clerk identity context', async () => {
        const result = {
            onboarding: {
                status: OnboardingStatus.COMPLETED,
                nextStep: OnboardingNextStep.OPEN_APPLICATION,
                isComplete: true,
            },
            user: {
                id: 'user-id',
                fullName: 'Dr. Asha Rao',
                email: 'asha@example.com',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
            },
            clinic: {
                id: 'clinic-id',
                name: 'Pravaah Family Clinic',
                slug: 'pravaah-family-clinic',
            },
        };
        const req = {
            authIdentity: {
                clerkUserId: 'trusted-clerk-user-id',
            },
            params: {
                clerkUserId: 'params-clerk-user-id',
            },
            query: {
                clerkUserId: 'query-clerk-user-id',
            },
            body: {
                clerkUserId: 'body-clerk-user-id',
            },
        } as unknown as Request;
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res = {
            status,
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        mockAuthService.getOnboardingStatus.mockResolvedValue(result);

        await getOnboardingStatusController(req, res, next);

        expect(mockAuthService.getOnboardingStatus).toHaveBeenCalledWith('trusted-clerk-user-id');
        expect(mockAuthService.getOnboardingStatus).not.toHaveBeenCalledWith(
            'params-clerk-user-id'
        );
        expect(mockAuthService.getOnboardingStatus).not.toHaveBeenCalledWith('query-clerk-user-id');
        expect(mockAuthService.getOnboardingStatus).not.toHaveBeenCalledWith('body-clerk-user-id');
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            success: true,
            message: 'Onboarding status retrieved successfully',
            data: result,
        });
    });

    it('passes service errors to next', async () => {
        const req = {
            authIdentity: {
                clerkUserId: 'trusted-clerk-user-id',
            },
        } as unknown as Request;
        const res = {
            status: vi.fn(),
        } as unknown as Response;
        const next = vi.fn() as NextFunction;
        const error = new Error('database unavailable');

        mockAuthService.getOnboardingStatus.mockRejectedValue(error);

        await getOnboardingStatusController(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
    });

    it('requires trusted identity context', async () => {
        const req = {} as Request;
        const res = {
            status: vi.fn(),
        } as unknown as Response;
        const next = vi.fn() as NextFunction;

        await getOnboardingStatusController(req, res, next);

        expect(mockAuthService.getOnboardingStatus).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(
            new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required')
        );
    });
});
