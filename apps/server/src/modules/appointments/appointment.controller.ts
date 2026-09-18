import type { Request, Response, NextFunction } from 'express';
import { appointmentService } from './appointment.service.js';
import type {
    CreateAppointmentInput,
    ListAppointmentsQueryInput,
    AppointmentIdParamsInput,
    AvailableAppointmentSlotsQueryInput,
    RescheduleAppointmentInput,
    RescheduleAppointmentSlotsQueryInput,
    UpdateAppointmentStatusInput,
} from './appointment.types.js';

export async function createAppointmentController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const appointmentData = req.body as CreateAppointmentInput;

        const result = await appointmentService.createAppointment(
            clinicId,
            req.user!.id,
            appointmentData
        );

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            data: result,
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
        const query = res.locals.validatedQuery as ListAppointmentsQueryInput;

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

export async function listAvailableAppointmentSlotsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as { clinicId: string };
        const query = res.locals.validatedQuery as AvailableAppointmentSlotsQueryInput;

        const availability = await appointmentService.listAvailableSlots(clinicId, query);

        res.status(200).json({
            success: true,
            message: 'Available appointment slots fetched successfully',
            data: availability,
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
        const statusUpdate = req.body as UpdateAppointmentStatusInput;

        const appointment = await appointmentService.updateAppointmentStatus(
            req.user,
            appointmentId,
            statusUpdate
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

export async function listAppointmentRescheduleSlotsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { appointmentId } = req.params as AppointmentIdParamsInput;
        const query = res.locals.validatedQuery as RescheduleAppointmentSlotsQueryInput;

        const availability = await appointmentService.listRescheduleSlots(
            req.user,
            appointmentId,
            query
        );

        res.status(200).json({
            success: true,
            message: 'Appointment reschedule slots fetched successfully',
            data: {
                availability,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function rescheduleAppointmentController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { appointmentId } = req.params as AppointmentIdParamsInput;
        const { scheduledAt, currentScheduledAt } = req.body as RescheduleAppointmentInput;

        const appointment = await appointmentService.rescheduleAppointment(
            req.user,
            appointmentId,
            scheduledAt,
            currentScheduledAt
        );

        res.status(200).json({
            success: true,
            message: 'Appointment rescheduled successfully',
            data: {
                appointment,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function listAppointmentActivitiesController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { appointmentId } = req.params as AppointmentIdParamsInput;
        const activities = await appointmentService.listAppointmentActivities(
            req.user,
            appointmentId
        );

        res.status(200).json({
            success: true,
            message: 'Appointment activities fetched successfully',
            data: {
                activities,
            },
        });
    } catch (error) {
        next(error);
    }
}
