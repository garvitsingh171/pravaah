import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    createAppointmentController,
    listAppointmentsController,
    updateAppointmentStatusController,
} from './appointment.controller.js';
import {
    clinicIdParamsSchema,
    createAppointmentSchema,
    listAppointmentsQuerySchema,
    appointmentIdParamsSchema,
    updateAppointmentStatusSchema,
} from './appointment.validation.js';

const appointmentRouter = Router();

appointmentRouter.post(
    '/:clinicId/appointments',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createAppointmentSchema,
    }),
    createAppointmentController
);

appointmentRouter.get(
    '/:clinicId/appointments',
    validateRequest({
        params: clinicIdParamsSchema,
        query: listAppointmentsQuerySchema,
    }),
    listAppointmentsController
);

appointmentRouter.patch(
    '/appointments/:appointmentId/status',
    validateRequest({
        params: appointmentIdParamsSchema,
        body: updateAppointmentStatusSchema,
    }),
    updateAppointmentStatusController
);

export { appointmentRouter };
