import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createDoctorController, listDoctorsByClinicController } from './doctor.controller.js';
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

doctorRouter.get(
    '/:clinicId/doctors',
    validateRequest({
        params: clinicIdParamsSchema,
    }),
    listDoctorsByClinicController
);

export { doctorRouter };
