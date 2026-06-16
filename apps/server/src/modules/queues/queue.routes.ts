import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
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
    validateRequest({
        params: queueClinicIdParamsSchema,
        query: listQueueQuerySchema,
    }),
    listQueueByClinicDateController
);

queueRouter.patch(
    '/:clinicId/queue/reorder',
    validateRequest({
        params: queueClinicIdParamsSchema,
        body: reorderQueueBodySchema,
    }),
    reorderQueueController
);

queueRouter.patch(
    '/:clinicId/queue/:queueEntryId/status',
    validateRequest({
        params: queueStatusUpdateParamsSchema,
        body: updateQueueStatusBodySchema,
    }),
    updateQueueStatusController
);

export { queueRouter };
