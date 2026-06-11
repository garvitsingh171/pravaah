import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createDoctorController } from './doctor.controller.js';
import { createDoctorSchema, clinicIdParamsSchema } from './doctor.validation.js';

const doctorRouter = Router();

doctorRouter.post(
    '/:clinicId/doctors',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createDoctorSchema,
    }),
    createDoctorController
);

export { doctorRouter };
