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
    createPatientController,
    archivePatientController,
    getPatientByClinicController,
    getPatientLifecycleImpactController,
    listPatientsByClinicController,
    retryPatientGeocodingController,
    retryPatientRoutingController,
    updatePatientController,
    restorePatientController,
} from './patient.controller.js';
import {
    clinicIdParamsSchema,
    clinicPatientIdParamsSchema,
    createPatientSchema,
    listPatientsQuerySchema,
    retryPatientGeocodingBodySchema,
    retryPatientRoutingBodySchema,
    updatePatientSchema,
} from './patient.validation.js';

const patientRouter = Router();

patientRouter.post(
    '/:clinicId/patients',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: createPatientSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('provider'),
    createPatientController
);

patientRouter.post(
    '/:clinicId/patients/:patientId/route',
    authenticateRequest,
    validateRequest({
        params: clinicPatientIdParamsSchema,
        body: retryPatientRoutingBodySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('provider'),
    retryPatientRoutingController
);

patientRouter.patch(
    '/:clinicId/patients/:patientId',
    authenticateRequest,
    validateRequest({
        params: clinicPatientIdParamsSchema,
        body: updatePatientSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('provider'),
    updatePatientController
);

patientRouter.post(
    '/:clinicId/patients/:patientId/geocode',
    authenticateRequest,
    validateRequest({
        params: clinicPatientIdParamsSchema,
        body: retryPatientGeocodingBodySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('provider'),
    retryPatientGeocodingController
);

patientRouter.get(
    '/:clinicId/patients',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        query: listPatientsQuerySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('collection'),
    listPatientsByClinicController
);

patientRouter.get(
    '/:clinicId/patients/:patientId',
    authenticateRequest,
    validateRequest({ params: clinicPatientIdParamsSchema }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('collection'),
    getPatientByClinicController
);

patientRouter.get(
    '/:clinicId/patients/:patientId/lifecycle-impact',
    authenticateRequest,
    validateRequest({ params: clinicPatientIdParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('collection'),
    getPatientLifecycleImpactController
);

patientRouter.delete(
    '/:clinicId/patients/:patientId',
    authenticateRequest,
    validateRequest({ params: clinicPatientIdParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('mutation'),
    archivePatientController
);

patientRouter.post(
    '/:clinicId/patients/:patientId/restore',
    authenticateRequest,
    validateRequest({ params: clinicPatientIdParamsSchema }),
    requireClinicAccess,
    requireAdminRole,
    rateLimit('mutation'),
    restorePatientController
);

export { patientRouter };
