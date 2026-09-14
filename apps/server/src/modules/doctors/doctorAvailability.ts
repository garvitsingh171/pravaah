import { AppError } from '../../utils/AppError.js';

export const weekdays = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
] as const;

export type Weekday = (typeof weekdays)[number];

export type DoctorAvailabilityPeriodInput = {
    startTime: string;
    endTime: string;
};

export type DoctorAvailabilityDayInput = {
    weekday: Weekday;
    periods: DoctorAvailabilityPeriodInput[];
};

export type DoctorAvailabilityValidationIssue = {
    path: Array<string | number>;
    message: string;
};

type ComparablePeriod = DoctorAvailabilityPeriodInput & {
    periodIndex: number;
    startMinutes: number | null;
    endMinutes: number | null;
};

type ValidComparablePeriod = DoctorAvailabilityPeriodInput & {
    periodIndex: number;
    startMinutes: number;
    endMinutes: number;
};

const canonicalTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const weekdayOrder = new Map<Weekday, number>(weekdays.map((weekday, index) => [weekday, index]));

const isWeekday = (value: string): value is Weekday => {
    return weekdays.includes(value as Weekday);
};

export const isCanonicalTime = (value: string): boolean => {
    return canonicalTimePattern.test(value);
};

export const timeToMinutes = (value: string): number => {
    const [hours = '0', minutes = '0'] = value.split(':');

    return Number(hours) * 60 + Number(minutes);
};

const getWeekdayLabel = (weekday: Weekday): string => {
    return weekday.charAt(0) + weekday.slice(1).toLowerCase();
};

export const compareWeekdays = (first: Weekday, second: Weekday): number => {
    return (weekdayOrder.get(first) ?? 0) - (weekdayOrder.get(second) ?? 0);
};

export const sortAvailabilityDays = <
    TDay extends { weekday: Weekday; periods: TPeriod[] },
    TPeriod extends DoctorAvailabilityPeriodInput,
>(
    days: TDay[]
): Array<TDay & { periods: TPeriod[] }> => {
    return [...days]
        .sort((first, second) => compareWeekdays(first.weekday, second.weekday))
        .map((day) => ({
            ...day,
            periods: [...day.periods].sort(
                (firstPeriod, secondPeriod) =>
                    timeToMinutes(firstPeriod.startTime) - timeToMinutes(secondPeriod.startTime)
            ),
        }));
};

export const normalizeAvailabilityDays = (
    days: DoctorAvailabilityDayInput[]
): DoctorAvailabilityDayInput[] => {
    const periodsByWeekday = new Map<Weekday, DoctorAvailabilityPeriodInput[]>();

    for (const weekday of weekdays) {
        periodsByWeekday.set(weekday, []);
    }

    for (const day of days) {
        if (!isWeekday(day.weekday)) {
            continue;
        }

        periodsByWeekday.set(
            day.weekday,
            day.periods.map((period) => ({
                startTime: period.startTime,
                endTime: period.endTime,
            }))
        );
    }

    return sortAvailabilityDays(
        weekdays.map((weekday) => ({
            weekday,
            periods: periodsByWeekday.get(weekday) ?? [],
        }))
    );
};

export const getAvailabilityValidationIssues = (
    days: DoctorAvailabilityDayInput[]
): DoctorAvailabilityValidationIssue[] => {
    const issues: DoctorAvailabilityValidationIssue[] = [];
    const seenWeekdays = new Set<Weekday>();

    days.forEach((day, dayIndex) => {
        if (seenWeekdays.has(day.weekday)) {
            issues.push({
                path: ['days', dayIndex, 'weekday'],
                message: `${getWeekdayLabel(day.weekday)} appears more than once.`,
            });
        }

        seenWeekdays.add(day.weekday);

        const comparablePeriods: ValidComparablePeriod[] = day.periods
            .map((period, periodIndex) => ({
                ...period,
                periodIndex,
                startMinutes: isCanonicalTime(period.startTime)
                    ? timeToMinutes(period.startTime)
                    : null,
                endMinutes: isCanonicalTime(period.endTime) ? timeToMinutes(period.endTime) : null,
            }))
            .filter(
                (period: ComparablePeriod): period is ValidComparablePeriod =>
                    period.startMinutes !== null && period.endMinutes !== null
            );

        for (const period of comparablePeriods) {
            if (period.startMinutes >= period.endMinutes) {
                issues.push({
                    path: ['days', dayIndex, 'periods', period.periodIndex, 'endTime'],
                    message: 'End time must be after start time.',
                });
            }
        }

        const validOrderedPeriods = comparablePeriods
            .filter((period) => period.startMinutes < period.endMinutes)
            .sort((first, second) => first.startMinutes - second.startMinutes);

        const firstOrderedPeriod = validOrderedPeriods[0];

        if (!firstOrderedPeriod) {
            return;
        }

        let furthestPriorEndPeriod = firstOrderedPeriod;

        for (let index = 1; index < validOrderedPeriods.length; index += 1) {
            const currentPeriod = validOrderedPeriods[index];

            if (!currentPeriod) {
                continue;
            }

            if (currentPeriod.startMinutes < furthestPriorEndPeriod.endMinutes) {
                const isDuplicate =
                    currentPeriod.startTime === furthestPriorEndPeriod.startTime &&
                    currentPeriod.endTime === furthestPriorEndPeriod.endTime;

                issues.push({
                    path: ['days', dayIndex, 'periods', currentPeriod.periodIndex, 'startTime'],
                    message: isDuplicate
                        ? `${getWeekdayLabel(day.weekday)} contains a duplicate availability period.`
                        : `${getWeekdayLabel(day.weekday)} contains overlapping availability periods.`,
                });
            }

            if (currentPeriod.endMinutes > furthestPriorEndPeriod.endMinutes) {
                furthestPriorEndPeriod = currentPeriod;
            }
        }
    });

    for (const weekday of weekdays) {
        if (!seenWeekdays.has(weekday)) {
            issues.push({
                path: ['days'],
                message: `${getWeekdayLabel(weekday)} must be included in the weekly schedule.`,
            });
        }
    }

    return issues;
};

export const assertAvailabilityWithinClinicHours = (
    days: DoctorAvailabilityDayInput[],
    clinic: {
        openingTime: string;
        closingTime: string;
    }
): void => {
    if (!isCanonicalTime(clinic.openingTime) || !isCanonicalTime(clinic.closingTime)) {
        throw new AppError(
            422,
            'CLINIC_OPERATING_HOURS_INVALID',
            'Clinic operating hours must use 24-hour HH:mm times before doctor availability can be configured.'
        );
    }

    const clinicOpeningMinutes = timeToMinutes(clinic.openingTime);
    const clinicClosingMinutes = timeToMinutes(clinic.closingTime);

    if (clinicOpeningMinutes >= clinicClosingMinutes) {
        throw new AppError(
            422,
            'CLINIC_OPERATING_HOURS_INVALID',
            'Clinic operating hours must open before they close for same-day doctor availability.'
        );
    }

    for (const day of days) {
        for (const period of day.periods) {
            const startMinutes = timeToMinutes(period.startTime);
            const endMinutes = timeToMinutes(period.endTime);

            if (startMinutes < clinicOpeningMinutes || endMinutes > clinicClosingMinutes) {
                throw new AppError(
                    422,
                    'DOCTOR_AVAILABILITY_OUTSIDE_CLINIC_HOURS',
                    `${getWeekdayLabel(day.weekday)} availability must fit within clinic hours ${clinic.openingTime}-${clinic.closingTime}.`
                );
            }
        }
    }
};
