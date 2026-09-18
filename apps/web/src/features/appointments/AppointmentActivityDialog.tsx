import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui';
import { AppointmentActivityType, AppointmentStatus, BookingSource } from '../../types';
import { isApiClientError } from '../../lib';
import {
    listAppointmentActivities,
    type AppointmentActivity,
    type AppointmentListItem,
} from './appointmentApi';
import { cancellationReasonLabels, noShowReasonLabels } from './terminalAppointmentReasons';
import type { AppointmentCancellationReason, AppointmentNoShowReason } from '../../types';

type ActivityState =
    | { status: 'loading'; activities: AppointmentActivity[]; message: null }
    | { status: 'success'; activities: AppointmentActivity[]; message: null }
    | { status: 'error'; activities: AppointmentActivity[]; message: string };

const activityLabels: Record<AppointmentActivityType, string> = {
    APPOINTMENT_CREATED: 'Appointment created',
    APPOINTMENT_CONFIRMED: 'Appointment confirmed',
    PATIENT_ARRIVED: 'Patient arrived',
    ENTERED_QUEUE: 'Entered queue',
    PATIENT_CALLED: 'Patient called',
    APPOINTMENT_COMPLETED: 'Appointment completed',
    APPOINTMENT_CANCELLED: 'Appointment cancelled',
    APPOINTMENT_NO_SHOW: 'Marked no-show',
    APPOINTMENT_RESCHEDULED: 'Appointment rescheduled',
};

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    ARRIVED: 'Arrived',
    IN_QUEUE: 'In queue',
    CALLED: 'Called',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No-show',
};

const bookingSourceLabels: Record<BookingSource, string> = {
    RECEPTION: 'Reception',
    PHONE: 'Phone',
    WEB: 'Web',
    WALK_IN: 'Walk-in',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const getString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

const getNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

const formatActivityDateTime = (value: string, timezone?: string | null): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: timezone ?? undefined,
    }).format(date);
};

const getArrivalDetail = (metadata: unknown): string | null => {
    if (!isRecord(metadata)) {
        return null;
    }

    const offset = getNumber(metadata.arrivalOffsetMinutes);
    const isLateArrival =
        typeof metadata.isLateArrival === 'boolean' ? metadata.isLateArrival : null;

    if (offset === null || isLateArrival === null) {
        return null;
    }

    if (offset < 0) {
        return `Arrived ${Math.abs(offset)} min early`;
    }

    if (offset === 0) {
        return 'On time';
    }

    return isLateArrival ? `Late · ${offset} min` : `Within grace · ${offset} min`;
};

function ActivityMetadata({
    activity,
    timezone,
}: {
    activity: AppointmentActivity;
    timezone?: string | null;
}) {
    const metadata: unknown = activity.metadata;

    if (activity.type === AppointmentActivityType.PATIENT_ARRIVED) {
        const detail = getArrivalDetail(metadata);
        return detail ? <p className="mt-1 text-sm font-medium text-slate-600">{detail}</p> : null;
    }

    if (activity.type === AppointmentActivityType.APPOINTMENT_RESCHEDULED) {
        if (!isRecord(metadata)) {
            return null;
        }

        const previousScheduledAt = getString(metadata.previousScheduledAt);
        const newScheduledAt = getString(metadata.newScheduledAt);

        if (!previousScheduledAt || !newScheduledAt) {
            return null;
        }

        return (
            <p className="mt-2 text-sm text-slate-600">
                <span>{formatActivityDateTime(previousScheduledAt, timezone)}</span>
                <span className="mx-2" aria-hidden="true">
                    →
                </span>
                <span>{formatActivityDateTime(newScheduledAt, timezone)}</span>
            </p>
        );
    }

    if (activity.type === AppointmentActivityType.APPOINTMENT_CREATED) {
        if (!isRecord(metadata)) {
            return null;
        }

        const scheduledAt = getString(metadata.scheduledAt);
        const bookingSource = getString(metadata.bookingSource);
        const sourceLabel =
            bookingSource && bookingSource in bookingSourceLabels
                ? bookingSourceLabels[bookingSource as BookingSource]
                : null;

        if (!scheduledAt && !sourceLabel) {
            return null;
        }

        return (
            <p className="mt-1 text-sm text-slate-600">
                {scheduledAt
                    ? `Scheduled for ${formatActivityDateTime(scheduledAt, timezone)}`
                    : ''}
                {scheduledAt && sourceLabel ? ' · ' : ''}
                {sourceLabel ? `Booked via ${sourceLabel}` : ''}
            </p>
        );
    }

    if (
        activity.type === AppointmentActivityType.APPOINTMENT_CANCELLED ||
        activity.type === AppointmentActivityType.APPOINTMENT_NO_SHOW
    ) {
        if (!isRecord(metadata)) {
            return <p className="mt-1 text-sm text-slate-600">Reason not recorded</p>;
        }

        const isCancellation = activity.type === AppointmentActivityType.APPOINTMENT_CANCELLED;
        const reason = getString(
            isCancellation ? metadata.cancellationReason : metadata.noShowReason
        );
        const note = getString(isCancellation ? metadata.cancellationNote : metadata.noShowNote);
        const label = isCancellation
            ? reason && reason in cancellationReasonLabels
                ? cancellationReasonLabels[reason as AppointmentCancellationReason]
                : 'Reason not recorded'
            : reason && reason in noShowReasonLabels
              ? noShowReasonLabels[reason as AppointmentNoShowReason]
              : 'Reason not recorded';

        return (
            <div className="mt-1 text-sm text-slate-600">
                <p className="font-medium">{label}</p>
                {note ? <p className="mt-1 leading-5">{note}</p> : null}
            </div>
        );
    }

    if (!isRecord(metadata)) {
        return null;
    }

    const fromStatus = getString(metadata.fromStatus);
    const toStatus = getString(metadata.toStatus);

    if (
        !fromStatus ||
        !toStatus ||
        !(fromStatus in appointmentStatusLabels) ||
        !(toStatus in appointmentStatusLabels)
    ) {
        return null;
    }

    return (
        <p className="mt-1 text-sm text-slate-600">
            {appointmentStatusLabels[fromStatus as AppointmentStatus]} →{' '}
            {appointmentStatusLabels[toStatus as AppointmentStatus]}
        </p>
    );
}

