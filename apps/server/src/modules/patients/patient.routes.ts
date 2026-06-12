import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createPatientController, updatePatientController } from './patient.controller.js';
import {
    clinicIdParamsSchema,
    clinicPatientIdParamsSchema,
    createPatientSchema,
    updatePatientSchema,
} from './patient.validation.js';

const patientRouter = Router();

patientRouter.post(
    '/:clinicId/patients',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createPatientSchema,
    }),
    createPatientController
);

patientRouter.patch(
    '/:clinicId/patients/:patientId',
    validateRequest({
        params: clinicPatientIdParamsSchema,
        body: updatePatientSchema,
    }),
    updatePatientController
);

export { patientRouter };
