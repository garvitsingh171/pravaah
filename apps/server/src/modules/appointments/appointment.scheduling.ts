import { AppError } from '../../utils/AppError.js';
import {
    isCanonicalTime,
    timeToMinutes,
    type Weekday,
} from '../doctors/doctorAvailability.js';

export type SchedulingClinicSettings = {
    openingTime: string;
    closingTime: string;
    slotDurationMinutes: number;
    bufferMinutes: number;
};

export type SchedulingAvailabilityPeriod = {
    weekday: Weekday;
    startTime: string;
    endTime: string;
};

export type SchedulingAppointment = {
    scheduledAt: Date;
    durationMinutes: number;
};

export type SchedulingInterval = {
    start: Date;
    end: Date;
};

export const schedulingConflictStatuses = [
    'SCHEDULED',
    'CONFIRMED',
    'ARRIVED',
    'IN_QUEUE',
    'CALLED',
] as const;

export const weekdayByIsoDay: Record<number, Weekday> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY',
};

export const addMinutes = (date: Date, minutes: number): Date => {
    return new Date(date.getTime() + minutes * 60_000);
};

export const minutesToTime = (minutesSinceMidnight: number): string => {
    const hours = Math.floor(minutesSinceMidnight / 60);
    const minutes = minutesSinceMidnight % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const getEffectiveSchedulingInterval = (
    appointment: SchedulingAppointment,
    bufferMinutes: number
): SchedulingInterval => {
    return {
        start: appointment.scheduledAt,
        end: addMinutes(appointment.scheduledAt, appointment.durationMinutes + bufferMinutes),
    };
};

export const intervalsOverlap = (
    first: SchedulingInterval,
    second: SchedulingInterval
): boolean => {
    return first.start < second.end && second.start < first.end;
};

export const assertClinicSchedulingSettings = (clinic: SchedulingClinicSettings): void => {
    if (!isCanonicalTime(clinic.openingTime) || !isCanonicalTime(clinic.closingTime)) {
        throw new AppError(
            422,
            'CLINIC_OPERATING_HOURS_INVALID',
            'Clinic operating hours must use 24-hour HH:mm times before appointments can be scheduled.'
        );
    }

    if (timeToMinutes(clinic.openingTime) >= timeToMinutes(clinic.closingTime)) {
        throw new AppError(
            422,
            'CLINIC_OPERATING_HOURS_INVALID',
            'Clinic operating hours must open before they close for appointment scheduling.'
        );
    }

    if (clinic.slotDurationMinutes <= 0) {
        throw new AppError(
            422,
            'CLINIC_SLOT_DURATION_INVALID',
            'Clinic slot duration must be a positive number before appointments can be scheduled.'
        );
    }

    if (clinic.bufferMinutes < 0) {
        throw new AppError(
            422,
            'CLINIC_BUFFER_INVALID',
            'Clinic buffer minutes cannot be negative.'
        );
    }
};

export const buildCandidateLocalStartTimes = ({
    clinic,
    weekday,
    availabilityPeriods,
    durationMinutes,
}: {
    clinic: SchedulingClinicSettings;
    weekday: Weekday;
    availabilityPeriods: SchedulingAvailabilityPeriod[];
    durationMinutes: number;
}): string[] => {
    assertClinicSchedulingSettings(clinic);

    const clinicOpeningMinutes = timeToMinutes(clinic.openingTime);
    const clinicClosingMinutes = timeToMinutes(clinic.closingTime);
    const candidateTimes = new Set<string>();

    for (const period of availabilityPeriods) {
        if (period.weekday !== weekday) {
            continue;
        }

        const periodStartMinutes = timeToMinutes(period.startTime);
        const periodEndMinutes = timeToMinutes(period.endTime);
        const windowStartMinutes = Math.max(periodStartMinutes, clinicOpeningMinutes);
        const windowEndMinutes = Math.min(periodEndMinutes, clinicClosingMinutes);

        for (
            let startMinutes = windowStartMinutes;
            startMinutes + durationMinutes <= windowEndMinutes;
            startMinutes += clinic.slotDurationMinutes
        ) {
            candidateTimes.add(minutesToTime(startMinutes));
        }
    }

    return [...candidateTimes].sort();
};

export const findConflictingSchedulingAppointment = (
    candidate: SchedulingAppointment,
    existingAppointments: SchedulingAppointment[],
    bufferMinutes: number
): SchedulingAppointment | null => {
    const candidateInterval = getEffectiveSchedulingInterval(candidate, bufferMinutes);

    return (
        existingAppointments.find((appointment) =>
            intervalsOverlap(
                candidateInterval,
                getEffectiveSchedulingInterval(appointment, bufferMinutes)
            )
        ) ?? null
    );
};
