import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Button,
    FilterBar,
    LifecycleRail,
    PageHeader,
    RiskBadge as RiskLevelBadge,
    RiskExplanation,
    StatusBadge,
    fieldControlClassName,
    getQueueStatusLabel,
    getAppointmentStatusLabel,
} from '../../components/ui';
import { isApiClientError } from '../../lib';
import { appRoutePaths } from '../../routes/dashboardRoutes';
import { QueueStatus } from '../../types';
import type { QueueStatus as QueueStatusType } from '../../types';
import { listTodayQueue, reorderQueue, updateQueueStatus, type QueueListItem } from './queueApi';

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

const emptyQueueListState: QueueListState = {
    status: 'loading',
    queueEntries: [],
    error: null,
};

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

const queueLifecycleSteps = [
    {
        id: QueueStatus.ARRIVED,
        label: 'Arrived',
        description: 'Patient present',
    },
    {
        id: QueueStatus.WAITING,
        label: 'Waiting',
        description: 'Active queue order',
    },
    {
        id: QueueStatus.CALLED,
        label: 'Called',
        description: 'Patient called',
    },
    {
        id: QueueStatus.COMPLETED,
        label: 'Completed',
        description: 'Visit closed',
    },
];

const isFinalQueueStatus = (status: QueueStatusType): boolean => {
    return finalQueueStatuses.includes(status);
};

const queueStatusActionsByCurrentStatus: Record<QueueStatusType, QueueStatusAction[]> = {
    WAITING: [
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

const getTodayDateInputValue = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

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

const formatDateTime = (value: string): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const formatTime = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        timeStyle: 'short',
    }).format(date);
};

const getOptionalText = (value: string | number | null | undefined): string => {
    if (value === undefined || value === null) {
        return 'Not added';
    }

    return String(value).trim() || 'Not added';
};

const getSuggestedActions = (actions: unknown): string[] => {
    if (!Array.isArray(actions)) {
        return [];
    }

    return actions.filter((action): action is string => {
        return typeof action === 'string' && action.trim().length > 0;
    });
};

const getQueueStatusActions = (currentStatus: QueueStatusType): QueueStatusAction[] => {
    return queueStatusActionsByCurrentStatus[currentStatus];
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

function RiskBadge({ queueEntry }: { queueEntry: QueueListItem }) {
    const prediction = queueEntry.noShowPrediction;

    if (!prediction) {
        return <span className="text-slate-500">Not available</span>;
    }

    const suggestedActions = getSuggestedActions(prediction.suggestedActions);

    return (
        <div className="space-y-3">
            <RiskLevelBadge riskLevel={prediction.riskLevel} />
            {suggestedActions[0] ? (
                <p className="max-w-xs text-xs font-medium text-slate-600">
                    Suggestion: {suggestedActions[0]}
                </p>
            ) : null}
            <RiskExplanation
                prediction={prediction}
                subjectName={queueEntry.patient.fullName}
                compact={false}
            />
        </div>
    );
}

function QueueTimeline({ queueEntry }: { queueEntry: QueueListItem }) {
    const queuedAt = formatTime(queueEntry.queuedAt);
    const calledAt = formatTime(queueEntry.calledAt);
    const completedAt = formatTime(queueEntry.completedAt);

    return (
        <div className="space-y-1 text-xs text-slate-500">
            {queuedAt ? <p>Queued {queuedAt}</p> : null}
            {calledAt ? <p>Called {calledAt}</p> : null}
            {completedAt ? <p>Completed {completedAt}</p> : null}
            {!queuedAt && !calledAt && !completedAt ? <p>Not added</p> : null}
        </div>
    );
}

function QueueLifecyclePanel({ selectedStatus }: { selectedStatus: QueueStatusType | '' }) {
    const currentStepId =
        selectedStatus && !isFinalQueueStatus(selectedStatus) ? selectedStatus : undefined;

    return (
        <LifecycleRail
            steps={queueLifecycleSteps}
            currentStepId={currentStepId}
            terminalLabel="Final entries are locked."
            ariaLabel="Queue lifecycle model"
        />
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] hover:bg-brand-subtle hover:text-brand-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
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
                {statusActions.map((action) => (
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
}: {
    activeQueueIndexesByDoctor: Map<string, Map<string, number>>;
    allActiveQueueEntries: QueueListItem[];
    handleQueueMove: (queueEntry: QueueListItem, offset: -1 | 1) => void;
    handleStatusUpdate: (queueEntry: QueueListItem, nextStatus: QueueStatusType) => void;
    isReordering: boolean;
    queueEntry: QueueListItem;
    reorderingQueueEntryId: string | null;
    updatingQueueEntryId: string | null;
}) {
    const statusActions = getQueueStatusActions(queueEntry.status);
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
            className={`queue-card-confirmed rounded-lg bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-slate-200/80 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] ${
                isWaiting ? 'bg-[var(--color-status-warning-bg)]' : ''
            }`}
            data-testid="active-queue-card"
        >
            <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1fr)]">
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
                            label={`Move ${queueEntry.patient.fullName} up`}
                            onClick={() => handleQueueMove(queueEntry, -1)}
                        />
                        <QueueMoveButton
                            direction="down"
                            disabled={!canMoveDown || queueActionBusy}
                            isBusy={isMoving && canMoveDown}
                            label={`Move ${queueEntry.patient.fullName} down`}
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
                            <h3 className="truncate text-base font-bold text-slate-950">
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
                                {formatDateTime(queueEntry.appointment.scheduledAt)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {queueEntry.appointment.durationMinutes} min
                            </p>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Timeline
                            </p>
                            <div className="mt-1">
                                <QueueTimeline queueEntry={queueEntry} />
                            </div>
                        </div>
                    </div>
                    {queueEntry.appointment.reason ? (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                            {queueEntry.appointment.reason}
                        </p>
                    ) : null}
                </div>

                <div className="grid gap-4 content-start">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge kind="queue" status={queueEntry.status} />
                        {isWaiting ? (
                            <span className="text-xs font-semibold text-[var(--color-status-warning-text)]">
                                Waiting in queue
                            </span>
                        ) : null}
                    </div>

                    <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Risk support
                        </p>
                        <div className="mt-2">
                            <RiskBadge queueEntry={queueEntry} />
                        </div>
                    </div>

                    <QueueStatusActions
                        isReordering={isReordering}
                        isUpdating={isUpdating}
                        onStatusUpdate={handleStatusUpdate}
                        queueEntry={queueEntry}
                        statusActions={statusActions}
                    />
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

            <div className="grid gap-4 xl:grid-cols-2">
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
                                />
                            ))}
                        </ol>
                    </article>
                ))}
            </div>
        </section>
    );
}

