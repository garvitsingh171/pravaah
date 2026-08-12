import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SetupStatusSummary } from '../onboardingApi';
import {
    buildSetupChecklistItems,
    totalChecklistSteps,
} from './setupChecklistModel';

function CompletionStatus({ completed }: { completed: boolean }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                completed
                    ? 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)] ring-[var(--color-status-success-border)]'
                    : 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)] ring-[var(--color-status-warning-border)]'
            }`}
        >
            {completed ? 'Completed' : 'Incomplete'}
        </span>
    );
}

function FirstRunSetupChecklist({ setup }: { setup: SetupStatusSummary }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const checklistItems = useMemo(() => buildSetupChecklistItems(setup), [setup]);
    const completedSteps = checklistItems.filter((item) => item.completed).length;
    const progressPercent = Math.round((completedSteps / totalChecklistSteps) * 100);
    const isComplete = completedSteps === totalChecklistSteps;
    const nextIncompleteItem = checklistItems.find((item) => !item.completed);

    if (isComplete && isCollapsed) {
        return null;
    }

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-brand-foreground">
                        First-run setup
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                        Get the clinic ready for appointments
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Follow the minimum setup flow: clinic settings, doctor, patient, then
                        appointment.
                    </p>
                    {nextIncompleteItem ? (
                        <p className="mt-3 text-sm font-medium text-slate-700">
                            Next step: {nextIncompleteItem.title}
                        </p>
                    ) : null}
                </div>

                {isComplete ? (
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        onClick={() => setIsCollapsed(true)}
                    >
                        Dismiss
                    </button>
                ) : null}
            </div>

            <div className="mt-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                        {completedSteps} of {totalChecklistSteps} steps completed
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                        {progressPercent}% complete
                    </p>
                </div>

                <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="First-run clinic setup progress"
                    aria-valuemin={0}
                    aria-valuemax={totalChecklistSteps}
                    aria-valuenow={completedSteps}
                    aria-valuetext={`${completedSteps} of ${totalChecklistSteps} steps completed`}
                >
                    <div
                        className="h-full rounded-full bg-action transition-all"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {isComplete ? (
                <div className="mt-5 rounded-lg border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] p-4 text-sm text-[var(--color-status-success-text)]">
                    <p className="font-semibold">Initial setup is complete.</p>
                    <p className="mt-1 text-[var(--color-status-success-text)]">
                        The clinic has the minimum configuration needed to use Pravaah.
                    </p>
                </div>
            ) : null}

            <div className="mt-5 grid gap-3">
                {checklistItems.map((item, index) => (
                    <article
                        key={item.id}
                        className={`grid gap-4 rounded-lg border p-4 transition md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center ${
                            item.completed
                                ? 'border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)]'
                                : nextIncompleteItem?.id === item.id
                                  ? 'border-brand-soft bg-brand-subtle'
                                  : 'border-slate-200 bg-slate-50'
                        }`}
                    >
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                                item.completed
                                    ? 'border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]'
                                    : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                            aria-hidden="true"
                        >
                            {index + 1}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                <CompletionStatus completed={item.completed} />
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        </div>

                        {item.completed ? null : item.blockedReason ? (
                            <div className="max-w-xs text-sm font-medium text-slate-500">
                                {item.blockedReason}
                            </div>
                        ) : (
                            <Link
                                to={item.actionPath}
                                className="inline-flex items-center justify-center rounded-md bg-action px-4 py-2 text-sm font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            >
                                {item.actionLabel}
                            </Link>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}

export default FirstRunSetupChecklist;
