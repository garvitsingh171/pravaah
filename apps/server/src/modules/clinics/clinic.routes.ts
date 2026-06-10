import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createClinicController, updateClinicController } from './clinic.controller.js';
import { createClinicSchema, updateClinicSchema, clinicIdParamsSchema } from './clinic.validation.js';

const clinicRouter = Router();

clinicRouter.post('/', validateRequest({ body: createClinicSchema }), createClinicController);

clinicRouter.patch(
    '/:clinicId',
    validateRequest({
        params: clinicIdParamsSchema,
        body: updateClinicSchema,
    }),
    updateClinicController
);

export { clinicRouter };
