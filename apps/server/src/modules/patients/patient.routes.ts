import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
import {
    createPatientController,
    listPatientsByClinicController,
    retryPatientGeocodingController,
    updatePatientController,
} from './patient.controller.js';
import {
    clinicIdParamsSchema,
    clinicPatientIdParamsSchema,
    createPatientSchema,
    listPatientsQuerySchema,
    retryPatientGeocodingBodySchema,
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
    createPatientController
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
    listPatientsByClinicController
);

export { patientRouter };
