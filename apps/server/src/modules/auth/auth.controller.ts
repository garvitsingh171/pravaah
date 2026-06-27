import type { NextFunction, Request, Response } from 'express';
import { authService } from './auth.service.js';

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
