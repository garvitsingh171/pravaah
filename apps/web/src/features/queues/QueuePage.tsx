import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Button,
    FilterBar,
    PageHeader,
    RiskBadge as RiskLevelBadge,
    NoShowRiskDetailsDialog,
    StatusBadge,
    fieldControlClassName,
    getQueueStatusLabel,
    getAppointmentStatusLabel,
} from '../../components/ui';
import { isApiClientError } from '../../lib';
import { formatClinicDateTime, getClinicDateInputValue } from '../../lib/clinicDateTime';
import { appRoutePaths } from '../../routes/dashboardRoutes';
import { AppointmentStatus, QueueStatus } from '../../types';
import type {
    AppointmentStatus as AppointmentStatusType,
    QueueStatus as QueueStatusType,
} from '../../types';
import TerminalAppointmentReasonDialog, {
    type TerminalAppointmentReasonSubmission,
} from '../appointments/TerminalAppointmentReasonDialog';
import { getTerminalReasonDisplay } from '../appointments/terminalAppointmentReasons';
import {
    listTodayQueue,
    reorderQueue,
    updateQueueStatus,
    type QueueListItem,
    type UpdateQueueStatusRequest,
} from './queueApi';

type QueueListState =
    | {
          status: 'loading';
          queueEntries: QueueListItem[];
          error: null;
      }
    | {
          status: 'success';
          queueEntries: QueueListItem[];
          error: null;
      }
    | {
          status: 'error';
          queueEntries: QueueListItem[];
          error: {
              message: string;
              code?: string;
          };
      };

type QueueStatusAction = {
    status: QueueStatusType;
    label: string;
};

type QueueTerminalReasonFlowState = {
    queueEntry: QueueListItem;
    mode: 'cancellation' | 'no-show';
    error: string | null;
    isSubmitting: boolean;
};

const emptyQueueListState: QueueListState = {
    status: 'loading',
    queueEntries: [],
    error: null,
};

// One foreground request every 30 seconds; two missed polls make the view stale.
const QUEUE_POLL_INTERVAL_MS = 30_000;
const QUEUE_STALE_AFTER_MS = 90_000;

const queueStatusOptions: Array<{ value: QueueStatusType; label: string }> = [
    QueueStatus.WAITING,
    QueueStatus.ARRIVED,
    QueueStatus.CALLED,
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
].map((status) => ({
    value: status,
    label: getQueueStatusLabel(status),
}));

const getQueueStatusLabelLower = (status: QueueStatusType): string => {
    return getQueueStatusLabel(status).toLowerCase();
};

const queueStatusActionLabels: Record<QueueStatusType, string> = {
    WAITING: 'Mark waiting',
    ARRIVED: 'Mark arrived',
    CALLED: 'Call patient',
    COMPLETED: 'Complete',
    CANCELLED: 'Cancel',
    NO_SHOW: 'Mark no-show',
};

const finalQueueStatuses: QueueStatusType[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

const isFinalQueueStatus = (status: QueueStatusType): boolean => {
    return finalQueueStatuses.includes(status);
};

const queueStatusActionsByCurrentStatus: Record<QueueStatusType, QueueStatusAction[]> = {
    WAITING: [
        { status: QueueStatus.ARRIVED, label: queueStatusActionLabels.ARRIVED },
        { status: QueueStatus.CALLED, label: queueStatusActionLabels.CALLED },
        { status: QueueStatus.COMPLETED, label: queueStatusActionLabels.COMPLETED },
        { status: QueueStatus.CANCELLED, label: queueStatusActionLabels.CANCELLED },
        { status: QueueStatus.NO_SHOW, label: queueStatusActionLabels.NO_SHOW },
    ],
    ARRIVED: [
        { status: QueueStatus.WAITING, label: queueStatusActionLabels.WAITING },
        { status: QueueStatus.CALLED, label: queueStatusActionLabels.CALLED },
        { status: QueueStatus.CANCELLED, label: queueStatusActionLabels.CANCELLED },
        { status: QueueStatus.NO_SHOW, label: queueStatusActionLabels.NO_SHOW },
    ],
    CALLED: [
        { status: QueueStatus.COMPLETED, label: queueStatusActionLabels.COMPLETED },
        { status: QueueStatus.CANCELLED, label: queueStatusActionLabels.CANCELLED },
        { status: QueueStatus.NO_SHOW, label: queueStatusActionLabels.NO_SHOW },
    ],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

const queueArrivalSourceAppointmentStatuses: readonly AppointmentStatusType[] = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
];

const getQueueListErrorState = (
    error: unknown,
    queueEntries: QueueListItem[] = []
): QueueListState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            queueEntries,
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        queueEntries,
        error: {
            message: "Today's queue could not be loaded. Please try again.",
            code: 'QUEUE_LIST_FAILED',
        },
    };
};

const formatTime = (value: string | null | undefined, timezone?: string | null): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'short',
        timeZone: timezone ?? undefined,
    }).format(date);
};

const formatSyncTime = (value: Date, timezone?: string | null): string =>
    new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'medium',
        timeZone: timezone || undefined,
    }).format(value);

const getOptionalText = (value: string | number | null | undefined): string => {
    if (value === undefined || value === null) {
        return 'Not added';
    }

    return String(value).trim() || 'Not added';
};

const getArrivalClassificationLabel = (
    appointment: Pick<
        QueueListItem['appointment'],
        'arrivedAt' | 'arrivalOffsetMinutes' | 'isLateArrival'
    >
): string | null => {
    if (!appointment.arrivedAt) {
        return null;
    }

    if (appointment.isLateArrival === true) {
        const offset = appointment.arrivalOffsetMinutes;

        return typeof offset === 'number' ? `Late - ${offset} min` : 'Late';
    }

    if (appointment.isLateArrival === false) {
        const offset = appointment.arrivalOffsetMinutes;

        if (typeof offset === 'number' && offset > 0) {
            return 'Within grace';
        }

        return 'On time';
    }

    return 'Arrival recorded';
};

