import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/feedback';
import {
    Badge,
    Button,
    Card,
    PageHeader,
    RiskBadge,
    StatusBadge,
    type BadgeTone,
} from '../../components/ui';
import { isApiClientError } from '../../lib';
import { getClinicDateInputValue } from '../../lib/clinicDateTime';
import { appRoutePaths } from '../../routes/dashboardRoutes';
import { AppointmentStatus, QueueStatus } from '../../types';
import { listAppointments, type AppointmentListItem } from '../appointments/appointmentApi';
import { listTodayQueue, type QueueListItem } from '../queues/queueApi';
import {
    getDashboardSummary,
    listTodayActivity,
    getNoShowIntelligence,
    type DashboardActivityItem,
    type DashboardActivityType,
    type DashboardSummary,
    type NoShowIntelligence,
} from './dashboardApi';
import NoShowRiskIntelligence from './NoShowRiskIntelligence';

type DashboardData = {
    summary: DashboardSummary;
    activityItems: DashboardActivityItem[];
    appointments: AppointmentListItem[] | null;
    queueEntries: QueueListItem[] | null;
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
    value: number | string;
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

const addCalendarDays = (date: string, days: number): string => {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
};

const countArrivedWaiting = (queueEntries: QueueListItem[]): number =>
    queueEntries.filter(
        (entry) =>
            entry.appointment.status === AppointmentStatus.ARRIVED ||
            entry.appointment.status === AppointmentStatus.IN_QUEUE
    ).length;

const buildSummaryCards = (
    summary: DashboardSummary,
    queueEntries: QueueListItem[] | null
): SummaryCard[] => {
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
            label: 'Patients waiting',
            value: queueEntries ? countArrivedWaiting(queueEntries) : '—',
            helper: queueEntries
                ? `${summary.queueSummary.total} queue entries today`
                : 'Open queue for the latest status',
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
        data.activityItems.length > 0 ||
        (data.appointments?.length ?? 0) > 0
    );
};

