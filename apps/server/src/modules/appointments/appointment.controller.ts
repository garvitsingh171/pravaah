import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { appointmentService } from './appointment.service.js';
import type {
    CreateAppointmentInput,
    ListAppointmentsQueryInput,
    AppointmentIdParamsInput,
    UpdateAppointmentStatusInput,
} from './appointment.types.js';
import type { AppointmentStatus } from '../../generated/prisma/client.js';

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

export async function listAppointmentsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const query = req.query as ListAppointmentsQueryInput;

        const appointments = await appointmentService.listAppointments(clinicId, query);

        res.status(200).json({
            success: true,
            message: 'Appointments fetched successfully',
            data: {
                appointments,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateAppointmentStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { appointmentId } = req.params as AppointmentIdParamsInput;
        const { status } = req.body as UpdateAppointmentStatusInput;

        const appointment = await appointmentService.updateAppointmentStatus(
            appointmentId,
            status as AppointmentStatus
        );

        res.status(200).json({
            success: true,
            message: 'Appointment status updated successfully',
            data: {
                appointment,
            },
        });
    } catch (error) {
        next(error);
    }
}
