import { Router } from 'express';
import { validateRequest } from '../../utils/validateRequest.js';
import { createAppointmentController } from './appointment.controller.js';
import { clinicIdParamsSchema, createAppointmentSchema } from './appointment.validation.js';

const appointmentRouter = Router();

appointmentRouter.post(
    '/:clinicId/appointments',
    validateRequest({
        params: clinicIdParamsSchema,
        body: createAppointmentSchema,
    }),
    createAppointmentController
);

export { appointmentRouter };
