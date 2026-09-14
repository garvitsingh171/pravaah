import { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorMessage, FieldError, LoadingState, useToast } from '../../components/feedback';
import { Button, FormSection, fieldControlClassName } from '../../components/ui';
import {
    getBackendValidationDetails,
    isApiClientError,
    type BackendValidationDetail,
} from '../../lib';
import { Weekday, type DoctorAvailabilityDay, type DoctorAvailabilityPeriod } from '../../types';
import { getDoctorAvailability, replaceDoctorAvailability } from './doctorApi';

type DoctorAvailabilityEditorProps = {
    clinicId: string;
    doctorId: string;
};

type AvailabilityLoadState =
    | {
          status: 'loading';
          timezone: string | null;
          days: DoctorAvailabilityDay[];
          error: null;
      }
    | {
          status: 'success';
          timezone: string;
          days: DoctorAvailabilityDay[];
          error: null;
      }
    | {
          status: 'error';
          timezone: string | null;
          days: DoctorAvailabilityDay[];
          error: {
              message: string;
              code?: string;
              details?: BackendValidationDetail[];
          };
      };

type AvailabilityValidationResult = {
    formMessages: string[];
    periodErrors: Record<string, string>;
};

type ComparablePeriod = DoctorAvailabilityPeriod & {
    periodIndex: number;
    startMinutes: number | null;
    endMinutes: number | null;
};

type ValidComparablePeriod = DoctorAvailabilityPeriod & {
    periodIndex: number;
    startMinutes: number;
    endMinutes: number;
};

const weekdays = [
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY,
    Weekday.SATURDAY,
    Weekday.SUNDAY,
] as const;

const weekdayLabels: Record<Weekday, string> = {
    [Weekday.MONDAY]: 'Monday',
    [Weekday.TUESDAY]: 'Tuesday',
    [Weekday.WEDNESDAY]: 'Wednesday',
    [Weekday.THURSDAY]: 'Thursday',
    [Weekday.FRIDAY]: 'Friday',
    [Weekday.SATURDAY]: 'Saturday',
    [Weekday.SUNDAY]: 'Sunday',
};

const timeShape = /^([01]\d|2[0-3]):[0-5]\d$/;

const getEmptyDays = (): DoctorAvailabilityDay[] =>
    weekdays.map((weekday) => ({
        weekday,
        periods: [],
    }));

const normalizeEditorDays = (days: DoctorAvailabilityDay[]): DoctorAvailabilityDay[] => {
    const periodsByWeekday = new Map<Weekday, DoctorAvailabilityPeriod[]>();

    for (const weekday of weekdays) {
        periodsByWeekday.set(weekday, []);
    }

    for (const day of days) {
        periodsByWeekday.set(
            day.weekday,
            day.periods
                .map((period) => ({
                    startTime: period.startTime,
                    endTime: period.endTime,
                }))
                .sort(
                    (firstPeriod, secondPeriod) =>
                        timeToMinutes(firstPeriod.startTime) - timeToMinutes(secondPeriod.startTime)
                )
        );
    }

    return weekdays.map((weekday) => ({
        weekday,
        periods: periodsByWeekday.get(weekday) ?? [],
    }));
};

const timeToMinutes = (time: string): number => {
    const [hours = '0', minutes = '0'] = time.split(':');

    return Number(hours) * 60 + Number(minutes);
};

const getPeriodErrorKey = (weekday: Weekday, periodIndex: number, field: 'startTime' | 'endTime') =>
    `${weekday}.${periodIndex}.${field}`;

const validateAvailabilityDays = (days: DoctorAvailabilityDay[]): AvailabilityValidationResult => {
    const formMessages: string[] = [];
    const periodErrors: Record<string, string> = {};

    for (const day of days) {
        const comparablePeriods = day.periods
            .map((period, periodIndex) => ({
                ...period,
                periodIndex,
                startMinutes: timeShape.test(period.startTime)
                    ? timeToMinutes(period.startTime)
                    : null,
                endMinutes: timeShape.test(period.endTime) ? timeToMinutes(period.endTime) : null,
            }))
            .filter((period) => {
                if (!period.startTime) {
                    periodErrors[
                        getPeriodErrorKey(day.weekday, period.periodIndex, 'startTime')
                    ] = 'Start time is required.';
                } else if (period.startMinutes === null) {
                    periodErrors[
                        getPeriodErrorKey(day.weekday, period.periodIndex, 'startTime')
                    ] = 'Use a 24-hour time such as 09:00.';
                }

                if (!period.endTime) {
                    periodErrors[
                        getPeriodErrorKey(day.weekday, period.periodIndex, 'endTime')
                    ] = 'End time is required.';
                } else if (period.endMinutes === null) {
                    periodErrors[
                        getPeriodErrorKey(day.weekday, period.periodIndex, 'endTime')
                    ] = 'Use a 24-hour time such as 13:00.';
                }

                return period.startMinutes !== null && period.endMinutes !== null;
            }) as ComparablePeriod[];

        const validComparablePeriods: ValidComparablePeriod[] = comparablePeriods.filter(
            (period): period is ValidComparablePeriod =>
                period.startMinutes !== null && period.endMinutes !== null
        );

        for (const period of validComparablePeriods) {
            if (period.startMinutes >= period.endMinutes) {
                periodErrors[getPeriodErrorKey(day.weekday, period.periodIndex, 'endTime')] =
                    'End time must be after start time.';
            }
        }

        const validOrderedPeriods = validComparablePeriods
            .filter((period) => period.startMinutes < period.endMinutes)
            .sort(
                (firstPeriod, secondPeriod) => firstPeriod.startMinutes - secondPeriod.startMinutes
            );

        for (let index = 1; index < validOrderedPeriods.length; index += 1) {
            const previousPeriod = validOrderedPeriods[index - 1];
            const currentPeriod = validOrderedPeriods[index];

            if (currentPeriod.startMinutes < previousPeriod.endMinutes) {
                const duplicate =
                    currentPeriod.startTime === previousPeriod.startTime &&
                    currentPeriod.endTime === previousPeriod.endTime;

                formMessages.push(
                    duplicate
                        ? `${weekdayLabels[day.weekday]} contains a duplicate availability period.`
                        : `${weekdayLabels[day.weekday]} contains overlapping availability periods.`
                );
            }
        }
    }

    return {
        formMessages,
        periodErrors,
    };
};

