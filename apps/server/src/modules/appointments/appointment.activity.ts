import {
    AppointmentActivityType,
    AppointmentStatus,
    type BookingSource,
} from '../../generated/prisma/client.js';
import type { ArrivalOutcome } from './appointment.arrival.js';

export type AppointmentCreatedActivityMetadata = {
    scheduledAt: string;
    bookingSource: BookingSource;
    doctorId: string;
    patientId: string;
};

export type AppointmentStatusActivityMetadata = {
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
};

export type PatientArrivedActivityMetadata = AppointmentStatusActivityMetadata & ArrivalOutcome;

export type AppointmentRescheduledActivityMetadata = {
    previousScheduledAt: string;
    newScheduledAt: string;
};

export type AppointmentActivityMetadata =
    | AppointmentCreatedActivityMetadata
    | AppointmentStatusActivityMetadata
    | PatientArrivedActivityMetadata
    | AppointmentRescheduledActivityMetadata;

const statusActivityTypes: Partial<Record<AppointmentStatus, AppointmentActivityType>> = {
    CONFIRMED: AppointmentActivityType.APPOINTMENT_CONFIRMED,
    ARRIVED: AppointmentActivityType.PATIENT_ARRIVED,
    IN_QUEUE: AppointmentActivityType.ENTERED_QUEUE,
    CALLED: AppointmentActivityType.PATIENT_CALLED,
    COMPLETED: AppointmentActivityType.APPOINTMENT_COMPLETED,
    CANCELLED: AppointmentActivityType.APPOINTMENT_CANCELLED,
    NO_SHOW: AppointmentActivityType.APPOINTMENT_NO_SHOW,
};

export function getAppointmentActivityTypeForStatus(
    status: AppointmentStatus
): AppointmentActivityType | null {
    return statusActivityTypes[status] ?? null;
}

export function buildAppointmentCreatedActivityMetadata({
    scheduledAt,
    bookingSource,
    doctorId,
    patientId,
}: {
    scheduledAt: Date;
    bookingSource: BookingSource;
    doctorId: string;
    patientId: string;
}): AppointmentCreatedActivityMetadata {
    return {
        scheduledAt: scheduledAt.toISOString(),
        bookingSource,
        doctorId,
        patientId,
    };
}

export function buildAppointmentStatusActivityMetadata(
    fromStatus: AppointmentStatus,
    toStatus: AppointmentStatus
): AppointmentStatusActivityMetadata {
    return {
        fromStatus,
        toStatus,
    };
}

export function buildPatientArrivedActivityMetadata({
    fromStatus,
    toStatus,
    outcome,
}: {
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
    outcome: ArrivalOutcome;
}): PatientArrivedActivityMetadata {
    return {
        fromStatus,
        toStatus,
        arrivalOffsetMinutes: outcome.arrivalOffsetMinutes,
        isLateArrival: outcome.isLateArrival,
        lateArrivalGraceMinutes: outcome.lateArrivalGraceMinutes,
    };
}

export function buildAppointmentRescheduledActivityMetadata(
    previousScheduledAt: Date,
    newScheduledAt: Date
): AppointmentRescheduledActivityMetadata {
    return {
        previousScheduledAt: previousScheduledAt.toISOString(),
        newScheduledAt: newScheduledAt.toISOString(),
    };
}

const activityTypeOrder: Record<AppointmentActivityType, number> = {
    APPOINTMENT_CREATED: 0,
    APPOINTMENT_CONFIRMED: 10,
    PATIENT_ARRIVED: 20,
    ENTERED_QUEUE: 30,
    PATIENT_CALLED: 40,
    APPOINTMENT_COMPLETED: 50,
    APPOINTMENT_CANCELLED: 50,
    APPOINTMENT_NO_SHOW: 50,
    APPOINTMENT_RESCHEDULED: 15,
};

export function compareAppointmentActivities(
    first: {
        id: string;
        type: AppointmentActivityType;
        occurredAt: Date;
        createdAt: Date;
    },
    second: {
        id: string;
        type: AppointmentActivityType;
        occurredAt: Date;
        createdAt: Date;
    }
): number {
    return (
        first.occurredAt.getTime() - second.occurredAt.getTime() ||
        activityTypeOrder[first.type] - activityTypeOrder[second.type] ||
        first.createdAt.getTime() - second.createdAt.getTime() ||
        first.id.localeCompare(second.id)
    );
}
