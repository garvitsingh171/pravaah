import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireAdminRole,
    requireClinicAccess,
} from '../auth/auth.middleware.js';
import {
    createClinicController,
    getClinicSettingsController,
    provisionSampleDataController,
    updateClinicController,
} from './clinic.controller.js';
import {
    updateClinicSchema,
    clinicIdParamsSchema,
    provisionSampleDataBodySchema,
} from './clinic.validation.js';

const clinicRouter = Router();

clinicRouter.post('/', authenticateRequest, requireAdminRole, createClinicController);

clinicRouter.get(
    '/:clinicId',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
    }),
    requireClinicAccess,
    requireAdminRole,
    getClinicSettingsController
);

clinicRouter.patch(
    '/:clinicId',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: updateClinicSchema,
    }),
    requireClinicAccess,
    requireAdminRole,
    updateClinicController
);

clinicRouter.post(
    '/:clinicId/sample-data',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: provisionSampleDataBodySchema,
    }),
    requireClinicAccess,
    requireAdminRole,
    provisionSampleDataController
);

export { clinicRouter };
