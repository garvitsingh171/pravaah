import type { ReactNode } from 'react';
import { Badge, RiskBadge, StatusBadge } from '../../../components/ui';
import { AppointmentStatus, QueueStatus, RiskLevel } from '../../../types';

const appointmentRows = [
    {
        time: '09:20',
        patient: 'Asha Mehra',
        doctor: 'Dr. Rao',
        source: 'Phone',
        status: AppointmentStatus.CONFIRMED,
        risk: RiskLevel.LOW,
    },
    {
        time: '10:10',
        patient: 'Kabir Shah',
        doctor: 'Dr. Iyer',
        source: 'Reception',
        status: AppointmentStatus.SCHEDULED,
        risk: RiskLevel.MEDIUM,
    },
    {
        time: '11:30',
        patient: 'Mina Dutta',
        doctor: 'Dr. Rao',
        source: 'Walk-in',
        status: AppointmentStatus.ARRIVED,
        risk: RiskLevel.HIGH,
    },
];

const queueRows = [
    {
        position: 1,
        patient: 'Mina Dutta',
        doctor: 'Dr. Rao',
        status: QueueStatus.CALLED,
        note: 'Room 2',
    },
    {
        position: 2,
        patient: 'Rohan Sen',
        doctor: 'Dr. Iyer',
        status: QueueStatus.WAITING,
        note: '18 min wait',
    },
    {
        position: 3,
        patient: 'Fatima Ali',
        doctor: 'Dr. Rao',
        status: QueueStatus.ARRIVED,
        note: 'Checked in',
    },
];

const workflowPoints = [
    'Clinic setup',
    'Records',
    'Booking',
    'Risk review',
    'Arrival',
    'Queue',
    'Close visit',
];

function ProductFrame({
    children,
    eyebrow,
    title,
}: {
    children: ReactNode;
    eyebrow: string;
    title: string;
}) {
    return (
        <article className="showcase-rise overflow-hidden rounded-lg border border-app-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-app-border bg-app-surface-muted px-4 py-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-brand-foreground">
                        {eyebrow}
                    </p>
                    <h3 className="truncate text-base font-bold text-app-text">{title}</h3>
                </div>
                <div className="flex shrink-0 gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-danger-border)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-status-warning-border)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-action-soft" />
                </div>
            </div>
            <div className="p-4">{children}</div>
        </article>
    );
}

function AppointmentPreview() {
    return (
        <ProductFrame eyebrow="Appointment view" title="Today at Pravaah Family Clinic">
            <div className="space-y-3">
                {appointmentRows.map((row) => (
                    <div
                        key={`${row.time}-${row.patient}`}
                        className="grid gap-3 border-b border-app-border pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                    >
                        <p className="text-sm font-bold text-app-text">{row.time}</p>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-app-text">
                                {row.patient}
                            </p>
                            <p className="text-xs text-app-subtle">
                                {row.doctor} - {row.source}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge kind="appointment" status={row.status} />
                            <RiskBadge riskLevel={row.risk} />
                        </div>
                    </div>
                ))}
            </div>
        </ProductFrame>
    );
}

function QueuePreview() {
    return (
        <ProductFrame eyebrow="Queue board" title="Arrival and call handling">
            <div className="space-y-3">
                {queueRows.map((row) => (
                    <div
                        key={row.position}
                        className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 rounded-md border border-app-border bg-app-background p-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle text-sm font-bold text-brand-foreground ring-1 ring-brand-soft">
                            {row.position}
                        </span>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-app-text">
                                {row.patient}
                            </p>
                            <p className="text-xs text-app-subtle">
                                {row.doctor} - {row.note}
                            </p>
                        </div>
                        <div className="col-span-2 flex items-center sm:col-span-1">
                            <StatusBadge kind="queue" status={row.status} />
                        </div>
                    </div>
                ))}
            </div>
        </ProductFrame>
    );
}

function RiskPreview() {
    return (
        <ProductFrame eyebrow="Risk assistance" title="Explainable follow-up context">
            <div className="rounded-md border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-bold text-app-text">Mina Dutta</p>
                        <p className="text-xs text-app-subtle">11:30 - Dr. Rao</p>
                    </div>
                    <RiskBadge riskLevel={RiskLevel.HIGH} />
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--color-status-warning-text)]">
                    <li>Previous no-show recorded in clinic history.</li>
                    <li>Booked close to appointment time.</li>
                    <li>Longer travel distance stored on patient record.</li>
                </ul>
            </div>
            <p className="mt-3 text-xs leading-5 text-app-subtle">
                Demo preview only. The product presents reasons for staff review; it does not
                guarantee attendance or take automatic action.
            </p>
        </ProductFrame>
    );
}

function WorkflowDiagram() {
    return (
        <div className="rounded-lg border border-app-border bg-slate-950 p-4 text-white">
            <div className="flex flex-wrap items-center gap-2">
                {workflowPoints.map((point, index) => (
                    <div key={point} className="flex items-center gap-2">
                        <Badge
                            tone={index === 3 ? 'brand' : 'neutral'}
                            className={
                                index === 3
                                    ? 'bg-brand-subtle text-brand-foreground ring-brand-soft'
                                    : 'bg-white/10 text-slate-100 ring-white/15'
                            }
                        >
                            {point}
                        </Badge>
                        {index < workflowPoints.length - 1 ? (
                            <svg
                                className="h-4 w-4 text-brand"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M5 12h14" />
                                <path d="m13 6 6 6-6 6" />
                            </svg>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProductShowcase() {
    return (
        <div className="space-y-5">
            <WorkflowDiagram />
            <div className="grid gap-5 lg:grid-cols-3">
                <AppointmentPreview />
                <QueuePreview />
                <RiskPreview />
            </div>
        </div>
    );
}

export default ProductShowcase;
