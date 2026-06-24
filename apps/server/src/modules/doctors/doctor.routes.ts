import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateRequest, requireClinicAccess } from '../auth/auth.middleware.js';
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
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: createDoctorSchema,
    }),
    requireClinicAccess,
    createDoctorController
);

doctorRouter.get(
    '/:clinicId/doctors',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
    }),
    requireClinicAccess,
    listDoctorsByClinicController
);

doctorRouter.patch(
    '/:clinicId/doctors/:doctorId',
    authenticateRequest,
    validateRequest({
        params: doctorClinicParamsSchema,
        body: updateDoctorSchema,
    }),
    requireClinicAccess,
    updateDoctorController
);

export { doctorRouter };