function FinalQueueEntriesSection({ finalQueueEntries }: { finalQueueEntries: QueueListItem[] }) {
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
                {finalQueueEntries.map((queueEntry) => (
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
                                {formatDateTime(queueEntry.appointment.scheduledAt)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <StatusBadge kind="queue" status={queueEntry.status} />
                            <p className="text-slate-500">
                                Appointment:{' '}
                                {getAppointmentStatusLabel(queueEntry.appointment.status)}
                            </p>
                        </div>
                        <p className="font-medium text-slate-500">Reorder unavailable</p>
                    </article>
                ))}
            </div>
        </details>
    );
}

function QueuePage() {
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
    const { showErrorToast, showSuccessToast } = useToast();
    const todayDate = getTodayDateInputValue();
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<QueueStatusType | ''>('');
    const [queueListState, setQueueListState] = useState<QueueListState>(emptyQueueListState);
    const [updatingQueueEntryId, setUpdatingQueueEntryId] = useState<string | null>(null);
    const [statusUpdateError, setStatusUpdateError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);
    const [reorderingQueueEntryId, setReorderingQueueEntryId] = useState<string | null>(null);
    const [reorderError, setReorderError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [reorderMessage, setReorderMessage] = useState<string | null>(null);

    const loadQueue = useCallback(
        async (signal?: AbortSignal) => {
            const data = await listTodayQueue(clinicId, todayDate, signal);

            return data.queueEntries;
        },
        [clinicId, todayDate]
    );

    const refreshQueue = useCallback(() => {
        setQueueListState((currentState) => ({
            status: 'loading',
            queueEntries: currentState.queueEntries,
            error: null,
        }));

        void loadQueue()
            .then((queueEntries) => {
                setQueueListState({
                    status: 'success',
                    queueEntries,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getQueueListErrorState(error, queueListState.queueEntries);

                if (errorState) {
                    setQueueListState(errorState);
                }
            });
    }, [loadQueue, queueListState.queueEntries]);

    useEffect(() => {
        const abortController = new AbortController();

        void loadQueue(abortController.signal)
            .then((queueEntries) => {
                setQueueListState({
                    status: 'success',
                    queueEntries,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getQueueListErrorState(error);

                if (errorState) {
                    setQueueListState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadQueue]);

    const handleRetryQueue = () => {
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setReorderError(null);
        setReorderMessage(null);
        refreshQueue();
    };

    const handleStatusUpdate = async (queueEntry: QueueListItem, nextStatus: QueueStatusType) => {
        if (nextStatus === queueEntry.status || reorderingQueueEntryId) {
            return;
        }

        setUpdatingQueueEntryId(queueEntry.id);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);
        setReorderError(null);
        setReorderMessage(null);

        try {
            const data = await updateQueueStatus(clinicId, queueEntry.id, nextStatus);

            setStatusUpdateMessage(
                `${queueEntry.patient.fullName} is now ${getQueueStatusLabelLower(
                    data.queueEntry.status
                )}.`
            );
            showSuccessToast(
                `Queue status updated to ${getQueueStatusLabelLower(data.queueEntry.status)}.`
            );
            refreshQueue();
        } catch (error) {
            if (isApiClientError(error)) {
                setStatusUpdateError({
                    message: error.message,
                    code: error.code,
                });
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Queue status could not be updated. Please try again.';

            setStatusUpdateError({
                message: fallbackMessage,
                code: 'QUEUE_STATUS_UPDATE_FAILED',
            });
            showErrorToast(fallbackMessage);
        } finally {
            setUpdatingQueueEntryId(null);
        }
    };

    const handleQueueMove = async (queueEntry: QueueListItem, offset: -1 | 1) => {
        if (queueListState.status !== 'success' || reorderingQueueEntryId || updatingQueueEntryId) {
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
        setReorderError(null);
        setReorderMessage(null);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);

        try {
            const data = await reorderQueue(clinicId, {
                date: todayDate,
                queueEntryIds: nextQueueEntryIds,
            });

            setQueueListState({
                status: 'success',
                queueEntries: mergeQueueEntriesWithReorderedActiveEntries(
                    confirmedQueueEntries,
                    data.queueEntries
                ),
                error: null,
            });
            setReorderMessage(`Moved ${queueEntry.patient.fullName}.`);
            showSuccessToast('Queue order updated successfully.');
        } catch (error) {
            setQueueListState({
                status: 'success',
                queueEntries: confirmedQueueEntries,
                error: null,
            });

            if (isApiClientError(error)) {
                setReorderError({
                    message: error.message,
                    code: error.code,
                });
                showErrorToast(error.message);
                return;
            }

            const fallbackMessage = 'Queue order could not be updated. Please try again.';

            setReorderError({
                message: fallbackMessage,
                code: 'QUEUE_REORDER_FAILED',
            });
            showErrorToast(fallbackMessage);
        } finally {
            setReorderingQueueEntryId(null);
        }
    };

    const hasQueueEntries =
        queueListState.status === 'success' && queueListState.queueEntries.length > 0;
    const queueDoctors = useMemo(
        () => getUniqueQueueDoctors(queueListState.queueEntries),
        [queueListState.queueEntries]
    );
    const displayedQueueEntries = useMemo(() => {
        if (queueListState.status !== 'success') {
            return [];
        }

        return queueListState.queueEntries.filter((queueEntry) => {
            const doctorMatches = !selectedDoctorId || queueEntry.doctor.id === selectedDoctorId;
            const statusMatches = !selectedStatus || queueEntry.status === selectedStatus;

            return doctorMatches && statusMatches;
        });
    }, [queueListState, selectedDoctorId, selectedStatus]);
    const hasFilteredQueueEntries =
        queueListState.status === 'success' && displayedQueueEntries.length > 0;
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
        return allActiveQueueEntries.reduce<Map<string, Map<string, number>>>(
            (indexesByDoctor, queueEntry) => {
                const doctorId = queueEntry.doctor.id;
                const doctorQueueEntries = getQueueEntriesForDoctorScope(
                    allActiveQueueEntries,
                    doctorId
                );
                const doctorIndexes = new Map<string, number>();

                doctorQueueEntries.forEach((doctorQueueEntry, index) => {
                    doctorIndexes.set(doctorQueueEntry.id, index);
                });
                indexesByDoctor.set(doctorId, doctorIndexes);

                return indexesByDoctor;
            },
            new Map<string, Map<string, number>>()
        );
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
    const isReordering = Boolean(reorderingQueueEntryId);

    return (
        <section className="space-y-6">
            <PageHeader
                title="Queue"
                description="Operate today's doctor-scoped waiting order."
                actions={
                    <Button
                        variant="outline"
                        onClick={handleRetryQueue}
                        isLoading={queueListState.status === 'loading'}
                        loadingText="Refreshing..."
                    >
                        Refresh
                    </Button>
                }
            />

            <QueueLifecyclePanel selectedStatus={selectedStatus} />

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-4">
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
                        <p className="mt-1 text-sm font-semibold text-slate-900">
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
                        <p className="mt-1 text-sm font-semibold text-slate-900">
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
                        <p className="mt-1 text-xs text-slate-500">
                            Manual doctor-scoped order.
                        </p>
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

            {queueListState.status === 'loading' ? (
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

            {statusUpdateError ? (
                <ErrorMessage
                    title="Queue status was not updated"
                    message={statusUpdateError.message}
                    code={statusUpdateError.code}
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

            {queueListState.status === 'success' && queueListState.queueEntries.length === 0 ? (
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
                    handleQueueMove={(queueEntry, offset) => void handleQueueMove(queueEntry, offset)}
                    handleStatusUpdate={(queueEntry, nextStatus) =>
                        void handleStatusUpdate(queueEntry, nextStatus)
                    }
                    isReordering={isReordering}
                    reorderingQueueEntryId={reorderingQueueEntryId}
                    todayDate={todayDate}
                    updatingQueueEntryId={updatingQueueEntryId}
                />
            ) : null}

            {hasFilteredQueueEntries && finalQueueEntries.length > 0 ? (
                <FinalQueueEntriesSection finalQueueEntries={finalQueueEntries} />
            ) : null}
        </section>
    );
}

export default QueuePage;
