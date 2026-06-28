import { useCallback, useEffect, useState } from 'react';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/feedback';
import { isApiClientError } from '../../lib';
import type { RiskLevel } from '../../types';
import {
    getDashboardSummary,
    listHighRiskAppointments,
    listTodayActivity,
    type DashboardActivityItem,
    type DashboardActivityType,
    type DashboardHighRiskAppointment,
    type DashboardSummary,
} from './dashboardApi';

type DashboardData = {
    summary: DashboardSummary;
    highRiskAppointments: DashboardHighRiskAppointment[];
    activityItems: DashboardActivityItem[];
};

type DashboardState =
    | {
          status: 'loading';
          data: DashboardData | null;
          error: null;
      }
    | {
          status: 'success';
          data: DashboardData;
          error: null;
      }
    | {
          status: 'error';
          data: DashboardData | null;
          error: {
              message: string;
              code?: string;
          };
      };

type SummaryCard = {
    label: string;
    value: number;
    helper: string;
    accentClassName: string;
};

const emptyDashboardState: DashboardState = {
    status: 'loading',
    data: null,
    error: null,
};

const activityLabels: Record<DashboardActivityType, string> = {
    APPOINTMENT_BOOKED: 'Appointment booked',
    APPOINTMENT_CANCELLED: 'Appointment cancelled',
    APPOINTMENT_NO_SHOW: 'Appointment marked no-show',
    QUEUE_JOINED: 'Patient arrived',
    PATIENT_CALLED: 'Patient called',
    VISIT_COMPLETED: 'Visit completed',
    QUEUE_CANCELLED: 'Queue entry cancelled',
    QUEUE_NO_SHOW: 'Queue marked no-show',
};

const activityBadgeClassNames: Record<DashboardActivityType, string> = {
    APPOINTMENT_BOOKED: 'bg-blue-50 text-blue-700 ring-blue-200',
    APPOINTMENT_CANCELLED: 'bg-slate-100 text-slate-700 ring-slate-200',
    APPOINTMENT_NO_SHOW: 'bg-red-50 text-red-700 ring-red-200',
    QUEUE_JOINED: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
    PATIENT_CALLED: 'bg-violet-50 text-violet-700 ring-violet-200',
    VISIT_COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    QUEUE_CANCELLED: 'bg-slate-100 text-slate-700 ring-slate-200',
    QUEUE_NO_SHOW: 'bg-red-50 text-red-700 ring-red-200',
};

const getRiskBadgeClassName = (riskLevel: RiskLevel): string => {
    const classNames: Record<RiskLevel, string> = {
        LOW: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
        HIGH: 'bg-red-50 text-red-700 ring-red-200',
    };

    return classNames[riskLevel];
};

const getDashboardErrorState = (
    error: unknown,
    data: DashboardData | null = null
): DashboardState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            data,
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        data,
        error: {
            message: 'Dashboard data could not be loaded. Please try again.',
            code: 'DASHBOARD_LOAD_FAILED',
        },
    };
};

const formatDate = (value: string): string => {
    const [year, month, day] = value.split('-').map(Number);
    const date = year && month && day ? new Date(year, month - 1, day) : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
    }).format(date);
};

const formatTime = (value: string): string => {
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

const buildSummaryCards = (summary: DashboardSummary): SummaryCard[] => {
    const cancelledNoShowCount =
        summary.appointmentSummary.cancelled + summary.appointmentSummary.noShow;

    return [
        {
            label: "Today's appointments",
            value: summary.appointmentSummary.total,
            helper: `${summary.appointmentSummary.scheduled} scheduled, ${summary.appointmentSummary.confirmed} confirmed`,
            accentClassName: 'border-l-blue-500',
        },
        {
            label: 'Waiting queue',
            value: summary.queueSummary.waiting,
            helper: `${summary.queueSummary.total} queue entries today`,
            accentClassName: 'border-l-amber-500',
        },
        {
            label: 'Completed visits',
            value: summary.appointmentSummary.completed,
            helper: `${summary.queueSummary.completed} queue visits completed`,
            accentClassName: 'border-l-emerald-500',
        },
        {
            label: 'Cancelled / no-show',
            value: cancelledNoShowCount,
            helper: `${summary.appointmentSummary.cancelled} cancelled, ${summary.appointmentSummary.noShow} no-show`,
            accentClassName: 'border-l-red-500',
        },
    ];
};

const hasUsefulDashboardData = (data: DashboardData): boolean => {
    const { appointmentSummary, queueSummary, noShowRiskSummary } = data.summary;

    return (
        appointmentSummary.total > 0 ||
        queueSummary.total > 0 ||
        noShowRiskSummary.high > 0 ||
        noShowRiskSummary.medium > 0 ||
        noShowRiskSummary.low > 0 ||
        data.highRiskAppointments.length > 0 ||
        data.activityItems.length > 0
    );
};

function SummaryCardItem({ card }: { card: SummaryCard }) {
    return (
        <article
            className={`rounded-lg border border-slate-200 border-l-4 bg-white p-5 ${card.accentClassName}`}
        >
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
        </article>
    );
}

function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getRiskBadgeClassName(
                riskLevel
            )}`}
        >
            {riskLevel.toLowerCase()} risk
        </span>
    );
}

function HighRiskAppointmentsCard({
    appointments,
}: {
    appointments: DashboardHighRiskAppointment[];
}) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div>
                <p className="text-sm font-medium uppercase tracking-wide text-red-600">
                    High-risk appointments
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">No-show attention list</h2>
            </div>

            {appointments.length === 0 ? (
                <div className="mt-5">
                    <EmptyState
                        title="No high-risk appointments today."
                        message="Appointments with high no-show risk will appear here when the backend has matching prediction data."
                    />
                </div>
            ) : (
                <div className="mt-5 divide-y divide-slate-200">
                    {appointments.map((item) => (
                        <article
                            key={item.appointment.id}
                            className="grid gap-4 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center"
                        >
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {item.patient.fullName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {getOptionalText(item.patient.phone)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {item.doctor.fullName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {formatTime(item.appointment.scheduledAt)}
                                </p>
                            </div>

                            <RiskBadge riskLevel={item.noShowPrediction.riskLevel} />
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function ActivityBadge({ type }: { type: DashboardActivityType }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${activityBadgeClassNames[type]}`}
        >
            {activityLabels[type]}
        </span>
    );
}