function TodayAppointmentsCard({
    appointments,
    timezone,
}: {
    appointments: AppointmentListItem[] | null;
    timezone?: string | null;
}) {
    const nextAppointments = [...(appointments ?? [])]
        .filter(
            (appointment) =>
                appointment.status !== AppointmentStatus.CANCELLED &&
                appointment.status !== AppointmentStatus.NO_SHOW
        )
        .sort((first, second) => first.scheduledAt.localeCompare(second.scheduledAt))
        .slice(0, 5);
    return (
        <Card
            title="Today’s appointments"
            description="Five visits from today’s clinic schedule."
            actions={
                <Link
                    to={appRoutePaths.appointments}
                    className="text-sm font-semibold text-action hover:underline"
                >
                    View all appointments →
                </Link>
            }
        >
            {appointments === null ? (
                <p
                    role="status"
                    className="rounded-app bg-app-background px-4 py-5 text-sm text-app-muted"
                >
                    Schedule preview could not be loaded. Open appointments to retry.
                </p>
            ) : nextAppointments.length === 0 ? (
                <EmptyState
                    title="No appointments to show today."
                    message="Book an appointment to start today’s schedule."
                />
            ) : (
                <ul className="divide-y divide-app-border">
                    {nextAppointments.map((appointment) => (
                        <li
                            key={appointment.id}
                            className="grid gap-2 py-3 sm:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                        >
                            <span className="text-sm font-bold text-app-text">
                                {formatTime(appointment.scheduledAt, timezone)}
                            </span>
                            <span
                                className="min-w-0 truncate text-sm font-semibold text-app-text"
                                title={appointment.patient.fullName}
                            >
                                {appointment.patient.fullName}
                            </span>
                            <span
                                className="min-w-0 truncate text-sm text-app-muted"
                                title={appointment.doctor.fullName}
                            >
                                {appointment.doctor.fullName}
                            </span>
                            <span className="flex flex-wrap items-center gap-2">
                                <StatusBadge kind="appointment" status={appointment.status} />
                                {appointment.noShowPrediction?.riskLevel === 'HIGH' ? (
                                    <RiskBadge riskLevel="HIGH" />
                                ) : null}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

function LiveQueuePreview({ queueEntries }: { queueEntries: QueueListItem[] | null }) {
    const active = (queueEntries ?? [])
        .filter(
            (entry) =>
                (entry.status === QueueStatus.ARRIVED ||
                    entry.status === QueueStatus.WAITING ||
                    entry.status === QueueStatus.CALLED) &&
                (entry.appointment.status === AppointmentStatus.ARRIVED ||
                    entry.appointment.status === AppointmentStatus.IN_QUEUE ||
                    entry.appointment.status === AppointmentStatus.CALLED)
        )
        .sort(
            (first, second) =>
                first.doctor.fullName.localeCompare(second.doctor.fullName) ||
                first.position - second.position
        )
        .slice(0, 4);
    return (
        <Card
            title="Live queue preview"
            description="Patients with an active arrival or call status."
            actions={
                <Link
                    to={appRoutePaths.queue}
                    className="text-sm font-semibold text-action hover:underline"
                >
                    Open live queue →
                </Link>
            }
        >
            {queueEntries === null ? (
                <p
                    role="status"
                    className="rounded-app bg-app-background px-4 py-5 text-sm text-app-muted"
                >
                    Queue preview could not be loaded. Open the live queue to retry.
                </p>
            ) : active.length === 0 ? (
                <p className="rounded-app bg-app-background px-4 py-5 text-sm text-app-muted">
                    No arrived patients are in the queue right now.
                </p>
            ) : (
                <ul className="divide-y divide-app-border">
                    {active.map((entry) => (
                        <li key={entry.id} className="flex flex-wrap items-center gap-3 py-3">
                            <span className="flex h-8 min-w-8 items-center justify-center rounded-app bg-brand-subtle px-2 text-sm font-bold text-brand-foreground">
                                #{entry.position}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-app-text">
                                    {entry.patient.fullName}
                                </span>
                                <span className="block truncate text-xs text-app-muted">
                                    {entry.doctor.fullName}
                                </span>
                            </span>
                            <StatusBadge kind="queue" status={entry.status} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

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
    const { appointmentSummary, queueSummary } = data.summary;
    const activeAppointments =
        appointmentSummary.scheduled +
        appointmentSummary.confirmed +
        appointmentSummary.arrived +
        appointmentSummary.inQueue +
        appointmentSummary.called;
    const finalAppointments =
        appointmentSummary.completed + appointmentSummary.cancelled + appointmentSummary.noShow;
    const waitingNow = data.queueEntries ? countArrivedWaiting(data.queueEntries) : null;
    const actionableHighRisk = data.summary.noShowRiskSummary.high;
    const needsAttention = (waitingNow ?? 0) > 0 || actionableHighRisk > 0;
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
        <section className="rounded-lg border border-slate-800 bg-[var(--color-pravaah-navy)] p-5 text-white shadow-[var(--shadow-soft)] sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        Operational pulse
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                        {needsAttention
                            ? 'Staff attention now'
                            : waitingNow === null
                              ? 'Review clinic flow'
                              : 'Clinic flow is clear'}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                        {waitingNow === null
                            ? 'The live preview is unavailable. Open the queue to review current arrivals.'
                            : waitingNow > 0
                              ? `${waitingNow} arrived and waiting, with ${queueSummary.called} called. Open the queue to see who is next.`
                              : actionableHighRisk > 0
                                ? `${actionableHighRisk} appointment${actionableHighRisk === 1 ? '' : 's'} flagged for staff review.`
                                : activeAppointments > 0
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

function DashboardActionPanel({ waiting, highRisk }: { waiting: number | null; highRisk: number }) {
    const actions = [
        {
            label: 'Book appointment',
            description: 'Find a time and create a visit',
            to: `${appRoutePaths.appointments}#book-appointment`,
        },
        {
            label: 'Open live queue',
            description:
                waiting !== null && waiting > 0
                    ? `${waiting} patient${waiting === 1 ? '' : 's'} waiting`
                    : 'Review today’s patient flow',
            to: appRoutePaths.queue,
        },
        {
            label: 'Find patient',
            description: 'Search the clinic directory',
            to: appRoutePaths.patients,
        },
        {
            label: 'Add patient',
            description: 'Create a clinic record',
            to: appRoutePaths.newPatient,
        },
        {
            label: 'Add doctor',
            description: 'Set up a provider record',
            to: appRoutePaths.newDoctor,
        },
    ];

    return (
        <section
            className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
            aria-label="Next steps"
        >
            <Card title="Quick actions" description="Go directly to the next clinic task.">
                <div className="grid gap-2 sm:grid-cols-2">
                    {actions.map((action) => (
                        <Link
                            key={action.label}
                            to={action.to}
                            className="group flex min-h-16 items-center justify-between gap-3 rounded-app border border-app-border bg-app-background px-4 py-3 transition hover:border-brand hover:bg-brand-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            <span>
                                <span className="block text-sm font-semibold text-app-text">
                                    {action.label}
                                </span>
                                <span className="mt-0.5 block text-xs text-app-muted">
                                    {action.description}
                                </span>
                            </span>
                            <span
                                aria-hidden="true"
                                className="text-action transition group-hover:translate-x-0.5"
                            >
                                →
                            </span>
                        </Link>
                    ))}
                </div>
            </Card>
            <Card title="Needs attention" description="Current work from today’s clinic data.">
                <div className="space-y-3">
                    <Link
                        to={appRoutePaths.queue}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-app bg-[var(--color-status-warning-bg)] px-4 py-3 text-sm font-medium text-app-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
                    >
                        <span>
                            {waiting === null
                                ? 'Queue preview unavailable; open the live queue'
                                : waiting > 0
                                  ? `${waiting} patient${waiting === 1 ? '' : 's'} waiting in the queue`
                                  : 'No patients waiting in the queue'}
                        </span>
                        <span aria-hidden="true">→</span>
                    </Link>
                    <Link
                        to={appRoutePaths.appointments}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-app bg-[var(--color-status-danger-bg)] px-4 py-3 text-sm font-medium text-app-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
                    >
                        <span>
                            {highRisk > 0
                                ? `${highRisk} high-risk appointment${highRisk === 1 ? '' : 's'} for staff review`
                                : 'No high-risk appointments to review'}
                        </span>
                        <span aria-hidden="true">→</span>
                    </Link>
                    <p className="text-xs leading-5 text-app-muted">
                        Risk flags support staff follow-up. Staff make all scheduling decisions.
                    </p>
                </div>
            </Card>
        </section>
    );
}

function DashboardOverviewPage() {
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
    const [dashboardState, setDashboardState] = useState<DashboardState>(emptyDashboardState);
    const [riskPeriodDays, setRiskPeriodDays] = useState<1 | 7 | 30>(7);
    const [riskReload, setRiskReload] = useState(0);
    const [riskIntelligence, setRiskIntelligence] = useState<NoShowIntelligence | null>(null);
    const [riskIntelligenceError, setRiskIntelligenceError] = useState<string | null>(null);
    const [riskIntelligenceLoading, setRiskIntelligenceLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        const from = getClinicDateInputValue(activeClinic.clinic?.timezone);
        const to = addCalendarDays(from, riskPeriodDays - 1);
        void getNoShowIntelligence(clinicId, from, to, controller.signal)
            .then((result) => {
                if (controller.signal.aborted) return;
                setRiskIntelligence(result.noShowIntelligence);
                setRiskIntelligenceError(null);
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                setRiskIntelligenceError(
                    error instanceof Error
                        ? error.message
                        : 'Risk intelligence could not be loaded.'
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) setRiskIntelligenceLoading(false);
            });
        return () => controller.abort();
    }, [clinicId, activeClinic.clinic?.timezone, riskPeriodDays, riskReload]);

    const loadDashboard = useCallback(
        async (signal?: AbortSignal): Promise<DashboardData> => {
            const [summaryData, activityData, appointments, queueEntries] = await Promise.all([
                getDashboardSummary(clinicId, signal),
                listTodayActivity(clinicId, signal),
                listAppointments(
                    clinicId,
                    { date: getClinicDateInputValue(activeClinic.clinic?.timezone), limit: 100 },
                    signal
                )
                    .then((data) => data.appointments)
                    .catch((error: unknown) => {
                        if (signal?.aborted) throw error;
                        return null;
                    }),
                listTodayQueue(
                    clinicId,
                    getClinicDateInputValue(activeClinic.clinic?.timezone),
                    signal
                )
                    .then((data) => data.queueEntries)
                    .catch((error: unknown) => {
                        if (signal?.aborted) throw error;
                        return null;
                    }),
            ]);

            return {
                summary: summaryData.dashboardSummary,
                activityItems: activityData.activityItems,
                appointments,
                queueEntries,
            };
        },
        [clinicId, activeClinic.clinic?.timezone]
    );

    const refreshDashboard = useCallback(() => {
        setRiskReload((value) => value + 1);
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
    const summaryCards = dashboardData
        ? buildSummaryCards(dashboardData.summary, dashboardData.queueEntries)
        : [];
    const hasDashboardData = dashboardData ? hasUsefulDashboardData(dashboardData) : false;
    const clinicTimezone = activeClinic.clinic?.timezone;
    const currentRiskFrom = getClinicDateInputValue(clinicTimezone);
    const currentRiskTo = addCalendarDays(currentRiskFrom, riskPeriodDays - 1);
    const clinicName = activeClinic.clinic?.name ?? 'your clinic';
    const firstName = activeClinic.currentUser?.fullName?.trim().split(/\s+/)[0];
    const waitingCount = dashboardData?.queueEntries
        ? countArrivedWaiting(dashboardData.queueEntries)
        : null;
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
                            {waitingCount === null
                                ? 'Queue preview unavailable'
                                : waitingCount > 0
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

                    <DashboardActionPanel waiting={waitingCount} highRisk={highRiskCount} />

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                        <TodayAppointmentsCard
                            appointments={dashboardData.appointments}
                            timezone={clinicTimezone}
                        />
                        <LiveQueuePreview queueEntries={dashboardData.queueEntries} />
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

                    <NoShowRiskIntelligence
                        data={
                            riskIntelligence?.clinicId === clinicId &&
                            riskIntelligence.from === currentRiskFrom &&
                            riskIntelligence.to === currentRiskTo
                                ? riskIntelligence
                                : null
                        }
                        loading={riskIntelligenceLoading}
                        error={
                            riskIntelligence?.clinicId === clinicId ? riskIntelligenceError : null
                        }
                        periodDays={riskPeriodDays}
                        onPeriodChange={(days) => {
                            setRiskIntelligenceLoading(true);
                            setRiskIntelligenceError(null);
                            setRiskPeriodDays(days);
                        }}
                        onRetry={() => {
                            setRiskIntelligenceLoading(true);
                            setRiskIntelligenceError(null);
                            setRiskReload((value) => value + 1);
                        }}
                        timezone={clinicTimezone}
                    />
                    <TodayActivitySection
                        activityItems={dashboardData.activityItems}
                        timezone={clinicTimezone}
                    />
                    <OperationalDistributionCard data={dashboardData} />
                </>
            ) : null}
        </section>
    );
}

export default DashboardOverviewPage;
