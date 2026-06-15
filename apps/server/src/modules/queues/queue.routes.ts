import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { listQueueByClinicDateController } from './queue.controller.js';
import { listQueueQuerySchema, queueClinicIdParamsSchema } from './queue.validation.js';

const queueRouter = Router();

queueRouter.get(
    '/:clinicId/queue',
    validateRequest({
        params: queueClinicIdParamsSchema,
        query: listQueueQuerySchema,
    }),
    listQueueByClinicDateController
);

export { queueRouter };
