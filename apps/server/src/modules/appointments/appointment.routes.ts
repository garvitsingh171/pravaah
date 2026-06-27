import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
import {
    createAppointmentController,
    listAppointmentsController,
    updateAppointmentStatusController,
} from './appointment.controller.js';
import {
    appointmentIdParamsSchema,
    clinicIdParamsSchema,
    createAppointmentSchema,
    listAppointmentsQuerySchema,
    updateAppointmentStatusSchema,
} from './appointment.validation.js';

const clinicAppointmentRouter = Router();
const appointmentRouter = Router();

clinicAppointmentRouter.post(
    '/:clinicId/appointments',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        body: createAppointmentSchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    createAppointmentController
);

clinicAppointmentRouter.get(
    '/:clinicId/appointments',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        query: listAppointmentsQuerySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    listAppointmentsController
);

appointmentRouter.patch(
    '/appointments/:appointmentId/status',
    authenticateRequest,
    validateRequest({
        params: appointmentIdParamsSchema,
        body: updateAppointmentStatusSchema,
    }),
    requireClinicStaffRole,
    updateAppointmentStatusController
);

export { appointmentRouter, clinicAppointmentRouter };
