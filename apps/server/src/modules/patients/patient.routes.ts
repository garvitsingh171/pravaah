import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createPatientController } from './patient.controller.js';
import { clinicIdParamsSchema, createPatientSchema } from './patient.validation.js';

const patientRouter = Router();

patientRouter.post(
    '/:clinicId/patients',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createPatientSchema,
    }),
    createPatientController
);

export { patientRouter };