function QueueArrivalSummary({
    queueEntry,
    timezone,
}: {
    queueEntry: QueueListItem;
    timezone?: string | null;
}) {
    const arrivedAt = formatTime(queueEntry.appointment.arrivedAt, timezone);
    const classification = getArrivalClassificationLabel(queueEntry.appointment);

    if (!arrivedAt || !classification) {
        return null;
    }

    return (
        <p className="mt-2 text-xs font-medium text-slate-600">
            Arrived {arrivedAt} · {classification}
        </p>
    );
}

const getQueueStatusActions = (queueEntry: QueueListItem): QueueStatusAction[] => {
    return queueStatusActionsByCurrentStatus[queueEntry.status].filter((action) => {
        if (action.status !== QueueStatus.ARRIVED) {
            return true;
        }

        return queueArrivalSourceAppointmentStatuses.includes(queueEntry.appointment.status);
    });
};

const getUniqueQueueDoctors = (queueEntries: QueueListItem[]) => {
    const doctorsById = new Map<string, QueueListItem['doctor']>();

    queueEntries.forEach((queueEntry) => {
        doctorsById.set(queueEntry.doctor.id, queueEntry.doctor);
    });

    return [...doctorsById.values()].sort((firstDoctor, secondDoctor) =>
        firstDoctor.fullName.localeCompare(secondDoctor.fullName)
    );
};

const getActiveQueueEntries = (queueEntries: QueueListItem[]): QueueListItem[] => {
    return queueEntries.filter((queueEntry) => !isFinalQueueStatus(queueEntry.status));
};

const getFinalQueueEntries = (queueEntries: QueueListItem[]): QueueListItem[] => {
    return queueEntries.filter((queueEntry) => isFinalQueueStatus(queueEntry.status));
};

const getQueueEntriesForDoctorScope = (
    queueEntries: QueueListItem[],
    doctorId: string
): QueueListItem[] => {
    return queueEntries.filter((queueEntry) => queueEntry.doctor.id === doctorId);
};

const getQueueEntryIds = (queueEntries: QueueListItem[]): string[] => {
    return queueEntries.map((queueEntry) => queueEntry.id);
};

const getInitials = (name: string): string => {
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return initials || 'P';
};

const moveQueueEntryId = (queueEntryIds: string[], queueEntryId: string, offset: -1 | 1) => {
    const currentIndex = queueEntryIds.indexOf(queueEntryId);
    const nextIndex = currentIndex + offset;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= queueEntryIds.length) {
        return queueEntryIds;
    }

    const nextQueueEntryIds = [...queueEntryIds];
    const currentId = nextQueueEntryIds[currentIndex];
    const targetId = nextQueueEntryIds[nextIndex];

    if (!currentId || !targetId) {
        return queueEntryIds;
    }

    nextQueueEntryIds[currentIndex] = targetId;
    nextQueueEntryIds[nextIndex] = currentId;

    return nextQueueEntryIds;
};

const mergeQueueEntriesWithReorderedActiveEntries = (
    currentQueueEntries: QueueListItem[],
    reorderedActiveEntries: QueueListItem[]
): QueueListItem[] => {
    const reorderedActiveEntryIds = new Set(
        reorderedActiveEntries.map((queueEntry) => queueEntry.id)
    );
    const inactiveEntries = currentQueueEntries.filter(
        (queueEntry) => !reorderedActiveEntryIds.has(queueEntry.id)
    );

    return [...reorderedActiveEntries, ...inactiveEntries].sort(
        (firstEntry, secondEntry) =>
            firstEntry.doctor.fullName.localeCompare(secondEntry.doctor.fullName) ||
            firstEntry.position - secondEntry.position ||
            firstEntry.appointment.scheduledAt.localeCompare(secondEntry.appointment.scheduledAt)
    );
};

function QueueRiskSummary({
    queueEntry,
    onOpen,
}: {
    queueEntry: QueueListItem;
    onOpen: () => void;
}) {
    const prediction = queueEntry.noShowPrediction;
    const score = prediction?.riskScore ?? prediction?.score;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <RiskLevelBadge riskLevel={prediction?.riskLevel ?? null} />
            {prediction ? (
                <span className="text-xs font-medium text-slate-600">
                    {typeof score === 'number' ? `${score}/100` : 'Score unavailable'}
                </span>
            ) : null}
            <button
                type="button"
                className="inline-flex min-h-10 items-center text-xs font-semibold text-brand-foreground underline decoration-brand-soft underline-offset-2 hover:text-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                onClick={onOpen}
                aria-label={`View risk details for ${queueEntry.patient.fullName}`}
            >
                View risk details
            </button>
        </div>
    );
}

function QueueTimeline({
    queueEntry,
    timezone,
}: {
    queueEntry: QueueListItem;
    timezone?: string | null;
}) {
    const queuedAt = formatTime(queueEntry.queuedAt, timezone);
    const calledAt = formatTime(queueEntry.calledAt, timezone);
    const completedAt = formatTime(queueEntry.completedAt, timezone);

    return (
        <div className="space-y-1 text-xs text-slate-500">
            {queuedAt ? <p>Queued {queuedAt}</p> : null}
            {calledAt ? <p>Called {calledAt}</p> : null}
            {completedAt ? <p>Completed {completedAt}</p> : null}
            {!queuedAt && !calledAt && !completedAt ? <p>Not added</p> : null}
        </div>
    );
}

type QueueDoctorLane = {
    doctor: QueueListItem['doctor'];
    entries: QueueListItem[];
};

