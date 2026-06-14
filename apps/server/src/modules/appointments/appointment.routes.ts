import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
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
    validateRequest({
        params: clinicIdParamsSchema,
        body: createAppointmentSchema,
    }),
    createAppointmentController
);

clinicAppointmentRouter.get(
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

export { appointmentRouter, clinicAppointmentRouter };
