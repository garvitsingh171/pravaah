import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateRequest, requireClinicAccess } from '../auth/auth.middleware.js';
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
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
        query: dashboardSummaryQuerySchema,
    }),
    requireClinicAccess,
    getDashboardSummaryController
);

dashboardRouter.get(
    '/:clinicId/dashboard/high-risk-appointments',
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
        query: highRiskAppointmentsQuerySchema,
    }),
    requireClinicAccess,
    getHighRiskAppointmentsController
);

dashboardRouter.get(
    '/:clinicId/dashboard/today-activity',
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
    }),
    requireClinicAccess,
    getTodayActivityController
);

export { dashboardRouter };
