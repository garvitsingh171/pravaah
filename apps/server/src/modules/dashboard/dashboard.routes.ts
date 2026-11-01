import { rateLimit } from '../../middleware/rateLimit.js';
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
    getNoShowIntelligenceController,
} from './dashboard.controller.js';
import {
    dashboardClinicIdParamsSchema,
    dashboardSummaryQuerySchema,
    highRiskAppointmentsQuerySchema,
    noShowIntelligenceQuerySchema,
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
    rateLimit('dashboard'),
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
    rateLimit('dashboard'),
    getHighRiskAppointmentsController
);

dashboardRouter.get(
    '/:clinicId/dashboard/no-show-intelligence',
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
        query: noShowIntelligenceQuerySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('dashboard'),
    getNoShowIntelligenceController
);

dashboardRouter.get(
    '/:clinicId/dashboard/today-activity',
    authenticateRequest,
    validateRequest({
        params: dashboardClinicIdParamsSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('dashboard'),
    getTodayActivityController
);

export { dashboardRouter };
