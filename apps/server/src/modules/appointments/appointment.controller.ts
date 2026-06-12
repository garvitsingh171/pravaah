import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { appointmentService } from './appointment.service.js';
import type { CreateAppointmentInput } from './appointment.types.js';

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
    };
};

export async function createAppointmentController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const appointmentData = req.body as CreateAppointmentInput;

        const authenticatedReq = req as AuthenticatedRequest;

        if (!authenticatedReq.user?.id) {
            throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
        }

        const appointment = await appointmentService.createAppointment(
            clinicId,
            authenticatedReq.user.id,
            appointmentData
        );

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: {
                appointment,
            },
        });
    } catch (error) {
        next(error);
    }
}
