import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    getDashboardSummaryController,
    getHighRiskAppointmentsController,
    getTodayActivityController,
} from './dashboard.controller.js';
import {
    dashboardClinicIdParamsSchema,
    dashboardSummaryQuerySchema,
    highRiskAppointmentsQuerySchema,
} from './dashboard.validation.js';

const dashboardRouter = Router();

dashboardRouter.get(
    '/:clinicId/dashboard/summary',
    validateRequest({
        params: dashboardClinicIdParamsSchema,
        query: dashboardSummaryQuerySchema,
    }),
    getDashboardSummaryController
);

dashboardRouter.get(
    '/:clinicId/dashboard/high-risk-appointments',
    validateRequest({
        params: dashboardClinicIdParamsSchema,
        query: highRiskAppointmentsQuerySchema,
    }),
    getHighRiskAppointmentsController
);

dashboardRouter.get(
    '/:clinicId/dashboard/today-activity',
    validateRequest({
        params: dashboardClinicIdParamsSchema,
    }),
    getTodayActivityController
);

export { dashboardRouter };
