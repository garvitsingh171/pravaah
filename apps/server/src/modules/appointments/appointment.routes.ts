import { rateLimit } from '../../middleware/rateLimit.js';
import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    authenticateRequest,
    requireClinicAccess,
    requireClinicStaffRole,
} from '../auth/auth.middleware.js';
import {
    createAppointmentController,
    listAppointmentActivitiesController,
    listAppointmentRescheduleSlotsController,
    listAvailableAppointmentSlotsController,
    listAppointmentsController,
    rescheduleAppointmentController,
    updateAppointmentStatusController,
} from './appointment.controller.js';
import {
    appointmentIdParamsSchema,
    availableAppointmentSlotsQuerySchema,
    clinicIdParamsSchema,
    createAppointmentSchema,
    listAppointmentsQuerySchema,
    rescheduleAppointmentSchema,
    rescheduleAppointmentSlotsQuerySchema,
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
    rateLimit('mutation'),
    createAppointmentController
);

clinicAppointmentRouter.get(
    '/:clinicId/appointments/available-slots',
    authenticateRequest,
    validateRequest({
        params: clinicIdParamsSchema,
        query: availableAppointmentSlotsQuerySchema,
    }),
    requireClinicAccess,
    requireClinicStaffRole,
    rateLimit('collection'),
    listAvailableAppointmentSlotsController
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
    rateLimit('collection'),
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
    rateLimit('mutation'),
    updateAppointmentStatusController
);

appointmentRouter.get(
    '/appointments/:appointmentId/activities',
    authenticateRequest,
    validateRequest({
        params: appointmentIdParamsSchema,
    }),
    requireClinicStaffRole,
    rateLimit('collection'),
    listAppointmentActivitiesController
);

appointmentRouter.get(
    '/appointments/:appointmentId/reschedule-slots',
    authenticateRequest,
    validateRequest({
        params: appointmentIdParamsSchema,
        query: rescheduleAppointmentSlotsQuerySchema,
    }),
    requireClinicStaffRole,
    rateLimit('collection'),
    listAppointmentRescheduleSlotsController
);

appointmentRouter.patch(
    '/appointments/:appointmentId/reschedule',
    authenticateRequest,
    validateRequest({
        params: appointmentIdParamsSchema,
        body: rescheduleAppointmentSchema,
    }),
    requireClinicStaffRole,
    rateLimit('mutation'),
    rescheduleAppointmentController
);

export { appointmentRouter, clinicAppointmentRouter };