function DoctorAvailabilityEditor({ clinicId, doctorId }: DoctorAvailabilityEditorProps) {
    const { showErrorToast, showSuccessToast } = useToast();
    const [availabilityState, setAvailabilityState] = useState<AvailabilityLoadState>({
        status: 'loading',
        timezone: null,
        days: getEmptyDays(),
        error: null,
    });
    const [periodErrors, setPeriodErrors] = useState<Record<string, string>>({});
    const [validationMessages, setValidationMessages] = useState<string[]>([]);
    const [saveError, setSaveError] = useState<{
        message: string;
        code?: string;
        details?: BackendValidationDetail[];
    } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadAvailability = useCallback(
        (signal?: AbortSignal) => {
            setAvailabilityState({
                status: 'loading',
                timezone: null,
                days: getEmptyDays(),
                error: null,
            });
            setPeriodErrors({});
            setValidationMessages([]);
            setSaveError(null);

            void getDoctorAvailability(clinicId, doctorId, signal)
                .then((data) => {
                    setAvailabilityState({
                        status: 'success',
                        timezone: data.availability.timezone,
                        days: normalizeEditorDays(data.availability.days),
                        error: null,
                    });
                })
                .catch((error: unknown) => {
                    if (isApiClientError(error) && error.code === 'API_REQUEST_ABORTED') {
                        return;
                    }

                    if (error instanceof Error && error.name === 'AbortError') {
                        return;
                    }

                    const message = isApiClientError(error)
                        ? error.message
                        : 'Doctor availability could not be loaded. Please try again.';

                    setAvailabilityState({
                        status: 'error',
                        timezone: null,
                        days: getEmptyDays(),
                        error: {
                            message,
                            code: isApiClientError(error) ? error.code : 'DOCTOR_AVAILABILITY_LOAD_FAILED',
                            details: isApiClientError(error)
                                ? getBackendValidationDetails(error.details)
                                : undefined,
                        },
                    });
                });
        },
        [clinicId, doctorId]
    );

    useEffect(() => {
        const abortController = new AbortController();

        loadAvailability(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [loadAvailability]);

    const timezoneLabel = useMemo(() => {
        return availabilityState.timezone ?? 'clinic timezone';
    }, [availabilityState.timezone]);

    const updatePeriod = (
        weekday: Weekday,
        periodIndex: number,
        field: 'startTime' | 'endTime',
        value: string
    ) => {
        setAvailabilityState((currentState) => ({
            ...currentState,
            days: currentState.days.map((day) =>
                day.weekday === weekday
                    ? {
                          ...day,
                          periods: day.periods.map((period, index) =>
                              index === periodIndex
                                  ? {
                                        ...period,
                                        [field]: value,
                                    }
                                  : period
                          ),
                      }
                    : day
            ),
        }));
        setPeriodErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors[getPeriodErrorKey(weekday, periodIndex, field)];
            return nextErrors;
        });
        setValidationMessages([]);
        setSaveError(null);
    };

    const addPeriod = (weekday: Weekday) => {
        setAvailabilityState((currentState) => ({
            ...currentState,
            days: currentState.days.map((day) =>
                day.weekday === weekday
                    ? {
                          ...day,
                          periods: [
                              ...day.periods,
                              {
                                  startTime: '',
                                  endTime: '',
                              },
                          ],
                      }
                    : day
            ),
        }));
        setValidationMessages([]);
        setSaveError(null);
    };

    const removePeriod = (weekday: Weekday, periodIndex: number) => {
        setAvailabilityState((currentState) => ({
            ...currentState,
            days: currentState.days.map((day) =>
                day.weekday === weekday
                    ? {
                          ...day,
                          periods: day.periods.filter((_, index) => index !== periodIndex),
                      }
                    : day
            ),
        }));
        setPeriodErrors({});
        setValidationMessages([]);
        setSaveError(null);
    };

    const handleSave = async () => {
        const normalizedDays = normalizeEditorDays(availabilityState.days);
        const validationResult = validateAvailabilityDays(normalizedDays);

        setAvailabilityState((currentState) => ({
            ...currentState,
            days: normalizedDays,
        }));
        setPeriodErrors(validationResult.periodErrors);
        setValidationMessages(validationResult.formMessages);
        setSaveError(null);

        if (
            validationResult.formMessages.length > 0 ||
            Object.values(validationResult.periodErrors).some(Boolean)
        ) {
            return;
        }

        setIsSaving(true);

        try {
            const data = await replaceDoctorAvailability(clinicId, doctorId, {
                days: normalizedDays,
            });

            setAvailabilityState({
                status: 'success',
                timezone: data.availability.timezone,
                days: normalizeEditorDays(data.availability.days),
                error: null,
            });
            setPeriodErrors({});
            setValidationMessages([]);
            showSuccessToast('Weekly availability saved successfully.');
        } catch (error) {
            const message = isApiClientError(error)
                ? error.message
                : 'Weekly availability could not be saved. Please try again.';

            setSaveError({
                message,
                code: isApiClientError(error) ? error.code : 'DOCTOR_AVAILABILITY_SAVE_FAILED',
                details: isApiClientError(error)
                    ? getBackendValidationDetails(error.details)
                    : undefined,
            });
            showErrorToast(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (availabilityState.status === 'loading') {
        return <LoadingState message="Loading weekly availability..." />;
    }

    if (availabilityState.status === 'error') {
        return (
            <ErrorMessage
                title="Doctor availability could not be loaded"
                message={availabilityState.error.message}
                code={availabilityState.error.code}
                details={availabilityState.error.details}
                onRetry={() => loadAvailability()}
            />
        );
    }

    return (
        <FormSection
            title="Weekly availability"
            description={`Times shown in ${timezoneLabel}. Empty days mean no recurring availability is configured.`}
        >
            <div className="space-y-5 md:col-span-2">
                {validationMessages.length > 0 ? (
                    <ErrorMessage
                        title="Weekly availability needs changes"
                        message="Fix the highlighted schedule periods before saving."
                        details={validationMessages}
                    />
                ) : null}

                {saveError ? (
                    <ErrorMessage
                        title="Weekly availability was not saved"
                        message={saveError.message}
                        code={saveError.code}
                        details={saveError.details}
                    />
                ) : null}

                <div className="divide-y divide-slate-200 rounded-md border border-slate-200">
                    {availabilityState.days.map((day) => (
                        <div
                            key={day.weekday}
                            className="grid gap-4 p-4 md:grid-cols-[9rem_1fr]"
                        >
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {weekdayLabels[day.weekday]}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {day.periods.length > 0 ? 'Working' : 'No availability'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {day.periods.map((period, periodIndex) => {
                                    const startError =
                                        periodErrors[
                                            getPeriodErrorKey(
                                                day.weekday,
                                                periodIndex,
                                                'startTime'
                                            )
                                        ];
                                    const endError =
                                        periodErrors[
                                            getPeriodErrorKey(
                                                day.weekday,
                                                periodIndex,
                                                'endTime'
                                            )
                                        ];

                                    return (
                                        <div
                                            key={`${day.weekday}-${periodIndex}`}
                                            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                                        >
                                            <label className="block text-sm font-medium text-slate-700">
                                                Start time
                                                <input
                                                    className={fieldControlClassName}
                                                    type="time"
                                                    value={period.startTime}
                                                    onChange={(event) =>
                                                        updatePeriod(
                                                            day.weekday,
                                                            periodIndex,
                                                            'startTime',
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={isSaving}
                                                    aria-invalid={Boolean(startError)}
                                                />
                                                <FieldError message={startError} />
                                            </label>

                                            <label className="block text-sm font-medium text-slate-700">
                                                End time
                                                <input
                                                    className={fieldControlClassName}
                                                    type="time"
                                                    value={period.endTime}
                                                    onChange={(event) =>
                                                        updatePeriod(
                                                            day.weekday,
                                                            periodIndex,
                                                            'endTime',
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={isSaving}
                                                    aria-invalid={Boolean(endError)}
                                                />
                                                <FieldError message={endError} />
                                            </label>

                                            <div className="flex items-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removePeriod(day.weekday, periodIndex)
                                                    }
                                                    disabled={isSaving}
                                                >
                                                    Remove period
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addPeriod(day.weekday)}
                                    disabled={isSaving}
                                >
                                    Add period
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500">
                        Saving replaces the full recurring week and does not change doctor status.
                    </p>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        isLoading={isSaving}
                        loadingText="Saving availability..."
                    >
                        Save weekly availability
                    </Button>
                </div>
            </div>
        </FormSection>
    );
}

export default DoctorAvailabilityEditor;
