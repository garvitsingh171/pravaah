import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/feedback';
import { Badge, Button, Card, PageHeader, RiskBadge, type BadgeTone } from '../../components/ui';
import { isApiClientError } from '../../lib';
import { appRoutePaths } from '../../routes/dashboardRoutes';
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
    toneClassName: string;
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

const activityBadgeTones: Record<DashboardActivityType, BadgeTone> = {
    APPOINTMENT_BOOKED: 'info',
    APPOINTMENT_CANCELLED: 'neutral',
    APPOINTMENT_NO_SHOW: 'danger',
    QUEUE_JOINED: 'brand',
    PATIENT_CALLED: 'info',
    VISIT_COMPLETED: 'success',
    QUEUE_CANCELLED: 'neutral',
    QUEUE_NO_SHOW: 'danger',
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
            accentClassName: 'border-l-brand',
            toneClassName: 'bg-brand-subtle',
        },
        {
            label: 'Waiting queue',
            value: summary.queueSummary.waiting,
            helper: `${summary.queueSummary.total} queue entries today`,
            accentClassName: 'border-l-[var(--color-status-warning-text)]',
            toneClassName: 'bg-[var(--color-status-warning-bg)]',
        },
        {
            label: 'Completed visits',
            value: summary.appointmentSummary.completed,
            helper: `${summary.queueSummary.completed} queue visits completed`,
            accentClassName: 'border-l-[var(--color-status-success-text)]',
            toneClassName: 'bg-[var(--color-status-success-bg)]',
        },
        {
            label: 'Cancelled / no-show',
            value: cancelledNoShowCount,
            helper: `${summary.appointmentSummary.cancelled} cancelled, ${summary.appointmentSummary.noShow} no-show`,
            accentClassName: 'border-l-[var(--color-status-danger-text)]',
            toneClassName: 'bg-[var(--color-status-danger-bg)]',
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
            className={`rounded-lg border-l-4 bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-slate-200/70 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] ${card.accentClassName}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <span
                    className={`h-8 w-8 rounded-md ${card.toneClassName} ring-1 ring-slate-200/60`}
                    aria-hidden="true"
                />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.helper}</p>
        </article>
    );
}

type DistributionSegment = {
    label: string;
    value: number;
    className: string;
};

function DistributionBar({
    label,
    segments,
}: {
    label: string;
    segments: DistributionSegment[];
}) {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </p>
                <p className="text-xs font-semibold text-slate-500">{total} total</p>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                {segments.map((segment) => (
                    <span
                        key={segment.label}
                        className={segment.className}
                        style={{
                            width: total === 0 ? '0%' : `${(segment.value / total) * 100}%`,
                        }}
                    />
                ))}
            </div>
            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                {segments.map((segment) => (
                    <div key={segment.label} className="rounded-md bg-slate-50 px-3 py-2">
                        <dt className="text-xs font-medium text-slate-500">{segment.label}</dt>
                        <dd className="mt-1 text-sm font-bold text-slate-900">{segment.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function OperationalPulsePanel({ data }: { data: DashboardData }) {
    const { appointmentSummary, queueSummary, noShowRiskSummary } = data.summary;
    const activeAppointments =
        appointmentSummary.scheduled +
        appointmentSummary.confirmed +
        appointmentSummary.arrived +
        appointmentSummary.inQueue +
        appointmentSummary.called;
    const finalAppointments =
        appointmentSummary.completed + appointmentSummary.cancelled + appointmentSummary.noShow;
    const activeQueue = queueSummary.waiting + queueSummary.arrived + queueSummary.called;
    const needsAttention =
        activeAppointments > 0 || activeQueue > 0 || noShowRiskSummary.high > 0;
    const attentionItems = [
        {
            label: 'Appointments',
            value: activeAppointments,
            helper: `${finalAppointments} final today`,
        },
        {
            label: 'Queue',
            value: activeQueue,
            helper: `${queueSummary.waiting} waiting, ${queueSummary.called} called`,
        },
        {
            label: 'High risk',
            value: noShowRiskSummary.high,
            helper: `${noShowRiskSummary.medium} medium, ${noShowRiskSummary.low} low risk`,
        },
    ];
    const flowNodes = [
        {
            label: 'Scheduled',
            value: appointmentSummary.scheduled + appointmentSummary.confirmed,
        },
        {
            label: 'Arrived',
            value: appointmentSummary.arrived + appointmentSummary.inQueue,
        },
        {
            label: 'Called',
            value: appointmentSummary.called,
        },
        {
            label: 'Closed',
            value: finalAppointments,
        },
    ];

    return (
        <Card className="border-transparent bg-[#061927] text-white shadow-[var(--shadow-raised)]">
            <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr] xl:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        Operational pulse
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                        {needsAttention ? 'Staff attention now' : 'Clinic flow is clear'}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                        {needsAttention
                            ? 'Review the live appointment flow, queue, and no-show risk before the day backs up.'
                            : 'No active appointments, queue pressure, or high-risk flags are waiting.'}
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Link
                            to={appRoutePaths.appointments}
                            className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                            Review appointments
                        </Link>
                        <Link
                            to={appRoutePaths.queue}
                            className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Open queue
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {attentionItems.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-lg border-t-2 border-brand bg-white/[0.08] p-4 ring-1 ring-white/15"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                                    {item.label}
                                </p>
                                <p className="mt-2 text-3xl font-bold text-white">
                                    {item.value}
                                </p>
                                <p className="mt-2 text-xs leading-5 text-slate-200">
                                    {item.helper}
                                </p>
                            </div>
                        ))}
                    </div>

                    <ol
                        className="grid gap-3 rounded-lg bg-white/[0.06] p-3 ring-1 ring-white/10 sm:grid-cols-4"
                        aria-label="Appointment flow status summary"
                    >
                        {flowNodes.map((node, index) => (
                            <li
                                key={node.label}
                                className="relative rounded-md bg-[#092235] p-3 ring-1 ring-white/10"
                            >
                                {index < flowNodes.length - 1 ? (
                                    <span
                                        className="absolute right-[-0.9rem] top-1/2 hidden h-px w-5 bg-brand/70 sm:block"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                <p className="text-xs font-semibold text-slate-200">
                                    {node.label}
                                </p>
                                <p className="mt-2 text-2xl font-bold text-brand">
                                    {node.value}
                                </p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </Card>
    );
}

function HighRiskAppointmentsCard({
    appointments,
}: {
    appointments: DashboardHighRiskAppointment[];
}) {
    return (
        <Card>
            <div>
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-status-danger-text)]">
                    High-risk appointments
                </p>
                <h2 className="mt-2 text-xl font-bold text-app-text">No-show attention list</h2>
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
        </Card>
    );
}

function ActivityBadge({ type }: { type: DashboardActivityType }) {
    return <Badge tone={activityBadgeTones[type]}>{activityLabels[type]}</Badge>;
}

function TodayActivitySection({ activityItems }: { activityItems: DashboardActivityItem[] }) {
    return (
        <Card>
            <div>
                <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                    Today activity
                </p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Recent clinic activity</h2>
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
        </Card>
    );
}

function OperationalDistributionCard({ data }: { data: DashboardData }) {
    const { appointmentSummary, queueSummary, noShowRiskSummary } = data.summary;

    return (
        <Card className="shadow-[var(--shadow-soft)]">
            <div>
                <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                    Flow mix
                </p>
                <h2 className="mt-2 text-xl font-bold text-app-text">Today by status</h2>
            </div>

            <div className="mt-5 space-y-6">
                <DistributionBar
                    label="Appointments"
                    segments={[
                        {
                            label: 'Booked',
                            value: appointmentSummary.scheduled + appointmentSummary.confirmed,
                            className: 'bg-brand',
                        },
                        {
                            label: 'In flow',
                            value:
                                appointmentSummary.arrived +
                                appointmentSummary.inQueue +
                                appointmentSummary.called,
                            className: 'bg-blue-500',
                        },
                        {
                            label: 'Final',
                            value:
                                appointmentSummary.completed +
                                appointmentSummary.cancelled +
                                appointmentSummary.noShow,
                            className: 'bg-slate-700',
                        },
                    ]}
                />
                <DistributionBar
                    label="Queue"
                    segments={[
                        {
                            label: 'Waiting',
                            value: queueSummary.waiting + queueSummary.arrived,
                            className: 'bg-[var(--color-status-warning-text)]',
                        },
                        {
                            label: 'Called',
                            value: queueSummary.called,
                            className: 'bg-brand',
                        },
                        {
                            label: 'Final',
                            value:
                                queueSummary.completed +
                                queueSummary.cancelled +
                                queueSummary.noShow,
                            className: 'bg-slate-700',
                        },
                    ]}
                />
                <DistributionBar
                    label="No-show risk"
                    segments={[
                        {
                            label: 'High',
                            value: noShowRiskSummary.high,
                            className: 'bg-[var(--color-status-danger-text)]',
                        },
                        {
                            label: 'Medium',
                            value: noShowRiskSummary.medium,
                            className: 'bg-[var(--color-status-warning-text)]',
                        },
                        {
                            label: 'Low',
                            value: noShowRiskSummary.low,
                            className: 'bg-[var(--color-status-success-text)]',
                        },
                    ]}
                />
            </div>
        </Card>
    );
}

function DashboardOverviewPage() {
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
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
            <PageHeader
                actions={
                    <Button
                        variant="outline"
                        onClick={refreshDashboard}
                        isLoading={dashboardState.status === 'loading'}
                        loadingText="Refreshing..."
                    >
                        Refresh
                    </Button>
                }
            />

            {dashboardState.status === 'loading' ? (
                <LoadingState message="Loading dashboard summary..." variant="panel" />
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
                    <OperationalPulsePanel data={dashboardData} />

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
                        <div className="grid gap-4 sm:grid-cols-2">
                            {summaryCards.map((card) => (
                                <SummaryCardItem key={card.label} card={card} />
                            ))}
                        </div>
                        <OperationalDistributionCard data={dashboardData} />
                    </div>

                    {!hasDashboardData ? (
                        <EmptyState
                            title="No dashboard activity for today."
                            message="Book today's first appointment to start filling the dashboard, queue, and activity feed."
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
