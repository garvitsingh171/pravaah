import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, NoShowRiskDetailsDialog, RiskBadge } from '../../components/ui';
import { formatClinicDateTime, getClinicDateInputValue } from '../../lib/clinicDateTime';
import { appRoutePaths } from '../../routes/dashboardRoutes';
import type { NoShowIntelligence } from './dashboardApi';

type Props = {
    data: NoShowIntelligence | null;
    loading: boolean;
    error: string | null;
    periodDays: 1 | 7 | 30;
    onPeriodChange: (days: 1 | 7 | 30) => void;
    onRetry: () => void;
    timezone?: string | null;
};

const categories = [
    { key: 'high', label: 'High risk', tone: 'bg-[var(--color-status-danger-text)]' },
    { key: 'medium', label: 'Medium risk', tone: 'bg-[var(--color-status-warning-text)]' },
    { key: 'low', label: 'Low risk', tone: 'bg-[var(--color-status-success-text)]' },
    { key: 'unavailable', label: 'Risk unavailable', tone: 'bg-slate-400' },
] as const;

const formatDate = (value: string): string => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat('en-IN', {
              dateStyle: 'medium',
              timeZone: 'UTC',
          }).format(date);
};

export default function NoShowRiskIntelligence({
    data,
    loading,
    error,
    periodDays,
    onPeriodChange,
    onRetry,
    timezone,
}: Props) {
    const [selected, setSelected] = useState<
        NoShowIntelligence['highRiskAppointments'][number] | null
    >(null);
    const total = data?.totalUpcoming ?? 0;
    const counts = data?.riskCounts ?? { high: 0, medium: 0, low: 0, unavailable: 0 };
    const metrics = [
        { label: 'Upcoming appointments', value: total, tone: 'border-l-slate-400' },
        {
            label: 'High risk',
            value: counts.high,
            tone: 'border-l-[var(--color-status-danger-text)]',
        },
        {
            label: 'Medium risk',
            value: counts.medium,
            tone: 'border-l-[var(--color-status-warning-text)]',
        },
        {
            label: 'Low risk',
            value: counts.low,
            tone: 'border-l-[var(--color-status-success-text)]',
        },
        { label: 'Risk unavailable', value: counts.unavailable, tone: 'border-l-slate-400' },
    ];

    return (
        <section className="space-y-4" aria-labelledby="no-show-intelligence-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                        Clinic outlook
                    </p>
                    <h2
                        id="no-show-intelligence-heading"
                        className="mt-1 text-xl font-bold text-slate-950"
                    >
                        No-show risk intelligence
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        Upcoming appointments from now through{' '}
                        {data?.to ? formatDate(data.to) : 'the selected period'}
                        {timezone ? ` · ${timezone}` : ''}. Scores are rule-based operational
                        indicators, not probabilities.
                    </p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    Reporting period
                    <select
                        className="min-h-10 rounded-md border border-slate-300 bg-white px-3 py-2"
                        value={periodDays}
                        onChange={(event) =>
                            onPeriodChange(Number(event.target.value) as 1 | 7 | 30)
                        }
                    >
                        <option value={1}>Today</option>
                        <option value={7}>Next 7 days</option>
                        <option value={30}>Next 30 days</option>
                    </select>
                </label>
            </div>

            {error ? (
                <div
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                    role="alert"
                >
                    <span>{error}</span>
                    <Button size="sm" variant="outline" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {metrics.map((metric) => (
                    <article
                        key={metric.label}
                        className={`rounded-lg border border-slate-200 border-l-4 ${metric.tone} bg-white p-4 shadow-sm`}
                    >
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {metric.label}
                        </h3>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                            {loading && !data ? '—' : metric.value}
                        </p>
                    </article>
                ))}
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
                <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h3 className="font-semibold text-slate-900">Risk distribution</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Latest stored assessment for each active appointment.
                    </p>
                    <div
                        className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100"
                        role="img"
                        aria-label={categories
                            .map((item) => `${item.label}: ${counts[item.key]}`)
                            .join(', ')}
                    >
                        {categories.map((item) => (
                            <span
                                key={item.key}
                                className={`${item.tone} transition-[width] duration-200 motion-reduce:transition-none`}
                                style={{
                                    width: total ? `${(counts[item.key] / total) * 100}%` : '0%',
                                }}
                            />
                        ))}
                    </div>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                        {categories.map((item) => {
                            const value = counts[item.key];
                            const percent = total ? Math.round((value / total) * 100) : 0;
                            return (
                                <li
                                    key={item.key}
                                    className="flex min-w-0 items-center gap-2 text-sm text-slate-700"
                                >
                                    <span
                                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.tone}`}
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0 flex-1">{item.label}</span>
                                    <span className="font-semibold tabular-nums">
                                        {value}{' '}
                                        <span className="font-normal text-slate-500">
                                            ({percent}%)
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                    {!loading && total === 0 ? (
                        <p className="mt-4 text-sm text-slate-600">
                            No upcoming appointments in this reporting period.
                        </p>
                    ) : null}
                </article>

                <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h3 className="font-semibold text-slate-900">Common risk factors</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Factors identified across upcoming appointment assessments.
                    </p>
                    {data?.contributingFactors.length ? (
                        <ul className="mt-3 divide-y divide-slate-100">
                            {data.contributingFactors.slice(0, 6).map((factor) => (
                                <li
                                    key={factor.code}
                                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="break-words text-sm font-semibold text-slate-800">
                                            {factor.label}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {factor.direction === 'increases'
                                                ? 'Risk-increasing contribution'
                                                : factor.direction === 'decreases'
                                                  ? 'Risk-decreasing contribution'
                                                  : factor.direction === 'mixed'
                                                    ? 'Mixed contribution'
                                                    : 'Neutral contribution'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                                        {factor.appointmentCount} appointments
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-sm text-slate-600">
                            No contributing factor details are available for this period.
                        </p>
                    )}
                </article>
            </div>

            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            High-risk appointments requiring review
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Ordered by appointment time. Risk flags are advisory and do not trigger
                            actions.
                        </p>
                        {data && data.riskCounts.high > data.highRiskAppointments.length ? (
                            <p className="mt-1 text-sm text-slate-600">
                                Showing the first {data.highRiskAppointments.length} of{' '}
                                {data.riskCounts.high} high-risk appointments.
                            </p>
                        ) : null}
                    </div>
                </div>
                {data?.highRiskAppointments.length ? (
                    <ul className="mt-3 divide-y divide-slate-100">
                        {data.highRiskAppointments.map((item) => (
                            <li
                                key={item.appointment.id}
                                className="grid min-w-0 gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="break-words font-semibold text-slate-900">
                                        {item.patient.fullName}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-slate-600">
                                        {item.doctor.fullName} ·{' '}
                                        {formatClinicDateTime(
                                            item.appointment.scheduledAt,
                                            timezone
                                        )}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <RiskBadge riskLevel="HIGH" />
                                        <span className="text-xs text-slate-600">
                                            {item.noShowPrediction.score}/100
                                        </span>
                                        {Array.isArray(item.noShowPrediction.reasons)
                                            ? item.noShowPrediction.reasons
                                                  .slice(0, 2)
                                                  .map((reason, index) => {
                                                      const label =
                                                          reason &&
                                                          typeof reason === 'object' &&
                                                          'message' in reason &&
                                                          typeof reason.message === 'string'
                                                              ? reason.message
                                                              : null;
                                                      return label ? (
                                                          <span
                                                              key={`${item.appointment.id}-${index}`}
                                                              className="max-w-full break-words rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                                          >
                                                              {label}
                                                          </span>
                                                      ) : null;
                                                  })
                                            : null}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelected(item)}
                                    >
                                        View risk details
                                    </Button>
                                    <Link
                                        to={appRoutePaths.appointments}
                                        state={{
                                            appointmentId: item.appointment.id,
                                            appointmentDate: getClinicDateInputValue(
                                                timezone,
                                                new Date(item.appointment.scheduledAt)
                                            ),
                                        }}
                                        className="inline-flex min-h-10 items-center rounded-md bg-action px-3 py-2 text-xs font-semibold text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                                    >
                                        Open appointment
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                        {loading
                            ? 'Loading upcoming appointments…'
                            : 'No high-risk appointments require review in this period.'}
                    </p>
                )}
            </article>

            {selected ? (
                <NoShowRiskDetailsDialog
                    subject={{
                        id: selected.appointment.id,
                        patientName: selected.patient.fullName,
                        patientContact: [selected.patient.phone, selected.patient.email]
                            .filter(Boolean)
                            .join(' / '),
                        doctorName: selected.doctor.fullName,
                        doctorSpecialty: selected.doctor.specialization,
                        scheduledAt: selected.appointment.scheduledAt,
                        durationMinutes: selected.appointment.durationMinutes,
                        status: selected.appointment.status,
                        reason: selected.appointment.reason,
                        prediction: selected.noShowPrediction,
                    }}
                    timezone={timezone}
                    onClose={() => setSelected(null)}
                />
            ) : null}
        </section>
    );
}