export default function AppointmentActivityDialog({
    appointment,
    timezone,
    onClose,
}: {
    appointment: AppointmentListItem;
    timezone?: string | null;
    onClose: () => void;
}) {
    const [state, setState] = useState<ActivityState>({
        status: 'loading',
        activities: [],
        message: null,
    });
    const [refreshKey, setRefreshKey] = useState(0);

    const loadActivities = useCallback(
        async (signal: AbortSignal) => listAppointmentActivities(appointment.id, signal),
        [appointment.id]
    );

    useEffect(() => {
        const abortController = new AbortController();

        void loadActivities(abortController.signal)
            .then((data) => {
                setState({ status: 'success', activities: data.activities, message: null });
            })
            .catch((error: unknown) => {
                if (abortController.signal.aborted) {
                    return;
                }

                setState({
                    status: 'error',
                    activities: [],
                    message: isApiClientError(error)
                        ? error.message
                        : 'Appointment activity could not be loaded. Please try again.',
                });
            });

        return () => abortController.abort();
    }, [loadActivities, refreshKey]);

    const handleRetry = () => {
        setState({ status: 'loading', activities: [], message: null });
        setRefreshKey((value) => value + 1);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-activity-title"
                className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-app-border bg-white p-6 shadow-xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            Operational history
                        </p>
                        <h2
                            id="appointment-activity-title"
                            className="mt-1 text-lg font-semibold text-app-text"
                        >
                            Activity for {appointment.patient.fullName}
                        </h2>
                        <p className="mt-1 text-sm text-app-muted">
                            {appointment.doctor.fullName}
                            {timezone ? ` · ${timezone}` : ''}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        aria-label="Close appointment activity"
                    >
                        Close
                    </Button>
                </div>

                <div className="mt-6" aria-live="polite">
                    {state.status === 'loading' ? (
                        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            Loading appointment activity…
                        </p>
                    ) : null}

                    {state.status === 'error' ? (
                        <div className="rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] p-4">
                            <p className="text-sm text-[var(--color-status-danger-text)]">
                                {state.message}
                            </p>
                            <Button
                                className="mt-3"
                                variant="outline"
                                size="sm"
                                onClick={handleRetry}
                            >
                                Try again
                            </Button>
                        </div>
                    ) : null}

                    {state.status === 'success' && state.activities.length === 0 ? (
                        <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            No recorded activity is available for this appointment yet.
                        </p>
                    ) : null}

                    {state.status === 'success' && state.activities.length > 0 ? (
                        <ol className="space-y-0" aria-label="Appointment activity timeline">
                            {state.activities.map((activity, index) => (
                                <li
                                    key={activity.id}
                                    className="relative grid grid-cols-[1rem_1fr] gap-4 pb-6 last:pb-0"
                                >
                                    {index < state.activities.length - 1 ? (
                                        <span
                                            className="absolute left-[0.4375rem] top-4 h-full w-px bg-slate-200"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    <span
                                        className="relative mt-1.5 h-4 w-4 rounded-full border-4 border-brand-soft bg-action"
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            {activityLabels[activity.type]}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {formatActivityDateTime(activity.occurredAt, timezone)}
                                            {activity.actor ? ` · ${activity.actor.fullName}` : ''}
                                        </p>
                                        <ActivityMetadata activity={activity} timezone={timezone} />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
