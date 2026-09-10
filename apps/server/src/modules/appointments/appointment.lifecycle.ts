import { AppointmentStatus } from '../../generated/prisma/client.js';

export const finalAppointmentStatuses: readonly AppointmentStatus[] = [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
];

export const appointmentStatusTransitions: Record<
    AppointmentStatus,
    readonly AppointmentStatus[]
> = {
    SCHEDULED: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.ARRIVED,
        AppointmentStatus.IN_QUEUE,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    CONFIRMED: [
        AppointmentStatus.ARRIVED,
        AppointmentStatus.IN_QUEUE,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    ARRIVED: [
        AppointmentStatus.IN_QUEUE,
        AppointmentStatus.CALLED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    IN_QUEUE: [
        AppointmentStatus.CALLED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    CALLED: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

export function isFinalAppointmentStatus(status: AppointmentStatus): boolean {
    return finalAppointmentStatuses.includes(status);
}

export function getAllowedAppointmentNextStatuses(
    currentStatus: AppointmentStatus
): readonly AppointmentStatus[] {
    return appointmentStatusTransitions[currentStatus];
}

export function isAppointmentStatusTransitionAllowed(
    currentStatus: AppointmentStatus,
    requestedStatus: AppointmentStatus
): boolean {
    // Same-status updates remain idempotent retries; timestamp writes stay null-guarded.
    if (currentStatus === requestedStatus) {
        return true;
    }

    return appointmentStatusTransitions[currentStatus].includes(requestedStatus);
}

export function getAllowedAppointmentCurrentStatusesForRequest(
    requestedStatus: AppointmentStatus
): AppointmentStatus[] {
    return Object.values(AppointmentStatus).filter((currentStatus) =>
        isAppointmentStatusTransitionAllowed(currentStatus, requestedStatus)
    );
}
