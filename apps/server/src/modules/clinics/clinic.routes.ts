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
    retryClinicGeocodingController,
    updateClinicController,
} from './clinic.controller.js';
import {
    updateClinicSchema,
    clinicIdParamsSchema,
    provisionSampleDataBodySchema,
    retryClinicGeocodingBodySchema,
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
    '/:clinicId/geocode',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: retryClinicGeocodingBodySchema,
    }),
    requireClinicAccess,
    requireAdminRole,
    retryClinicGeocodingController
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