const getQueueDoctorLanes = (queueEntries: QueueListItem[]): QueueDoctorLane[] => {
    const lanesByDoctor = new Map<string, QueueDoctorLane>();

    queueEntries.forEach((queueEntry) => {
        const existingLane = lanesByDoctor.get(queueEntry.doctor.id);

        if (existingLane) {
            existingLane.entries.push(queueEntry);
            return;
        }

        lanesByDoctor.set(queueEntry.doctor.id, {
            doctor: queueEntry.doctor,
            entries: [queueEntry],
        });
    });

    return [...lanesByDoctor.values()]
        .map((lane) => ({
            ...lane,
            entries: [...lane.entries].sort(
                (firstEntry, secondEntry) =>
                    firstEntry.position - secondEntry.position ||
                    firstEntry.appointment.scheduledAt.localeCompare(
                        secondEntry.appointment.scheduledAt
                    )
            ),
        }))
        .sort((firstLane, secondLane) =>
            firstLane.doctor.fullName.localeCompare(secondLane.doctor.fullName)
        );
};

function QueueMoveButton({
    direction,
    disabled,
    isBusy,
    label,
    onClick,
}: {
    direction: 'up' | 'down';
    disabled: boolean;
    isBusy: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] hover:bg-brand-subtle hover:text-brand-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
        >
            {isBusy ? '...' : direction === 'up' ? '↑' : '↓'}
        </button>
    );
}

