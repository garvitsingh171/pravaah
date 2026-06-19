import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { dashboardService } from './dashboard.service.js';
import type {
    DashboardClinicIdParamsInput,
    DashboardSummaryQueryInput,
} from './dashboard.types.js';

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
    };
};

export async function getDashboardSummaryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authenticatedReq = req as AuthenticatedRequest;

        if (!authenticatedReq.user?.id) {
            throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
        }

        const { clinicId } = req.params as DashboardClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as DashboardSummaryQueryInput;

        const dashboardSummary = await dashboardService.getDashboardSummary(
            authenticatedReq.user.id,
            clinicId,
            date
        );

        res.status(200).json({
            success: true,
            message: 'Dashboard summary fetched successfully',
            data: {
                dashboardSummary,
            },
        });
    } catch (error) {
        next(error);
    }
}
