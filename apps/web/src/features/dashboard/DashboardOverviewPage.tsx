import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveClinic } from '../../app/activeClinicContext';
import { EmptyState, ErrorMessage, LoadingState } from '../../components/feedback';
import { Badge, Button, Card, PageHeader, RiskBadge, type BadgeTone } from '../../components/ui';
import { isApiClientError } from '../../lib';
import { appRoutePaths } from '../../routes/dashboardRoutes';
import { UserRole } from '../../types';
import FirstRunSetupChecklist from '../onboarding/components/FirstRunSetupChecklist';
import { getOnboardingStatus, type SetupStatusSummary } from '../onboarding/onboardingApi';
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

type SetupChecklistState =
    | {
          status: 'loading';
          setup: SetupStatusSummary | null;
          error: null;
      }
    | {
          status: 'success';
          setup: SetupStatusSummary;
          error: null;
      }
    | {
          status: 'error';
          setup: SetupStatusSummary | null;
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

const emptySetupChecklistState: SetupChecklistState = {
    status: 'loading',
    setup: null,
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

const getSetupChecklistErrorState = (
    error: unknown,
    setup: SetupStatusSummary | null = null
): SetupChecklistState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            setup,
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        setup,
        error: {
            message: 'Setup checklist progress could not be loaded. Please try again.',
            code: 'SETUP_STATUS_LOAD_FAILED',
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
            accentClassName: 'border-l-brand',
        },
        {
            label: 'Waiting queue',
            value: summary.queueSummary.waiting,
            helper: `${summary.queueSummary.total} queue entries today`,
            accentClassName: 'border-l-[var(--color-status-warning-text)]',
        },
        {
            label: 'Completed visits',
            value: summary.appointmentSummary.completed,
            helper: `${summary.queueSummary.completed} queue visits completed`,
            accentClassName: 'border-l-[var(--color-status-success-text)]',
        },
        {
            label: 'Cancelled / no-show',
            value: cancelledNoShowCount,
            helper: `${summary.appointmentSummary.cancelled} cancelled, ${summary.appointmentSummary.noShow} no-show`,
            accentClassName: 'border-l-[var(--color-status-danger-text)]',
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
            className={`rounded-lg border border-slate-200 border-l-4 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${card.accentClassName}`}
        >
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
        </article>
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
    const attentionItems = [
        {
            label: 'Active appointment flow',
            value: activeAppointments,
            helper: `${finalAppointments} final appointment statuses today`,
        },
        {
            label: 'Queue pressure',
            value: activeQueue,
            helper: `${queueSummary.waiting} waiting, ${queueSummary.called} called`,
        },
        {
            label: 'Risk review',
            value: noShowRiskSummary.high,
            helper: `${noShowRiskSummary.medium} medium, ${noShowRiskSummary.low} low risk`,
        },
    ];

    return (
        <Card className="bg-slate-950 text-white">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                        Today at a glance
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                        What needs staff attention?
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                        This panel uses only today&apos;s backend summary. It keeps urgent workflow
                        cues visible without inventing analytics.
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

                <div className="grid gap-3 sm:grid-cols-3">
                    {attentionItems.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-lg border border-white/15 bg-white/10 p-4"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                                {item.label}
                            </p>
                            <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-300">{item.helper}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

function SetupChecklistSection({
    state,
    onRetry,
}: {
    state: SetupChecklistState;
    onRetry: () => void;
}) {
    if (state.status === 'loading') {
        return <LoadingState message="Loading setup checklist..." />;
    }

    if (state.status === 'error') {
        return (
            <ErrorMessage
                title="Setup checklist could not be loaded"
                message={state.error.message}
                code={state.error.code}
                onRetry={onRetry}
            />
        );
    }

    return <FirstRunSetupChecklist setup={state.setup} />;
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

function DashboardOverviewPage() {
    const activeClinic = useActiveClinic();
    const { clinicId } = activeClinic;
    const isAdmin = activeClinic.currentUser?.role === UserRole.ADMIN;
    const [dashboardState, setDashboardState] = useState<DashboardState>(emptyDashboardState);
    const [setupChecklistState, setSetupChecklistState] =
        useState<SetupChecklistState>(emptySetupChecklistState);

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

        if (isAdmin) {
            setSetupChecklistState((currentState) => ({
                status: 'loading',
                setup: currentState.setup,
                error: null,
            }));

            void getOnboardingStatus()
                .then((data) => {
                    if (!data.setup) {
                        setSetupChecklistState({
                            status: 'error',
                            setup: null,
                            error: {
                                message:
                                    'Setup checklist progress was not included by the backend.',
                                code: 'SETUP_STATUS_MISSING',
                            },
                        });
                        return;
                    }

                    setSetupChecklistState({
                        status: 'success',
                        setup: data.setup,
                        error: null,
                    });
                })
                .catch((error: unknown) => {
                    setSetupChecklistState((currentState) => {
                        const errorState = getSetupChecklistErrorState(error, currentState.setup);

                        return errorState ?? currentState;
                    });
                });
        }
    }, [isAdmin, loadDashboard]);

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

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const abortController = new AbortController();

        void getOnboardingStatus(abortController.signal)
            .then((data) => {
                if (!data.setup) {
                    setSetupChecklistState({
                        status: 'error',
                        setup: null,
                        error: {
                            message: 'Setup checklist progress was not included by the backend.',
                            code: 'SETUP_STATUS_MISSING',
                        },
                    });
                    return;
                }

                setSetupChecklistState({
                    status: 'success',
                    setup: data.setup,
                    error: null,
                });
            })
            .catch((error: unknown) => {
                const errorState = getSetupChecklistErrorState(error);

                if (errorState) {
                    setSetupChecklistState(errorState);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [isAdmin]);

    const dashboardData = dashboardState.data;
    const summaryCards = dashboardData ? buildSummaryCards(dashboardData.summary) : [];
    const hasDashboardData = dashboardData ? hasUsefulDashboardData(dashboardData) : false;

    return (
        <section className="space-y-6">
            <PageHeader
                eyebrow="Dashboard"
                title="Dashboard overview"
                description={
                    dashboardData
                        ? `Clinic day: ${formatDate(
                              dashboardData.summary.date
                          )}. Track appointments, queue pressure, completed visits, and no-show risk before the clinic day slips out of view.`
                        : "Track today's appointments, queue pressure, completed visits, and no-show risk before the clinic day slips out of view."
                }
                actions={
                    <Button
                        variant="outline"
                        onClick={refreshDashboard}
                        isLoading={dashboardState.status === 'loading'}
                        loadingText="Refreshing..."
                    >
                        Refresh dashboard
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

            {isAdmin ? (
                <SetupChecklistSection state={setupChecklistState} onRetry={refreshDashboard} />
            ) : null}

            {dashboardData ? (
                <>
                    <OperationalPulsePanel data={dashboardData} />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card) => (
                            <SummaryCardItem key={card.label} card={card} />
                        ))}
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