function QueueStatusActions({
    isReordering,
    isUpdating,
    onStatusUpdate,
    queueEntry,
    statusActions,
}: {
    isReordering: boolean;
    isUpdating: boolean;
    onStatusUpdate: (queueEntry: QueueListItem, nextStatus: QueueStatusType) => void;
    queueEntry: QueueListItem;
    statusActions: QueueStatusAction[];
}) {
    const primaryAction = statusActions[0];

    if (statusActions.length === 0) {
        return <span className="text-sm text-slate-500">Final status</span>;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(8rem,1fr)] sm:items-center">
            {primaryAction ? (
                <Button
                    size="sm"
                    onClick={() => onStatusUpdate(queueEntry, primaryAction.status)}
                    disabled={isUpdating || isReordering}
                    isLoading={isUpdating}
                    loadingText="Updating..."
                >
                    {primaryAction.label}
                </Button>
            ) : null}
            <select
                className={`${fieldControlClassName} min-h-8 text-xs`}
                value=""
                onChange={(event) => {
                    const nextStatus = event.target.value as QueueStatusType;

                    if (nextStatus) {
                        onStatusUpdate(queueEntry, nextStatus);
                    }
                }}
                disabled={isUpdating || isReordering}
                aria-label={`Update queue status for ${queueEntry.patient.fullName}`}
            >
                <option value="">{isUpdating ? 'Updating...' : 'More actions'}</option>
                {statusActions.slice(1).map((action) => (
                    <option key={action.status} value={action.status}>
                        {action.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function QueueEntryCard({
    activeQueueIndexesByDoctor,
    allActiveQueueEntries,
    handleQueueMove,
    handleStatusUpdate,
    isReordering,
    queueEntry,
    reorderingQueueEntryId,
    updatingQueueEntryId,
    timezone,
    onOpenRiskDetails,
    rowError,
}: {
    activeQueueIndexesByDoctor: Map<string, Map<string, number>>;
    allActiveQueueEntries: QueueListItem[];
    handleQueueMove: (queueEntry: QueueListItem, offset: -1 | 1) => void;
    handleStatusUpdate: (queueEntry: QueueListItem, nextStatus: QueueStatusType) => void;
    isReordering: boolean;
    queueEntry: QueueListItem;
    reorderingQueueEntryId: string | null;
    updatingQueueEntryId: string | null;
    timezone?: string | null;
    onOpenRiskDetails: (queueEntry: QueueListItem) => void;
    rowError?: string;
}) {
    const statusActions = getQueueStatusActions(queueEntry);
    const isUpdating = updatingQueueEntryId === queueEntry.id;
    const isMoving = reorderingQueueEntryId === queueEntry.id;
    const isWaiting = queueEntry.status === QueueStatus.WAITING;
    const activeQueueIndex =
        activeQueueIndexesByDoctor.get(queueEntry.doctor.id)?.get(queueEntry.id) ?? -1;
    const doctorActiveQueueEntryIds = getQueueEntryIds(
        getQueueEntriesForDoctorScope(allActiveQueueEntries, queueEntry.doctor.id)
    );
    const hasMoreThanOneActiveEntry = doctorActiveQueueEntryIds.length > 1;
    const canMoveUp = activeQueueIndex > 0 && hasMoreThanOneActiveEntry;
    const canMoveDown =
        activeQueueIndex >= 0 &&
        activeQueueIndex < doctorActiveQueueEntryIds.length - 1 &&
        hasMoreThanOneActiveEntry;
    const queueActionBusy = isReordering || Boolean(updatingQueueEntryId);

    return (
        <li
            className={`queue-card-confirmed rounded-lg border border-app-border bg-white p-3 shadow-[var(--shadow-soft)] sm:p-4 ${
                isWaiting ? 'bg-[var(--color-status-warning-bg)]' : ''
            }`}
            data-testid="active-queue-card"
        >
            <div className="grid min-w-0 gap-4 xl:grid-cols-[auto_minmax(0,1.2fr)_minmax(15rem,0.8fr)]">
                <div className="flex gap-3 lg:flex-col">
                    <div>
                        <p className="inline-flex min-w-20 justify-center rounded-md bg-slate-950 px-3 py-2 text-xl font-bold leading-none text-white">
                            #{String(queueEntry.position).padStart(2, '0')}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                            Position {queueEntry.position}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 lg:justify-center">
                        <QueueMoveButton
                            direction="up"
                            disabled={!canMoveUp || queueActionBusy}
                            isBusy={isMoving && canMoveUp}
                            label={`Move ${queueEntry.patient.fullName} up from position ${queueEntry.position}`}
                            onClick={() => handleQueueMove(queueEntry, -1)}
                        />
                        <QueueMoveButton
                            direction="down"
                            disabled={!canMoveDown || queueActionBusy}
                            isBusy={isMoving && canMoveDown}
                            label={`Move ${queueEntry.patient.fullName} down from position ${queueEntry.position}`}
                            onClick={() => handleQueueMove(queueEntry, 1)}
                        />
                    </div>
                    {!hasMoreThanOneActiveEntry ? (
                        <p className="text-xs font-medium text-slate-500">
                            Only active queue entry.
                        </p>
                    ) : null}
                </div>

                <div className="min-w-0">
                    <div className="flex items-start gap-3">
                        <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft"
                            aria-hidden="true"
                        >
                            {getInitials(queueEntry.patient.fullName)}
                        </span>
                        <div className="min-w-0">
                            <h3 className="break-words text-base font-bold text-slate-950">
                                {queueEntry.patient.fullName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                {getOptionalText(queueEntry.patient.phone)}
                            </p>
                            {queueEntry.patient.age ? (
                                <p className="mt-1 text-xs text-slate-500">
                                    Age {queueEntry.patient.age}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Appointment
                            </p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {formatClinicDateTime(queueEntry.appointment.scheduledAt, timezone)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {queueEntry.appointment.durationMinutes} min
                            </p>
                            <QueueArrivalSummary queueEntry={queueEntry} timezone={timezone} />
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Timeline
                            </p>
                            <div className="mt-1">
                                <QueueTimeline queueEntry={queueEntry} timezone={timezone} />
                            </div>
                        </div>
                    </div>
                    {queueEntry.appointment.reason ? (
                        <p
                            className="mt-3 max-w-xl break-words text-sm leading-5 text-slate-600"
                            title={queueEntry.appointment.reason}
                        >
                            {queueEntry.appointment.reason}
                        </p>
                    ) : null}
                </div>

                <div className="grid min-w-0 content-start gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge kind="queue" status={queueEntry.status} />
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            No-show risk
                        </p>
                        <QueueRiskSummary
                            queueEntry={queueEntry}
                            onOpen={() => onOpenRiskDetails(queueEntry)}
                        />
                    </div>

                    <QueueStatusActions
                        isReordering={isReordering}
                        isUpdating={isUpdating}
                        onStatusUpdate={handleStatusUpdate}
                        queueEntry={queueEntry}
                        statusActions={statusActions}
                    />
                    {rowError ? (
                        <p className="text-sm text-red-700" role="alert">
                            {rowError}
                        </p>
                    ) : null}
                </div>
            </div>
        </li>
    );
}

function ActiveQueueBoard({
    activeQueueEntries,
    activeQueueIndexesByDoctor,
    allActiveQueueEntries,
    handleQueueMove,
    handleStatusUpdate,
    isReordering,
    reorderingQueueEntryId,
    todayDate,
    updatingQueueEntryId,
    timezone,
    onOpenRiskDetails,
    statusUpdateError,
}: {
    activeQueueEntries: QueueListItem[];
    activeQueueIndexesByDoctor: Map<string, Map<string, number>>;
    allActiveQueueEntries: QueueListItem[];
    handleQueueMove: (queueEntry: QueueListItem, offset: -1 | 1) => void;
    handleStatusUpdate: (queueEntry: QueueListItem, nextStatus: QueueStatusType) => void;
    isReordering: boolean;
    reorderingQueueEntryId: string | null;
    todayDate: string;
    updatingQueueEntryId: string | null;
    timezone?: string | null;
    onOpenRiskDetails: (queueEntry: QueueListItem) => void;
    statusUpdateError: { message: string; queueEntryId?: string } | null;
}) {
    const lanes = getQueueDoctorLanes(activeQueueEntries);

    return (
        <section className="space-y-4">
            <div className="rounded-lg bg-slate-950 px-4 py-4 text-white shadow-[var(--shadow-raised)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                            Active queue board
                        </p>
                        <h2 className="mt-1 text-lg font-bold">Doctor lanes</h2>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-300">
                        Active entries for {todayDate}, grouped by doctor.
                    </p>
                </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4">
                {lanes.map((lane) => (
                    <article
                        key={lane.doctor.id}
                        className="rounded-lg bg-[var(--color-surface-soft)] p-3 shadow-[var(--shadow-soft)] ring-1 ring-slate-200/70"
                    >
                        <header className="mb-3 flex items-center justify-between gap-3 px-1">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-900 ring-1 ring-slate-200">
                                    {getInitials(lane.doctor.fullName)}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-bold text-slate-950">
                                        {lane.doctor.fullName}
                                    </h3>
                                    <p className="truncate text-xs text-slate-500">
                                        {getOptionalText(lane.doctor.specialization)}
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                                {lane.entries.length} active
                            </span>
                        </header>
                        <ol
                            className="grid gap-3"
                            aria-label={`Active queue for ${lane.doctor.fullName}`}
                        >
                            {lane.entries.map((queueEntry) => (
                                <QueueEntryCard
                                    key={queueEntry.id}
                                    activeQueueIndexesByDoctor={activeQueueIndexesByDoctor}
                                    allActiveQueueEntries={allActiveQueueEntries}
                                    handleQueueMove={handleQueueMove}
                                    handleStatusUpdate={handleStatusUpdate}
                                    isReordering={isReordering}
                                    queueEntry={queueEntry}
                                    reorderingQueueEntryId={reorderingQueueEntryId}
                                    updatingQueueEntryId={updatingQueueEntryId}
                                    timezone={timezone}
                                    onOpenRiskDetails={onOpenRiskDetails}
                                    rowError={
                                        statusUpdateError?.queueEntryId === queueEntry.id
                                            ? statusUpdateError.message
                                            : undefined
                                    }
                                />
                            ))}
                        </ol>
                    </article>
                ))}
            </div>
        </section>
    );
}

function FinalQueueEntriesSection({
    finalQueueEntries,
    timezone,
}: {
    finalQueueEntries: QueueListItem[];
    timezone?: string | null;
}) {
    return (
        <details className="rounded-lg bg-white shadow-[var(--shadow-soft)] ring-1 ring-slate-200">
            <summary className="cursor-pointer list-none px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action [&::-webkit-details-marker]:hidden">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Final queue entries
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Completed, cancelled, and no-show entries are retained for review.
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {finalQueueEntries.length} final
                    </span>
                </div>
            </summary>
            <div className="divide-y divide-slate-200 border-t border-slate-200">
                {finalQueueEntries.map((queueEntry) => {
                    const terminalReason = getTerminalReasonDisplay(queueEntry.appointment);

                    return (
                        <article
                            key={queueEntry.id}
                            className="grid gap-4 px-4 py-4 text-sm md:grid-cols-[1fr_1fr_1fr_auto]"
                        >
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {queueEntry.patient.fullName}
                                </p>
                                <p className="mt-1 text-slate-500">
                                    Historical position {queueEntry.position}
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {queueEntry.doctor.fullName}
                                </p>
                                <p className="mt-1 text-slate-500">
                                    {formatClinicDateTime(
                                        queueEntry.appointment.scheduledAt,
                                        timezone
                                    )}
                                </p>
                                <QueueArrivalSummary queueEntry={queueEntry} timezone={timezone} />
                            </div>
                            <div className="space-y-2">
                                <StatusBadge kind="queue" status={queueEntry.status} />
                                <p className="text-slate-500">
                                    Appointment:{' '}
                                    {getAppointmentStatusLabel(queueEntry.appointment.status)}
                                </p>
                                {terminalReason ? (
                                    <div className="text-slate-600">
                                        <p className="font-semibold text-slate-800">
                                            {terminalReason.label}
                                        </p>
                                        {terminalReason.note ? (
                                            <p className="mt-1 text-xs leading-5">
                                                {terminalReason.note}
                                            </p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                            <p className="font-medium text-slate-500">Reorder unavailable</p>
                        </article>
                    );
                })}
            </div>
        </details>
    );
}

function QueuePageContent({ todayDate }: { todayDate: string }) {
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
    const clinicTimezone = activeClinic.clinic?.timezone;
    const { showErrorToast, showSuccessToast } = useToast();
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<QueueStatusType | ''>('');
    const [queueListState, setQueueListState] = useState<QueueListState>(emptyQueueListState);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
    const [lastAttemptedAt, setLastAttemptedAt] = useState<Date | null>(null);
    const [clockNow, setClockNow] = useState(Date.now());
    const activeFetchRef = useRef<AbortController | null>(null);
    const fetchGenerationRef = useRef(0);
    const mountedRef = useRef(true);
    const mutationInFlightRef = useRef(false);
    const [updatingQueueEntryId, setUpdatingQueueEntryId] = useState<string | null>(null);
    const [statusUpdateError, setStatusUpdateError] = useState<{
        message: string;
        code?: string;
        queueEntryId?: string;
    } | null>(null);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
    const [reorderingQueueEntryId, setReorderingQueueEntryId] = useState<string | null>(null);
    const [reorderError, setReorderError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [reorderMessage, setReorderMessage] = useState<string | null>(null);
    const [terminalReasonFlow, setTerminalReasonFlow] =
        useState<QueueTerminalReasonFlowState | null>(null);
    const [riskDetailsEntry, setRiskDetailsEntry] = useState<QueueListItem | null>(null);

    const loadQueue = useCallback(
        async (signal?: AbortSignal) => {
            const data = await listTodayQueue(clinicId, todayDate, signal);

            return data.queueEntries;
        },
        [clinicId, todayDate]
    );

    const refreshQueue = useCallback(
        async (restart = false) => {
            if (!mountedRef.current) return;
            if (mutationInFlightRef.current && !restart) return;
            if (activeFetchRef.current) {
                if (!restart) return;
                activeFetchRef.current.abort();
            }
            const controller = new AbortController();
            activeFetchRef.current = controller;
            const generation = ++fetchGenerationRef.current;
            setLastAttemptedAt(new Date());
            setQueueListState((currentState) => ({
                status: 'loading',
                queueEntries: currentState.queueEntries,
                error: null,
            }));

            try {
                const queueEntries = await loadQueue(controller.signal);
                if (generation === fetchGenerationRef.current && !controller.signal.aborted) {
                    setQueueListState({
                        status: 'success',
                        queueEntries,
                        error: null,
                    });
                    setLastRefreshedAt(new Date());
                }
            } catch (error) {
                if (generation === fetchGenerationRef.current && !controller.signal.aborted) {
                    setQueueListState(
                        (current) => getQueueListErrorState(error, current.queueEntries) ?? current
                    );
                }
            } finally {
                if (activeFetchRef.current === controller) activeFetchRef.current = null;
            }
        },
        [loadQueue]
    );

    useEffect(() => {
        mountedRef.current = true;
        void refreshQueue();
        const poll = window.setInterval(() => {
            setClockNow(Date.now());
            if (document.visibilityState === 'visible' && navigator.onLine) void refreshQueue();
        }, QUEUE_POLL_INTERVAL_MS);
        const tick = window.setInterval(() => setClockNow(Date.now()), 5_000);
        const onResume = () => {
            setClockNow(Date.now());
            if (document.visibilityState === 'visible' && navigator.onLine) void refreshQueue();
        };
        document.addEventListener('visibilitychange', onResume);
        window.addEventListener('online', onResume);

        return () => {
            mountedRef.current = false;
            window.clearInterval(poll);
            window.clearInterval(tick);
            document.removeEventListener('visibilitychange', onResume);
            window.removeEventListener('online', onResume);
            activeFetchRef.current?.abort();
            activeFetchRef.current = null;
            fetchGenerationRef.current += 1;
        };
    }, [refreshQueue]);

    const handleRetryQueue = () => {
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setReorderError(null);
        setReorderMessage(null);
        void refreshQueue(true);
    };

    const handleStatusUpdate = async (queueEntry: QueueListItem, nextStatus: QueueStatusType) => {
        if (
            queueListState.status !== 'success' ||
            nextStatus === queueEntry.status ||
            reorderingQueueEntryId ||
            updatingQueueEntryId
        ) {
            return;
        }

        if (nextStatus === QueueStatus.CANCELLED || nextStatus === QueueStatus.NO_SHOW) {
            setTerminalReasonFlow({
                queueEntry,
                mode: nextStatus === QueueStatus.CANCELLED ? 'cancellation' : 'no-show',
                error: null,
                isSubmitting: false,
            });
            return;
        }

        await persistQueueStatusUpdate(queueEntry, { status: nextStatus });
    };

    const persistQueueStatusUpdate = async (
        queueEntry: QueueListItem,
        payload: UpdateQueueStatusRequest
    ): Promise<string | null> => {
        mutationInFlightRef.current = true;
        activeFetchRef.current?.abort();
        fetchGenerationRef.current += 1;
        setUpdatingQueueEntryId(queueEntry.id);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setReorderError(null);
        setReorderMessage(null);

        try {
            const data = await updateQueueStatus(clinicId, queueEntry.id, {
                ...payload,
                expectedStatus: queueEntry.status,
            });

            setStatusUpdateMessage(
                `${queueEntry.patient.fullName} is now ${getQueueStatusLabelLower(
                    data.queueEntry.status
                )}.`
            );
            showSuccessToast(
                `Queue status updated to ${getQueueStatusLabelLower(data.queueEntry.status)}.`
            );
            void refreshQueue(true);
            return null;
        } catch (error) {
            if (isApiClientError(error)) {
                const message =
                    error.code === 'API_NETWORK_ERROR'
                        ? 'The status change may have been applied. Refresh and check the patient before acting again.'
                        : error.status === 409
                          ? 'Another staff member changed this entry. Refresh and review it before acting again.'
                          : error.message;
                setStatusUpdateError({
                    message,
                    code: error.code,
                    queueEntryId: queueEntry.id,
                });
                showErrorToast(message);
                void refreshQueue(true);
                return message;
            }

            const fallbackMessage =
                'The status change may have been applied. Refresh and check the patient before acting again.';

            setStatusUpdateError({
                message: fallbackMessage,
                code: 'QUEUE_STATUS_UPDATE_FAILED',
                queueEntryId: queueEntry.id,
            });
            showErrorToast(fallbackMessage);
            void refreshQueue(true);
            return fallbackMessage;
        } finally {
            mutationInFlightRef.current = false;
            setUpdatingQueueEntryId(null);
        }
    };

    const handleTerminalReasonSubmit = async (submission: TerminalAppointmentReasonSubmission) => {
        if (!terminalReasonFlow) {
            return;
        }

        const payload: UpdateQueueStatusRequest =
            submission.mode === 'cancellation'
                ? {
                      status: QueueStatus.CANCELLED,
                      cancellationReason: submission.cancellationReason,
                      cancellationNote: submission.cancellationNote,
                  }
                : {
                      status: QueueStatus.NO_SHOW,
                      noShowReason: submission.noShowReason,
                      noShowNote: submission.noShowNote,
                  };

        setTerminalReasonFlow((current) =>
            current ? { ...current, error: null, isSubmitting: true } : current
        );
        await persistQueueStatusUpdate(terminalReasonFlow.queueEntry, payload);

        // An uncertain outcome must be reconciled before staff can open a fresh action.
        setTerminalReasonFlow(null);
    };

    const handleQueueMove = async (queueEntry: QueueListItem, offset: -1 | 1) => {
        if (
            queueListState.status !== 'success' ||
            isStale ||
            reorderingQueueEntryId ||
            updatingQueueEntryId
        ) {
            return;
        }

        const confirmedQueueEntries = queueListState.queueEntries;
        const activeQueueEntries = getQueueEntriesForDoctorScope(
            getActiveQueueEntries(confirmedQueueEntries),
            queueEntry.doctor.id
        );
        const activeQueueEntryIds = getQueueEntryIds(activeQueueEntries);
        const nextQueueEntryIds = moveQueueEntryId(activeQueueEntryIds, queueEntry.id, offset);

        if (
            nextQueueEntryIds === activeQueueEntryIds ||
            new Set(nextQueueEntryIds).size !== nextQueueEntryIds.length
        ) {
            return;
        }

        setReorderingQueueEntryId(queueEntry.id);
        mutationInFlightRef.current = true;
        activeFetchRef.current?.abort();
        fetchGenerationRef.current += 1;
        setReorderError(null);
        setReorderMessage(null);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);

        try {
            const data = await reorderQueue(clinicId, {
                date: todayDate,
                queueEntryIds: nextQueueEntryIds,
                expectedQueueEntryIds: activeQueueEntryIds,
            });

            setQueueListState({
                status: 'success',
                queueEntries: mergeQueueEntriesWithReorderedActiveEntries(
                    confirmedQueueEntries,
                    data.queueEntries
                ),
                error: null,
            });
            void refreshQueue(true);
            const updatedPosition = data.queueEntries.find(
                (entry) => entry.id === queueEntry.id
            )?.position;
            setReorderMessage(
                updatedPosition
                    ? `Queue entry moved to position ${updatedPosition}.`
                    : 'Queue order updated.'
            );
        } catch (error) {
            setQueueListState({
                status: 'success',
                queueEntries: confirmedQueueEntries,
                error: null,
            });

            if (isApiClientError(error)) {
                const isConflict = error.status === 409;
                setReorderError({
                    message: isConflict
                        ? 'Another staff member changed this queue. Refresh and review its order before moving anyone again.'
                        : 'The move may have been applied. Refresh and review the order before trying again.',
                    code: error.code,
                });
                showErrorToast(
                    isConflict
                        ? 'Queue changed. Review the latest order.'
                        : 'Queue order could not be confirmed.'
                );
                void refreshQueue(true);
                return;
            }

            const fallbackMessage =
                'The move may have been applied. Refresh and review the order before trying again.';

            setReorderError({
                message: fallbackMessage,
                code: 'QUEUE_REORDER_FAILED',
            });
            showErrorToast(fallbackMessage);
            void refreshQueue(true);
        } finally {
            mutationInFlightRef.current = false;
            setReorderingQueueEntryId(null);
        }
    };

    const hasConfirmedSnapshot = lastRefreshedAt !== null;
    const hasQueueEntries = hasConfirmedSnapshot && queueListState.queueEntries.length > 0;
    const queueDoctors = useMemo(
        () => getUniqueQueueDoctors(queueListState.queueEntries),
        [queueListState.queueEntries]
    );
    const displayedQueueEntries = useMemo(() => {
        if (!hasConfirmedSnapshot) {
            return [];
        }

        return queueListState.queueEntries.filter((queueEntry) => {
            const doctorMatches = !selectedDoctorId || queueEntry.doctor.id === selectedDoctorId;
            const statusMatches = !selectedStatus || queueEntry.status === selectedStatus;

            return doctorMatches && statusMatches;
        });
    }, [queueListState, selectedDoctorId, selectedStatus, hasConfirmedSnapshot]);
    const hasFilteredQueueEntries = hasConfirmedSnapshot && displayedQueueEntries.length > 0;
    const hasQueueFilters = Boolean(selectedDoctorId || selectedStatus);
    const activeQueueEntries = useMemo(
        () => getActiveQueueEntries(displayedQueueEntries),
        [displayedQueueEntries]
    );
    const finalQueueEntries = useMemo(
        () => getFinalQueueEntries(displayedQueueEntries),
        [displayedQueueEntries]
    );
    const allActiveQueueEntries = useMemo(
        () => getActiveQueueEntries(queueListState.queueEntries),
        [queueListState.queueEntries]
    );
    const activeQueueIndexesByDoctor = useMemo(() => {
        const indexesByDoctor = new Map<string, Map<string, number>>();
        allActiveQueueEntries.forEach((queueEntry) => {
            let doctorIndexes = indexesByDoctor.get(queueEntry.doctor.id);
            if (!doctorIndexes) {
                doctorIndexes = new Map<string, number>();
                indexesByDoctor.set(queueEntry.doctor.id, doctorIndexes);
            }
            doctorIndexes.set(queueEntry.id, doctorIndexes.size);
        });
        return indexesByDoctor;
    }, [allActiveQueueEntries]);
    const queueCounts = useMemo(() => {
        return queueListState.queueEntries.reduce<Record<QueueStatusType, number>>(
            (counts, queueEntry) => {
                counts[queueEntry.status] += 1;

                return counts;
            },
            {
                WAITING: 0,
                ARRIVED: 0,
                CALLED: 0,
                COMPLETED: 0,
                CANCELLED: 0,
                NO_SHOW: 0,
            }
        );
    }, [queueListState.queueEntries]);
    const isStale =
        hasConfirmedSnapshot && clockNow - lastRefreshedAt.getTime() >= QUEUE_STALE_AFTER_MS;
    const isReordering =
        Boolean(reorderingQueueEntryId) || queueListState.status !== 'success' || isStale;
    const failedAttemptTime = lastAttemptedAt
        ? ` at ${formatSyncTime(lastAttemptedAt, clinicTimezone)}`
        : '';
    const refreshFailureLabel = ` · Refresh failed${failedAttemptTime}${lastRefreshedAt ? '; queue information may be outdated.' : '.'}`;

    return (
        <section className="space-y-4">
            <PageHeader
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-app-muted" role="status">
                            {lastRefreshedAt
                                ? `Last updated ${formatSyncTime(lastRefreshedAt, clinicTimezone)}`
                                : 'No confirmed queue data yet'}
                            {queueListState.status === 'loading' ? ' · Refreshing…' : null}
                            {queueListState.status === 'error' ? refreshFailureLabel : null}
                            {queueListState.status === 'success' && isStale
                                ? ' · Queue information may be outdated.'
                                : null}
                        </span>
                        <Button
                            variant="outline"
                            onClick={handleRetryQueue}
                            isLoading={queueListState.status === 'loading'}
                            disabled={Boolean(updatingQueueEntryId || reorderingQueueEntryId)}
                            loadingText="Refreshing..."
                        >
                            Refresh
                        </Button>
                    </div>
                }
            />

            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Clinic and date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{todayDate}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {activeClinic.clinic?.name ?? 'Active clinic'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Active entries
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                            {allActiveQueueEntries.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Waiting {queueCounts.WAITING} / Arrived {queueCounts.ARRIVED} / Called{' '}
                            {queueCounts.CALLED}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Final entries
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                            {queueCounts.COMPLETED + queueCounts.CANCELLED + queueCounts.NO_SHOW}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Completed {queueCounts.COMPLETED} / Cancelled {queueCounts.CANCELLED} /
                            No-show {queueCounts.NO_SHOW}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current filter
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedDoctorId
                                ? queueDoctors.find((doctor) => doctor.id === selectedDoctorId)
                                      ?.fullName
                                : 'All doctors'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Manual doctor-scoped order.</p>
                    </div>
                </div>
            </div>

            <FilterBar>
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <label className="block text-sm font-medium text-slate-700">
                        Doctor
                        <select
                            className={fieldControlClassName}
                            value={selectedDoctorId}
                            onChange={(event) => setSelectedDoctorId(event.target.value)}
                        >
                            <option value="">All doctors</option>
                            {queueDoctors.map((doctor) => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.fullName}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Queue status
                        <select
                            className={fieldControlClassName}
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value as QueueStatusType | '')
                            }
                        >
                            <option value="">All statuses</option>
                            {queueStatusOptions.map((statusOption) => (
                                <option key={statusOption.value} value={statusOption.value}>
                                    {statusOption.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    {hasQueueFilters ? (
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedDoctorId('');
                                setSelectedStatus('');
                            }}
                        >
                            Clear
                        </Button>
                    ) : null}
                </div>
            </FilterBar>

            {queueListState.status === 'loading' && !hasConfirmedSnapshot ? (
                <LoadingState message="Loading today's queue..." />
            ) : null}

            {queueListState.status === 'error' ? (
                <ErrorMessage
                    title="Today's queue could not be loaded"
                    message={queueListState.error.message}
                    code={queueListState.error.code}
                    onRetry={handleRetryQueue}
                />
            ) : null}

            {reorderError ? (
                <ErrorMessage
                    title="Queue order was not updated"
                    message={reorderError.message}
                    code={reorderError.code}
                />
            ) : null}

            {statusUpdateMessage ? (
                <div
                    className="rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-4 py-3 text-sm font-medium text-[var(--color-status-success-text)]"
                    role="status"
                >
                    {statusUpdateMessage}
                    <button
                        type="button"
                        className="ml-3 text-[var(--color-status-success-text)] underline decoration-[var(--color-status-success-border)] underline-offset-2"
                        onClick={() => setStatusUpdateMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {reorderMessage ? (
                <div
                    className="rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-4 py-3 text-sm font-medium text-[var(--color-status-success-text)]"
                    role="status"
                >
                    {reorderMessage}
                    <button
                        type="button"
                        className="ml-3 text-[var(--color-status-success-text)] underline decoration-[var(--color-status-success-border)] underline-offset-2"
                        onClick={() => setReorderMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {hasConfirmedSnapshot &&
            queueListState.status === 'success' &&
            queueListState.queueEntries.length === 0 ? (
                <EmptyState
                    title="No queue entries for today yet."
                    message="Book appointments for today to add patients into the clinic queue."
                    action={
                        <Link
                            to={appRoutePaths.appointments}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-transparent bg-action px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            Book appointment
                        </Link>
                    }
                />
            ) : null}

            {hasQueueEntries && displayedQueueEntries.length === 0 ? (
                <EmptyState
                    title="No queue entries match these filters."
                    message="Try another doctor or queue status to find matching entries."
                />
            ) : null}

            {hasFilteredQueueEntries && activeQueueEntries.length > 0 ? (
                <ActiveQueueBoard
                    activeQueueEntries={activeQueueEntries}
                    activeQueueIndexesByDoctor={activeQueueIndexesByDoctor}
                    allActiveQueueEntries={allActiveQueueEntries}
                    handleQueueMove={(queueEntry, offset) =>
                        void handleQueueMove(queueEntry, offset)
                    }
                    handleStatusUpdate={(queueEntry, nextStatus) =>
                        void handleStatusUpdate(queueEntry, nextStatus)
                    }
                    isReordering={isReordering}
                    reorderingQueueEntryId={reorderingQueueEntryId}
                    todayDate={todayDate}
                    updatingQueueEntryId={updatingQueueEntryId}
                    timezone={clinicTimezone}
                    onOpenRiskDetails={setRiskDetailsEntry}
                    statusUpdateError={statusUpdateError}
                />
            ) : null}

            {hasFilteredQueueEntries && finalQueueEntries.length > 0 ? (
                <FinalQueueEntriesSection
                    finalQueueEntries={finalQueueEntries}
                    timezone={clinicTimezone}
                />
            ) : null}

            {terminalReasonFlow ? (
                <TerminalAppointmentReasonDialog
                    mode={terminalReasonFlow.mode}
                    patientName={terminalReasonFlow.queueEntry.patient.fullName}
                    doctorName={terminalReasonFlow.queueEntry.doctor.fullName}
                    scheduledAtLabel={formatClinicDateTime(
                        terminalReasonFlow.queueEntry.appointment.scheduledAt,
                        clinicTimezone
                    )}
                    isSubmitting={terminalReasonFlow.isSubmitting}
                    error={terminalReasonFlow.error}
                    onClose={() => setTerminalReasonFlow(null)}
                    onSubmit={(submission) => void handleTerminalReasonSubmit(submission)}
                />
            ) : null}
            {riskDetailsEntry?.clinicId === clinicId ? (
                <NoShowRiskDetailsDialog
                    subject={{
                        id: riskDetailsEntry.appointment.id,
                        patientName: riskDetailsEntry.patient.fullName,
                        patientContact: [
                            riskDetailsEntry.patient.phone,
                            riskDetailsEntry.patient.email,
                        ]
                            .filter((value): value is string => Boolean(value?.trim()))
                            .join(' / '),
                        doctorName: riskDetailsEntry.doctor.fullName,
                        doctorSpecialty: riskDetailsEntry.doctor.specialization,
                        scheduledAt: riskDetailsEntry.appointment.scheduledAt,
                        durationMinutes: riskDetailsEntry.appointment.durationMinutes,
                        status: riskDetailsEntry.status,
                        reason: riskDetailsEntry.appointment.reason,
                        notes: riskDetailsEntry.appointment.notes,
                        prediction: riskDetailsEntry.noShowPrediction,
                    }}
                    timezone={clinicTimezone}
                    onClose={() => setRiskDetailsEntry(null)}
                />
            ) : null}
        </section>
    );
}

function QueuePage() {
    const activeClinic = useActiveClinic();
    const [today, setToday] = useState(() =>
        getClinicDateInputValue(activeClinic.clinic?.timezone)
    );

    useEffect(() => {
        const updateToday = () => setToday(getClinicDateInputValue(activeClinic.clinic?.timezone));
        updateToday();
        const timer = window.setInterval(updateToday, 30_000);
        return () => window.clearInterval(timer);
    }, [activeClinic.clinic?.timezone]);

    return (
        <QueuePageContent
            key={`${activeClinic.clinicId}:${activeClinic.clinic?.timezone ?? ''}:${today}`}
            todayDate={today}
        />
    );
}

export default QueuePage;
