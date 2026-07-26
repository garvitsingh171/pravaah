import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError.js';
import { authService } from './auth.service.js';
import type { OnboardingClinicInput } from './auth.types.js';

export async function getCurrentUserController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const user = await authService.getCurrentUserProfile(req.user);

        res.status(200).json({
            success: true,
            message: 'Current user fetched successfully',
            data: {
                user,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getOnboardingStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authIdentity) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const result = await authService.getOnboardingStatus(req.authIdentity.clerkUserId);

        res.status(200).json({
            success: true,
            message: 'Onboarding status retrieved successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function createClinicOnboardingController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.authIdentity) {
            throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
        }

        const clinicData = req.body as OnboardingClinicInput;
        const result = await authService.createClinicOnboarding(
            req.authIdentity.clerkUserId,
            clinicData
        );
        const isReplay = result.outcome === 'ALREADY_COMPLETED';

        res.status(isReplay ? 200 : 201).json({
            success: true,
            message: isReplay
                ? 'Clinic onboarding already completed'
                : 'Clinic onboarding completed successfully',
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
}
