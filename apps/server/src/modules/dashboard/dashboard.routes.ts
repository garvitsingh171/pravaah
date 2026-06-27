import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
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
    requireClinicStaffRole,
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
    requireClinicStaffRole,
    getHighRiskAppointmentsController
);

dashboardRouter.get(
    '/:clinicId/dashboard/today-activity',
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    getTodayActivityController
);

export { dashboardRouter };
