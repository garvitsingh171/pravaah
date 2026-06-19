import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { getDashboardSummaryController } from './dashboard.controller.js';
import {
    dashboardClinicIdParamsSchema,
    dashboardSummaryQuerySchema,
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

export { dashboardRouter };
