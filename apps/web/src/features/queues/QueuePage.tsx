import { useCallback, useEffect, useState } from 'react';
import { useActiveClinic } from '../../app/activeClinicContext';
import { ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import { QueueStatus } from '../../types';
import type { QueueStatus as QueueStatusType, RiskLevel } from '../../types';
import { listTodayQueue, updateQueueStatus, type QueueListItem } from './queueApi';

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
    { value: QueueStatus.WAITING, label: 'Waiting' },
    { value: QueueStatus.ARRIVED, label: 'Arrived' },
    { value: QueueStatus.CALLED, label: 'Called' },
    { value: QueueStatus.COMPLETED, label: 'Completed' },
    { value: QueueStatus.CANCELLED, label: 'Cancelled' },
    { value: QueueStatus.NO_SHOW, label: 'No-show' },
];

const queueStatusLabels = queueStatusOptions.reduce<Record<QueueStatusType, string>>(
    (labels, option) => ({
        ...labels,
        [option.value]: option.label,
    }),
    {
        WAITING: 'Waiting',
        ARRIVED: 'Arrived',
        CALLED: 'Called',
        COMPLETED: 'Completed',
        CANCELLED: 'Cancelled',
        NO_SHOW: 'No-show',
    }
);

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

const getStatusBadgeClassName = (status: QueueStatusType): string => {
    const classNames: Record<QueueStatusType, string> = {
        WAITING: 'bg-amber-50 text-amber-700 ring-amber-200',
        ARRIVED: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
        CALLED: 'bg-violet-50 text-violet-700 ring-violet-200',
        COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-200',
        NO_SHOW: 'bg-red-50 text-red-700 ring-red-200',
    };

    return classNames[status];
};

const getRiskBadgeClassName = (riskLevel: RiskLevel): string => {
    const classNames: Record<RiskLevel, string> = {
        LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
        HIGH: 'bg-red-50 text-red-700 ring-red-200',
    };

    return classNames[riskLevel];
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

const getQueueStatusActions = (currentStatus: QueueStatusType): QueueStatusAction[] => {
    return queueStatusActionsByCurrentStatus[currentStatus];
};

function QueueStatusBadge({ status }: { status: QueueStatusType }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClassName(
                status
            )}`}
        >
            {queueStatusLabels[status]}
        </span>
    );
}

function RiskBadge({ queueEntry }: { queueEntry: QueueListItem }) {
    const prediction = queueEntry.noShowPrediction;

    if (!prediction) {
        return <span className="text-slate-500">Not available</span>;
    }

    const reasonMessages = getPredictionReasonMessages(prediction.reasons);

    return (
        <div>
            <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getRiskBadgeClassName(
                    prediction.riskLevel
                )}`}
            >
                {prediction.riskLevel.toLowerCase()} risk
            </span>
            {reasonMessages[0] ? (
                <p className="mt-2 max-w-xs text-xs text-slate-500">{reasonMessages[0]}</p>
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
    const todayDate = getTodayDateInputValue();
    const [queueListState, setQueueListState] = useState<QueueListState>(emptyQueueListState);
    const [updatingQueueEntryId, setUpdatingQueueEntryId] = useState<string | null>(null);
    const [statusUpdateError, setStatusUpdateError] = useState<{
        message: string;
        code?: string;
    } | null>(null);
    const [statusUpdateMessage, setStatusUpdateMessage] = useState<string | null>(null);

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
        refreshQueue();
    };

    const handleStatusUpdate = async (queueEntry: QueueListItem, nextStatus: QueueStatusType) => {
        if (nextStatus === queueEntry.status) {
            return;
        }

        setUpdatingQueueEntryId(queueEntry.id);
        setStatusUpdateError(null);
        setStatusUpdateMessage(null);

        try {
            const data = await updateQueueStatus(clinicId, queueEntry.id, nextStatus);

            setStatusUpdateMessage(
                `${queueEntry.patient.fullName} is now ${queueStatusLabels[
                    data.queueEntry.status
                ].toLowerCase()}.`
            );
            refreshQueue();
        } catch (error) {
            if (isApiClientError(error)) {
                setStatusUpdateError({
                    message: error.message,
                    code: error.code,
                });
                return;
            }

            setStatusUpdateError({
                message: 'Queue status could not be updated. Please try again.',
                code: 'QUEUE_STATUS_UPDATE_FAILED',
            });
        } finally {
            setUpdatingQueueEntryId(null);
        }
    };

    const hasQueueEntries =
        queueListState.status === 'success' && queueListState.queueEntries.length > 0;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Today queue
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Live queue</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        View today's appointment queue, check each patient's position, and update
                        queue status as staff manage the clinic flow.
                    </p>
                </div>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    onClick={handleRetryQueue}
                    disabled={queueListState.status === 'loading'}
                >
                    {queueListState.status === 'loading' ? 'Refreshing...' : 'Refresh queue'}
                </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 md:p-5">
                <div className="grid gap-4 md:grid-cols-3">
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
                                    (entry) => !finalQueueStatuses.includes(entry.status)
                                ).length
                            }
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

            {statusUpdateMessage ? (
                <div
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                    role="status"
                >
                    {statusUpdateMessage}
                    <button
                        type="button"
                        className="ml-3 text-emerald-700 underline decoration-emerald-300 underline-offset-2"
                        onClick={() => setStatusUpdateMessage(null)}
                    >
                        Dismiss
                    </button>
                </div>
            ) : null}

            {queueListState.status === 'success' && queueListState.queueEntries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                    <h2 className="text-lg font-semibold text-slate-900">
                        No queue entries for today
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                        Book appointments for today to add patients into the clinic queue.
                    </p>
                </div>
            ) : null}

            {hasQueueEntries ? (
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
                                {queueListState.queueEntries.map((queueEntry) => {
                                    const statusActions = getQueueStatusActions(queueEntry.status);
                                    const isUpdating = updatingQueueEntryId === queueEntry.id;
                                    const isWaiting = queueEntry.status === QueueStatus.WAITING;

                                    return (
                                        <tr
                                            key={queueEntry.id}
                                            className={`align-top ${
                                                isWaiting ? 'bg-amber-50/40' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-4">
                                                <p className="inline-flex min-w-14 justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                                                    #{queueEntry.position}
                                                </p>
                                                <p className="mt-2 text-xs font-medium text-slate-500">
                                                    Position {queueEntry.position}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
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
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {queueEntry.doctor.fullName}
                                                </p>
                                                <p className="mt-1 text-slate-600">
                                                    {getOptionalText(
                                                        queueEntry.doctor.specialization
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700">
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
                                            <td className="px-4 py-4">
                                                <QueueStatusBadge status={queueEntry.status} />
                                                {isWaiting ? (
                                                    <p className="mt-2 text-xs font-semibold text-amber-700">
                                                        Waiting in queue
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-4">
                                                <QueueTimeline queueEntry={queueEntry} />
                                            </td>
                                            <td className="px-4 py-4">
                                                <RiskBadge queueEntry={queueEntry} />
                                            </td>
                                            <td className="px-4 py-4">
                                                {statusActions.length > 0 ? (
                                                    <select
                                                        className="w-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
                                                        disabled={isUpdating}
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
