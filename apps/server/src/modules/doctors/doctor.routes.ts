import { rateLimit } from '../../middleware/rateLimit.js';
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
    rateLimit('mutation'),
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
    rateLimit('collection'),
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
    rateLimit('mutation'),
    updateDoctorController
);

doctorRouter.get(
    '/:clinicId/doctors/:doctorId',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('collection'),
    getDoctorByClinicController
);

doctorRouter.get(
    '/:clinicId/doctors/:doctorId/lifecycle-impact',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('collection'),
    getDoctorLifecycleImpactController
);

doctorRouter.delete(
    '/:clinicId/doctors/:doctorId',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('mutation'),
    archiveDoctorController
);

doctorRouter.post(
    '/:clinicId/doctors/:doctorId/restore',
    authenticateRequest,
    validateRequest({ params: doctorClinicParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('mutation'),
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
    rateLimit('collection'),
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
    rateLimit('mutation'),
    replaceDoctorAvailabilityController
);

export { doctorRouter };
