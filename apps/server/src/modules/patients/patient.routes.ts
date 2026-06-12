import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
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

patientRouter.get(
    '/:clinicId/patients',
    validateRequest({
        params: clinicIdParamsSchema,
        query: listPatientsQuerySchema,
    }),
    listPatientsByClinicController
);

export { patientRouter };
