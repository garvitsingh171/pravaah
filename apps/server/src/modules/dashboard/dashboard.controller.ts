import type { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service.js';
import type {
    DashboardClinicIdParamsInput,
    DashboardSummaryQueryInput,
    HighRiskAppointmentsQueryInput,
} from './dashboard.types.js';

export async function getDashboardSummaryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as DashboardClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as DashboardSummaryQueryInput;

        const dashboardSummary = await dashboardService.getDashboardSummary(
            req.user,
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

export async function getHighRiskAppointmentsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as DashboardClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as HighRiskAppointmentsQueryInput;

        const result = await dashboardService.getHighRiskAppointments(req.user, clinicId, date);

        res.status(200).json({
            success: true,
            message: 'High-risk appointments fetched successfully',
            data: result,
        });
    } catch (error) {
        next(error);
    }
}

export async function getTodayActivityController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as DashboardClinicIdParamsInput;

        const result = await dashboardService.getTodayActivity(req.user, clinicId);

        res.status(200).json({
            success: true,
            message: "Today's clinic activity fetched successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
}
