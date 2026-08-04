import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState, useToast } from '../../components/feedback';
import {
    Button,
    FilterBar,
    PageHeader,
    RiskBadge as RiskLevelBadge,
    StatusBadge,
    fieldControlClassName,
    getQueueStatusLabel,
} from '../../components/ui';
import { isApiClientError } from '../../lib';
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

const getPredictionReasonMessages = (reasons: unknown[]): string[] => {
    return reasons.reduce<string[]>((messages, reason) => {
        if (
            typeof reason === 'object' &&
            reason !== null &&
            'message' in reason &&
            typeof reason.message === 'string'
        ) {
            messages.push(reason.message);
            return messages;
        }

        if (typeof reason === 'string') {
            messages.push(reason);
        }

        return messages;
    }, []);
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

const getQueueEntryIds = (queueEntries: QueueListItem[]): string[] => {
    return queueEntries.map((queueEntry) => queueEntry.id);
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
            firstEntry.position - secondEntry.position ||
            firstEntry.appointment.scheduledAt.localeCompare(secondEntry.appointment.scheduledAt)
    );
};

function RiskBadge({ queueEntry }: { queueEntry: QueueListItem }) {
    const prediction = queueEntry.noShowPrediction;

    if (!prediction) {
        return <span className="text-slate-500">Not available</span>;
    }

    const reasonMessages = getPredictionReasonMessages(prediction.reasons);
    const suggestedActions = getSuggestedActions(prediction.suggestedActions);

    return (
        <div>
            <RiskLevelBadge riskLevel={prediction.riskLevel} />
            {reasonMessages[0] ? (
                <p className="mt-2 max-w-xs text-xs text-slate-500">{reasonMessages[0]}</p>
            ) : null}
            {suggestedActions[0] ? (
                <p className="mt-2 max-w-xs text-xs font-medium text-slate-600">
                    Suggestion: {suggestedActions[0]}
                </p>
            ) : null}
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

function QueuePage() {
    const { clinicId } = useActiveClinic();
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
        const activeQueueEntries = getActiveQueueEntries(confirmedQueueEntries);
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
        () => getActiveQueueEntries(queueListState.queueEntries),
        [queueListState.queueEntries]
    );
    const activeQueueEntryIds = useMemo(
        () => getQueueEntryIds(activeQueueEntries),
        [activeQueueEntries]
    );
    const activeQueueIndexById = useMemo(() => {
        return activeQueueEntryIds.reduce<Map<string, number>>((indexes, queueEntryId, index) => {
            indexes.set(queueEntryId, index);

            return indexes;
        }, new Map<string, number>());
    }, [activeQueueEntryIds]);
    const isReordering = Boolean(reorderingQueueEntryId);

    return (
        <section className="space-y-6">
            <PageHeader
                eyebrow="Today queue"
                title="Live queue"
                description="View today's appointment queue, check each patient's position, and update queue status as staff manage the clinic flow."
                actions={
                    <Button
                        variant="outline"
                        onClick={handleRetryQueue}
                        isLoading={queueListState.status === 'loading'}
                        loadingText="Refreshing..."
                    >
                        Refresh queue
                    </Button>
                }
            />

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Queue date
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{todayDate}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Active entries
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {
                                queueListState.queueEntries.filter(
                                    (entry) => !isFinalQueueStatus(entry.status)
                                ).length
                            }
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Matching entries
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            {displayedQueueEntries.length}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Manual control
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                            Staff updates only
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
                />
            ) : null}

            {hasQueueEntries && displayedQueueEntries.length === 0 ? (
                <EmptyState
                    title="No queue entries match these filters."
                    message="Try another doctor or queue status to find matching entries."
                />
            ) : null}

            {hasFilteredQueueEntries ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Position</th>
                                    <th className="px-4 py-3 font-semibold">Patient</th>
                                    <th className="px-4 py-3 font-semibold">Doctor</th>
                                    <th className="px-4 py-3 font-semibold">Appointment</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Timeline</th>
                                    <th className="px-4 py-3 font-semibold">Risk</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {displayedQueueEntries.map((queueEntry) => {
                                    const statusActions = getQueueStatusActions(queueEntry.status);
                                    const isUpdating = updatingQueueEntryId === queueEntry.id;
                                    const isMoving = reorderingQueueEntryId === queueEntry.id;
                                    const isWaiting = queueEntry.status === QueueStatus.WAITING;
                                    const isFinalStatus = isFinalQueueStatus(queueEntry.status);
                                    const activeQueueIndex =
                                        activeQueueIndexById.get(queueEntry.id) ?? -1;
                                    const hasMoreThanOneActiveEntry =
                                        activeQueueEntryIds.length > 1;
                                    const canShowMoveUp =
                                        activeQueueIndex > 0 && hasMoreThanOneActiveEntry;
                                    const canShowMoveDown =
                                        activeQueueIndex >= 0 &&
                                        activeQueueIndex < activeQueueEntryIds.length - 1 &&
                                        hasMoreThanOneActiveEntry;
                                    const queueActionBusy =
                                        isReordering || Boolean(updatingQueueEntryId);

                                    return (
                                        <tr
                                            key={queueEntry.id}
                                            className={`align-top transition hover:bg-slate-50/70 ${
                                                isWaiting
                                                    ? 'bg-[var(--color-status-warning-bg)]'
                                                    : ''
                                            }`}
                                        >
                                            <td className="min-w-28 px-4 py-5">
                                                <p className="inline-flex min-w-14 justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                                                    #{queueEntry.position}
                                                </p>
                                                <p className="mt-2 text-xs font-medium text-slate-500">
                                                    Position {queueEntry.position}
                                                </p>
                                            </td>
                                            <td className="min-w-48 px-4 py-5">
                                                <p className="font-semibold text-slate-900">
                                                    {queueEntry.patient.fullName}
                                                </p>
                                                <p className="mt-1 text-slate-600">
                                                    {getOptionalText(queueEntry.patient.phone)}
                                                </p>
                                                {queueEntry.patient.age ? (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Age {queueEntry.patient.age}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="min-w-44 px-4 py-5">
                                                <p className="font-semibold text-slate-900">
                                                    {queueEntry.doctor.fullName}
                                                </p>
                                                <p className="mt-1 text-slate-600">
                                                    {getOptionalText(
                                                        queueEntry.doctor.specialization
                                                    )}
                                                </p>
                                            </td>
                                            <td className="min-w-56 px-4 py-5 text-slate-700">
                                                <p className="font-semibold text-slate-900">
                                                    {formatDateTime(
                                                        queueEntry.appointment.scheduledAt
                                                    )}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {queueEntry.appointment.durationMinutes} min
                                                </p>
                                                {queueEntry.appointment.reason ? (
                                                    <p className="mt-2 max-w-xs text-xs text-slate-500">
                                                        {queueEntry.appointment.reason}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="min-w-32 px-4 py-5">
                                                <StatusBadge
                                                    kind="queue"
                                                    status={queueEntry.status}
                                                />
                                                {isWaiting ? (
                                                    <p className="mt-2 text-xs font-semibold text-[var(--color-status-warning-text)]">
                                                        Waiting in queue
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="min-w-32 px-4 py-5">
                                                <QueueTimeline queueEntry={queueEntry} />
                                            </td>
                                            <td className="min-w-48 px-4 py-5">
                                                <RiskBadge queueEntry={queueEntry} />
                                            </td>
                                            <td className="min-w-44 px-4 py-5">
                                                {isFinalStatus ? (
                                                    <p className="mb-3 text-sm text-slate-500">
                                                        Queue order locked for final status.
                                                    </p>
                                                ) : (
                                                    <div className="mb-3 flex flex-col gap-2">
                                                        {canShowMoveUp ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    void handleQueueMove(
                                                                        queueEntry,
                                                                        -1
                                                                    )
                                                                }
                                                                disabled={queueActionBusy}
                                                                aria-label={`Move ${queueEntry.patient.fullName} up`}
                                                            >
                                                                {isMoving ? 'Moving...' : 'Move up'}
                                                            </Button>
                                                        ) : null}
                                                        {canShowMoveDown ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    void handleQueueMove(
                                                                        queueEntry,
                                                                        1
                                                                    )
                                                                }
                                                                disabled={queueActionBusy}
                                                                aria-label={`Move ${queueEntry.patient.fullName} down`}
                                                            >
                                                                {isMoving
                                                                    ? 'Moving...'
                                                                    : 'Move down'}
                                                            </Button>
                                                        ) : null}
                                                        {!canShowMoveUp && !canShowMoveDown ? (
                                                            <p className="text-sm text-slate-500">
                                                                Only active queue entry.
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                )}
                                                {statusActions.length > 0 ? (
                                                    <select
                                                        className={`${fieldControlClassName} w-40`}
                                                        value=""
                                                        onChange={(event) => {
                                                            const nextStatus = event.target
                                                                .value as QueueStatusType;

                                                            if (nextStatus) {
                                                                void handleStatusUpdate(
                                                                    queueEntry,
                                                                    nextStatus
                                                                );
                                                            }
                                                        }}
                                                        disabled={isUpdating || isReordering}
                                                        aria-label={`Update queue status for ${queueEntry.patient.fullName}`}
                                                    >
                                                        <option value="">
                                                            {isUpdating
                                                                ? 'Updating...'
                                                                : 'Update status'}
                                                        </option>
                                                        {statusActions.map((action) => (
                                                            <option
                                                                key={action.status}
                                                                value={action.status}
                                                            >
                                                                {action.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-sm text-slate-500">
                                                        Final status
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

export default QueuePage;
