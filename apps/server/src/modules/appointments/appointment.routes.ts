import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import {
    createAppointmentController,
    listAppointmentsController,
} from './appointment.controller.js';
import {
    clinicIdParamsSchema,
    createAppointmentSchema,
    listAppointmentsQuerySchema,
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

export { appointmentRouter };
