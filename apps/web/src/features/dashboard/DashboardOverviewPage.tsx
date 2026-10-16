import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/feedback';
import {
    Badge,
    Button,
    Card,
    PageHeader,
    RiskExplanation,
    type BadgeTone,
} from '../../components/ui';
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
    icon: 'calendar' | 'queue' | 'check' | 'alert';
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

const formatTime = (value: string, timezone?: string | null): string => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    try {
        return new Intl.DateTimeFormat('en-IN', {
            timeStyle: 'short',
            timeZone: timezone || undefined,
        }).format(date);
    } catch {
        return new Intl.DateTimeFormat('en-IN', { timeStyle: 'short' }).format(date);
    }
};

const formatClinicDate = (date: string): string => {
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(parsed);
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
            icon: 'calendar',
        },
        {
            label: 'Waiting queue',
            value: summary.queueSummary.waiting,
            helper: `${summary.queueSummary.total} queue entries today`,
            accentClassName: 'border-l-[var(--color-status-warning-text)]',
            toneClassName: 'bg-[var(--color-status-warning-bg)]',
            icon: 'queue',
        },
        {
            label: 'Completed visits',
            value: summary.appointmentSummary.completed,
            helper: `${summary.queueSummary.completed} queue visits completed`,
            accentClassName: 'border-l-[var(--color-status-success-text)]',
            toneClassName: 'bg-[var(--color-status-success-bg)]',
            icon: 'check',
        },
        {
            label: 'Cancelled / no-show',
            value: cancelledNoShowCount,
            helper: `${summary.appointmentSummary.cancelled} cancelled, ${summary.appointmentSummary.noShow} no-show`,
            accentClassName: 'border-l-[var(--color-status-danger-text)]',
            toneClassName: 'bg-[var(--color-status-danger-bg)]',
            icon: 'alert',
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
    const iconPath = {
        calendar:
            'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
        queue: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
        check: 'M20 6 9 17l-5-5',
        alert: 'M12 9v4m0 4h.01M10.3 3.8 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3l-8.3-14.2a2 2 0 0 0-3.4 0Z',
    }[card.icon];
    return (
        <article
            className={`rounded-app-lg border border-app-border border-l-[3px] bg-white p-4 shadow-[var(--shadow-soft)] ${card.accentClassName}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {card.label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                </div>
                <span
                    className={`flex h-9 w-9 items-center justify-center rounded-app ${card.toneClassName} text-app-text`}
                    aria-hidden="true"
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d={iconPath} />
                    </svg>
                </span>
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

function DistributionBar({ label, segments }: { label: string; segments: DistributionSegment[] }) {
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
    const needsAttention = activeAppointments > 0 || activeQueue > 0 || noShowRiskSummary.high > 0;
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
        <section className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-[var(--shadow-soft)] sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        Operational pulse
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                        {needsAttention ? 'Staff attention now' : 'Clinic flow is clear'}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                        {activeQueue > 0
                            ? `${queueSummary.waiting} waiting and ${queueSummary.called} called. Open the queue to see who is next.`
                            : noShowRiskSummary.high > 0
                              ? `${noShowRiskSummary.high} appointment${noShowRiskSummary.high === 1 ? '' : 's'} flagged for staff review.`
                              : needsAttention
                                ? 'Scheduled appointments are still in progress today.'
                                : 'No active appointments or queue entries need attention right now.'}
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

                <div>
                    <ol
                        className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 sm:grid-cols-4"
                        aria-label="Appointment flow status summary"
                    >
                        {flowNodes.map((node, index) => (
                            <li
                                key={node.label}
                                className="relative rounded-md border border-white/15 bg-white/[0.08] p-3"
                            >
                                {index < flowNodes.length - 1 ? (
                                    <span
                                        className="absolute right-[-0.9rem] top-1/2 hidden h-px w-5 bg-brand/70 sm:block"
                                        aria-hidden="true"
                                    />
                                ) : null}
                                <p className="text-xs font-semibold text-slate-200">{node.label}</p>
                                <p className="mt-2 text-2xl font-bold text-brand">{node.value}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}

function HighRiskAppointmentsCard({
    appointments,
    timezone,
}: {
    appointments: DashboardHighRiskAppointment[];
    timezone?: string | null;
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
                                    Appointment needs staff review
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {item.doctor.fullName}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {formatTime(item.appointment.scheduledAt, timezone)}
                                </p>
                            </div>

                            <div className="md:text-right">
                                <Link
                                    to={appRoutePaths.appointments}
                                    className="block text-sm font-semibold text-action underline-offset-2 hover:underline"
                                >
                                    Review appointment
                                </Link>
                            </div>
                            <div className="md:col-span-3">
                                <RiskExplanation
                                    prediction={item.noShowPrediction}
                                    subjectName={item.patient.fullName}
                                />
                            </div>
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

function TodayActivitySection({
    activityItems,
    timezone,
}: {
    activityItems: DashboardActivityItem[];
    timezone?: string | null;
}) {
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
                                    {formatTime(activityItem.appointment.scheduledAt, timezone)}
                                </p>
                                {activityItem.appointment.reason ? (
                                    <p className="mt-1 text-xs text-slate-500">
                                        {activityItem.appointment.reason}
                                    </p>
                                ) : null}
                            </div>

                            <p className="text-sm font-medium text-slate-600">
                                {formatTime(activityItem.timestamp, timezone)}
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
    const clinicTimezone = activeClinic.clinic?.timezone;
    const clinicName = activeClinic.clinic?.name ?? 'your clinic';
    const firstName = activeClinic.currentUser?.fullName?.trim().split(/\s+/)[0];
    const waitingCount = dashboardData?.summary.queueSummary.waiting ?? 0;
    const highRiskCount = dashboardData?.summary.noShowRiskSummary.high ?? 0;

    return (
        <section className="space-y-6">
            <PageHeader
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={refreshDashboard}
                            isLoading={dashboardState.status === 'loading'}
                            loadingText="Refreshing..."
                        >
                            Refresh
                        </Button>
                        <Link
                            to={`${appRoutePaths.appointments}#book-appointment`}
                            className="inline-flex min-h-10 items-center justify-center rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            Book appointment
                        </Link>
                    </>
                }
            />

            {dashboardData ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            {formatClinicDate(dashboardData.summary.date)}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold tracking-tight text-app-text sm:text-2xl">
                            {firstName ? `Good day, ${firstName}` : 'Clinic overview'}
                        </h2>
                        <p className="mt-1 text-sm text-app-muted">
                            {clinicName} ·{' '}
                            {waitingCount > 0
                                ? `${waitingCount} waiting in the queue`
                                : 'No patients waiting'}
                            {highRiskCount > 0
                                ? ` · ${highRiskCount} risk flag${highRiskCount === 1 ? '' : 's'} to review`
                                : ''}
                        </p>
                    </div>
                    <Link
                        to={appRoutePaths.queue}
                        className="text-sm font-semibold text-action underline-offset-4 hover:underline"
                    >
                        Open live queue →
                    </Link>
                </div>
            ) : null}

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
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card) => (
                            <SummaryCardItem key={card.label} card={card} />
                        ))}
                    </div>

                    <OperationalPulsePanel data={dashboardData} />

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

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <HighRiskAppointmentsCard
                            appointments={dashboardData.highRiskAppointments}
                            timezone={clinicTimezone}
                        />
                        <TodayActivitySection
                            activityItems={dashboardData.activityItems}
                            timezone={clinicTimezone}
                        />
                    </div>
                    <OperationalDistributionCard data={dashboardData} />
                </>
            ) : null}
        </section>
    );
}

export default DashboardOverviewPage;
