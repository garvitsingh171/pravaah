import { createPortal } from 'react-dom';
import { formatClinicDateTime } from '../../lib/clinicDateTime';
import RiskExplanation, { type RiskPredictionLike } from './RiskExplanation';
import LifecycleRail from './LifecycleRail';
import type { LifecycleRailStep } from './LifecycleRail';
import useModalFocus from './useModalFocus';

export type NoShowRiskSubject = {
    id: string;
    patientName: string;
    patientContact?: string | null;
    doctorName: string;
    doctorSpecialty?: string | null;
    scheduledAt: string;
    durationMinutes?: number;
    status: string;
    reason?: string | null;
    notes?: string | null;
    outcomeReasonLabel?: string | null;
    outcomeNote?: string | null;
    prediction?: RiskPredictionLike | null;
    lifecycleSteps?: LifecycleRailStep[];
    currentLifecycleStepId?: string;
    lifecycleNote?: string;
};

type NoShowRiskDetailsDialogProps = {
    subject: NoShowRiskSubject;
    timezone?: string | null;
    onClose: () => void;
};

function NoShowRiskDetailsDialog({ subject, timezone, onClose }: NoShowRiskDetailsDialogProps) {
    const dialogRef = useModalFocus(onClose);
    const titleId = `no-show-risk-title-${subject.id}`;
    const labelStatus = (status: string) => status.replaceAll('_', ' ').toLowerCase();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="flex max-h-[min(92dvh,56rem)] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
            >
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                            Clinic operations · advisory assessment
                        </p>
                        <h2
                            id={titleId}
                            className="mt-1 text-lg font-bold text-slate-950 sm:text-xl"
                        >
                            No-show risk assessment
                        </h2>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-800">
                            {subject.patientName}
                        </p>
                        <p className="mt-0.5 break-words text-sm text-slate-600">
                            With {subject.doctorName}
                            {subject.doctorSpecialty?.trim()
                                ? ` · ${subject.doctorSpecialty.trim()}`
                                : ''}
                        </p>
                        <p className="mt-2 break-words text-sm text-slate-600">
                            <time dateTime={subject.scheduledAt}>
                                {formatClinicDateTime(subject.scheduledAt, timezone)}
                            </time>
                            {typeof subject.durationMinutes === 'number'
                                ? ` · ${subject.durationMinutes} min`
                                : ''}
                            {timezone ? ` · ${timezone}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close no-show risk assessment"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Current status
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                            {labelStatus(subject.status)}
                        </span>
                    </div>

                    {subject.lifecycleSteps ? (
                        <section className="mb-5" aria-label="Appointment lifecycle">
                            <h3 className="mb-2 text-sm font-semibold text-slate-800">
                                Appointment lifecycle
                            </h3>
                            <LifecycleRail
                                steps={subject.lifecycleSteps}
                                currentStepId={subject.currentLifecycleStepId}
                                terminalLabel={subject.lifecycleNote}
                                ariaLabel={`Appointment lifecycle for ${subject.patientName}`}
                                layout="compact"
                            />
                        </section>
                    ) : null}

                    <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <div className="min-w-0">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Patient and appointment
                            </h3>
                            <dl className="mt-2 space-y-1 text-sm text-slate-700">
                                <div>
                                    <dt className="inline font-semibold">Contact: </dt>
                                    <dd className="inline break-words">
                                        {subject.patientContact?.trim() || 'Not added'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="inline font-semibold">Specialty: </dt>
                                    <dd className="inline break-words">
                                        {subject.doctorSpecialty?.trim() || 'Not added'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="inline font-semibold">Reason: </dt>
                                    <dd className="inline break-words">
                                        {subject.reason?.trim() || 'Not added'}
                                    </dd>
                                </div>
                                {subject.outcomeReasonLabel ? (
                                    <div>
                                        <dt className="inline font-semibold">Outcome: </dt>
                                        <dd className="inline break-words">
                                            {subject.outcomeReasonLabel}
                                            {subject.outcomeNote ? ` · ${subject.outcomeNote}` : ''}
                                        </dd>
                                    </div>
                                ) : null}
                            </dl>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Staff notes
                            </h3>
                            <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                                {subject.notes?.trim() || 'No staff notes added.'}
                            </p>
                        </div>
                    </div>

                    {subject.prediction ? (
                        <RiskExplanation
                            prediction={subject.prediction}
                            subjectName={subject.patientName}
                            timezone={timezone}
                            disclosure={false}
                        />
                    ) : (
                        <section
                            className="rounded-lg border border-slate-200 bg-slate-50 p-5"
                            aria-label="Risk assessment unavailable"
                        >
                            <h3 className="font-semibold text-slate-900">
                                Risk assessment unavailable
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                No stored assessment is available for this appointment. Continue
                                with the usual clinic workflow; no score or classification has been
                                inferred.
                            </p>
                        </section>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default NoShowRiskDetailsDialog;
