import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    createDoctorController,
    listDoctorsByClinicController,
    updateDoctorController,
} from './doctor.controller.js';
import {
    createDoctorSchema,
    updateDoctorSchema,
    clinicIdParamsSchema,
    doctorClinicParamsSchema,
} from './doctor.validation.js';

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

doctorRouter.patch(
    '/:clinicId/doctors/:doctorId',
    validateRequest({
        params: doctorClinicParamsSchema,
        body: updateDoctorSchema,
    }),
    updateDoctorController
);

export { doctorRouter };
