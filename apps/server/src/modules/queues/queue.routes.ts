import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
import {
    listQueueByClinicDateController,
    reorderQueueController,
    updateQueueStatusController,
} from './queue.controller.js';
import {
    listQueueQuerySchema,
    queueClinicIdParamsSchema,
    queueStatusUpdateParamsSchema,
    reorderQueueBodySchema,
    updateQueueStatusBodySchema,
} from './queue.validation.js';

const queueRouter = Router();

queueRouter.get(
    '/:clinicId/queue',
    authenticateRequest,
    validateRequest({
        params: queueClinicIdParamsSchema,
        query: listQueueQuerySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    listQueueByClinicDateController
);

queueRouter.patch(
    '/:clinicId/queue/reorder',
    authenticateRequest,
    validateRequest({
        params: queueClinicIdParamsSchema,
        body: reorderQueueBodySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    reorderQueueController
);

queueRouter.patch(
    '/:clinicId/queue/:queueEntryId/status',
    authenticateRequest,
    validateRequest({
        params: queueStatusUpdateParamsSchema,
        body: updateQueueStatusBodySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    updateQueueStatusController
);

export { queueRouter };
