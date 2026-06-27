import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
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
    requireClinicStaffRole,
    createDoctorController
);

doctorRouter.get(
    '/:clinicId/doctors',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
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
    requireClinicStaffRole,
    updateDoctorController
);

export { doctorRouter };
