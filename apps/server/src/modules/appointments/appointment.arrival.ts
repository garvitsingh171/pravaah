import { AppointmentStatus } from '../../generated/prisma/client.js';

export const presenceEstablishingAppointmentStatuses: readonly AppointmentStatus[] = [
    AppointmentStatus.ARRIVED,
    AppointmentStatus.IN_QUEUE,
    AppointmentStatus.CALLED,
];

export type ArrivalOutcome = {
    arrivalOffsetMinutes: number;
    isLateArrival: boolean;
    lateArrivalGraceMinutes: number;
};

export function isPresenceEstablishingAppointmentStatus(status: AppointmentStatus): boolean {
    return presenceEstablishingAppointmentStatuses.includes(status);
}

export function calculateArrivalOutcome({
    scheduledAt,
    arrivedAt,
    graceMinutes,
}: {
    scheduledAt: Date;
    arrivedAt: Date;
    graceMinutes: number;
}): ArrivalOutcome {
    // Truncation preserves signed completed minutes without exaggerating early arrivals.
    const arrivalOffsetMinutes = Math.trunc((arrivedAt.getTime() - scheduledAt.getTime()) / 60_000);

    return {
        arrivalOffsetMinutes,
        isLateArrival: arrivalOffsetMinutes > graceMinutes,
        lateArrivalGraceMinutes: graceMinutes,
    };
}