function TodayActivitySection({ activityItems }: { activityItems: DashboardActivityItem[] }) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                    Today activity
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Recent clinic activity</h2>
            </div>

            {activityItems.length === 0 ? (
                <div className="mt-5">
                    <EmptyState
                        title="No recent activity yet."
                        message="Bookings, arrivals, calls, completed visits, cancellations, and no-shows will appear here as staff work through the day."
                    />
                </div>
            ) : (
                <div className="mt-5 divide-y divide-slate-200">
                    {activityItems.map((activityItem) => (
                        <article
                            key={activityItem.id}
                            className="grid gap-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
                        >
                            <ActivityBadge type={activityItem.type} />

                            <div>
                                <p className="font-semibold text-slate-900">
                                    {activityItem.patient.fullName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {activityItem.doctor.fullName} at{' '}
                                    {formatTime(activityItem.appointment.scheduledAt)}
                                </p>
                                {activityItem.appointment.reason ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {activityItem.appointment.reason}
                                    </p>
                                ) : null}
                            </div>

                            <p className="text-sm font-medium text-slate-600">
                                {formatTime(activityItem.timestamp)}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function DashboardOverviewPage() {
    const { clinicId } = useActiveClinic();
    const [dashboardState, setDashboardState] = useState<DashboardState>(emptyDashboardState);

    const loadDashboard = useCallback(
        async (signal?: AbortSignal): Promise<DashboardData> => {
            const [summaryData, highRiskData, activityData] = await Promise.all([
                getDashboardSummary(clinicId, signal),
                listHighRiskAppointments(clinicId, signal),
                listTodayActivity(clinicId, signal),
            ]);

            return {
                summary: summaryData.dashboardSummary,
                highRiskAppointments: highRiskData.highRiskAppointments,
                activityItems: activityData.activityItems,
            };
        },
        [clinicId]
    );

    const refreshDashboard = useCallback(() => {
        setDashboardState((currentState) => ({
            status: 'loading',
            data: currentState.data,
            error: null,
        }));

        void loadDashboard()
            .then((data) => {
                setDashboardState({
                    status: 'success',
                    data,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                setDashboardState((currentState) => {
                    const errorState = getDashboardErrorState(error, currentState.data);

                    return errorState ?? currentState;
                });
            });
    }, [loadDashboard]);

    useEffect(() => {
        const abortController = new AbortController();

        void loadDashboard(abortController.signal)
            .then((data) => {
                setDashboardState({
                    status: 'success',
                    data,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getDashboardErrorState(error);

                if (errorState) {
                    setDashboardState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [loadDashboard]);

    const dashboardData = dashboardState.data;
    const summaryCards = dashboardData ? buildSummaryCards(dashboardData.summary) : [];
    const hasDashboardData = dashboardData ? hasUsefulDashboardData(dashboardData) : false;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 md:flex-row md:items-start md:justify-between md:p-8">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        Dashboard
                    </p>

                    <h1 className="mt-3 text-3xl font-bold text-slate-900">Dashboard overview</h1>

                    <p className="mt-4 max-w-2xl text-slate-600">
                        Track today's appointments, queue pressure, completed visits, and no-show
                        risk before the clinic day slips out of view.
                    </p>

                    {dashboardData ? (
                        <p className="mt-3 text-sm font-medium text-slate-500">
                            Clinic day: {formatDate(dashboardData.summary.date)}
                        </p>
                    ) : null}
                </div>

                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                    onClick={refreshDashboard}
                    disabled={dashboardState.status === 'loading'}
                >
                    {dashboardState.status === 'loading' ? 'Refreshing...' : 'Refresh dashboard'}
                </button>
            </div>

            {dashboardState.status === 'loading' ? (
                <LoadingState message="Loading dashboard summary..." />
            ) : null}

            {dashboardState.status === 'error' ? (
                <ErrorMessage
                    title="Dashboard could not be loaded"
                    message={dashboardState.error.message}
                    code={dashboardState.error.code}
                    onRetry={refreshDashboard}
                />
            ) : null}

            {dashboardData ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card) => (
                            <SummaryCardItem key={card.label} card={card} />
                        ))}
                    </div>

                    {!hasDashboardData ? (
                        <EmptyState
                            title="No dashboard activity for today."
                            message="Book today's first appointment to start filling the dashboard, queue, and activity feed."
                        />
                    ) : null}

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                        <HighRiskAppointmentsCard
                            appointments={dashboardData.highRiskAppointments}
                        />
                        <TodayActivitySection activityItems={dashboardData.activityItems} />
                    </div>
                </>
            ) : null}
        </section>
    );
}

export default DashboardOverviewPage;
