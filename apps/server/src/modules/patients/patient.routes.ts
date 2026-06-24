import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { authenticateRequest, requireClinicAccess } from '../auth/auth.middleware.js';
import {
    createPatientController,
    listPatientsByClinicController,
    updatePatientController,
} from './patient.controller.js';
import {
    clinicIdParamsSchema,
    clinicPatientIdParamsSchema,
    createPatientSchema,
    listPatientsQuerySchema,
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
    updatePatientController
);

patientRouter.get(
    '/:clinicId/patients',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        query: listPatientsQuerySchema,
    }),
    requireClinicAccess,
    listPatientsByClinicController
);

export { patientRouter };
