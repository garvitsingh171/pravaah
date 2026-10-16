import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireAdminRole,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
import {
    createDoctorController,
    archiveDoctorController,
    getDoctorByClinicController,
    getDoctorLifecycleImpactController,
    getDoctorAvailabilityController,
    listDoctorsByClinicController,
    replaceDoctorAvailabilityController,
    restoreDoctorController,
    updateDoctorController,
} from './doctor.controller.js';
import {
    createDoctorSchema,
    updateDoctorSchema,
    clinicIdParamsSchema,
    doctorClinicParamsSchema,
    replaceDoctorAvailabilitySchema,
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

doctorRouter.get(
    '/:clinicId/doctors/:doctorId',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireClinicStaffRole,
    getDoctorByClinicController
);

doctorRouter.get(
    '/:clinicId/doctors/:doctorId/lifecycle-impact',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    getDoctorLifecycleImpactController
);

doctorRouter.delete(
    '/:clinicId/doctors/:doctorId',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    archiveDoctorController
);

doctorRouter.post(
    '/:clinicId/doctors/:doctorId/restore',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    restoreDoctorController
);

doctorRouter.get(
    '/:clinicId/doctors/:doctorId/availability',
    authenticateRequest,
    validateRequest({
        params: doctorClinicParamsSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    getDoctorAvailabilityController
);

doctorRouter.put(
    '/:clinicId/doctors/:doctorId/availability',
    authenticateRequest,
    validateRequest({
        params: doctorClinicParamsSchema,
        body: replaceDoctorAvailabilitySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    replaceDoctorAvailabilityController
);

export { doctorRouter };
