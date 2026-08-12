import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SetupStatusSummary } from '../onboardingApi';
import {
    buildSetupChecklistItems,
    totalChecklistSteps,
    type SetupChecklistItem,
} from './setupChecklistModel';

export type FloatingSetupDockState =
    | {
          status: 'idle';
          setup: null;
          error: null;
      }
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

type FloatingSetupDockProps = {
    state: FloatingSetupDockState;
    onRetry: () => void;
};

const setupSignature = (setup: SetupStatusSummary | null): string => {
    if (!setup) {
        return 'missing';
    }

    return [
        setup.clinicSettingsComplete,
        setup.hasDoctor,
        setup.hasPatient,
        setup.hasAppointment,
    ].join(':');
};

const getSetupProgress = (items: SetupChecklistItem[]) => {
    const completedSteps = items.filter((item) => item.completed).length;
    const progressPercent = Math.round((completedSteps / totalChecklistSteps) * 100);

    return {
        completedSteps,
        progressPercent,
        isComplete: completedSteps === totalChecklistSteps,
        nextIncompleteItem: items.find((item) => !item.completed),
    };
};

function SetupProgressBar({
    completedSteps,
    progressPercent,
}: {
    completedSteps: number;
    progressPercent: number;
}) {
    return (
        <div
            className="h-2 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Floating clinic setup progress"
            aria-valuemin={0}
            aria-valuemax={totalChecklistSteps}
            aria-valuenow={completedSteps}
            aria-valuetext={`${completedSteps} of ${totalChecklistSteps} setup steps completed`}
        >
            <div
                className="h-full rounded-full bg-brand transition-[width] duration-[var(--motion-normal)] ease-[var(--motion-ease)]"
                style={{ width: `${progressPercent}%` }}
            />
        </div>
    );
}

function CollapsedDock({
    completedSteps,
    isComplete,
    nextIncompleteItem,
    onExpand,
    progressPercent,
    state,
}: {
    completedSteps: number;
    isComplete: boolean;
    nextIncompleteItem?: SetupChecklistItem;
    onExpand: () => void;
    progressPercent: number;
    state: FloatingSetupDockState;
}) {
    const label = isComplete
        ? 'Open completed setup assistant'
        : 'Expand setup assistant';
    const helper =
        state.status === 'error'
            ? 'Needs backend status'
            : state.status === 'loading'
              ? 'Checking progress'
              : isComplete
                ? 'Ready for clinic flow'
                : nextIncompleteItem?.title ?? 'Continue setup';

    return (
        <button
            type="button"
            className="group w-full rounded-lg bg-slate-950 px-4 py-3 text-left text-white shadow-[var(--shadow-command)] ring-1 ring-white/10 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={onExpand}
            aria-label={label}
        >
            <span className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-brand">
                        Clinic setup
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold">{helper}</span>
                </span>
                <span className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/15">
                    {completedSteps}/{totalChecklistSteps}
                </span>
            </span>
            <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/15">
                <span
                    className="block h-full rounded-full bg-brand transition-[width] duration-[var(--motion-normal)] ease-[var(--motion-ease)]"
                    style={{ width: `${progressPercent}%` }}
                />
            </span>
        </button>
    );
}

function SetupStepItem({
    item,
    index,
    isNext,
}: {
    item: SetupChecklistItem;
    index: number;
    isNext: boolean;
}) {
    return (
        <article
            className={`grid gap-3 rounded-md p-3 transition duration-[var(--motion-fast)] ease-[var(--motion-ease)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
                item.completed
                    ? 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]'
                    : isNext
                      ? 'bg-brand-subtle text-slate-950 ring-1 ring-brand-soft'
                      : 'bg-slate-50 text-slate-700'
            }`}
        >
            <span
                className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ring-1 ${
                    item.completed
                        ? 'bg-white text-[var(--color-status-success-text)] ring-[var(--color-status-success-border)]'
                        : 'bg-white text-slate-700 ring-slate-200'
                }`}
                aria-hidden="true"
            >
                {item.completed ? 'OK' : index + 1}
            </span>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
            </div>
            {item.completed ? (
                <span className="text-xs font-semibold">Done</span>
            ) : item.blockedReason ? (
                <p className="max-w-40 text-xs font-medium text-slate-500">{item.blockedReason}</p>
            ) : (
                <Link
                    to={item.actionPath}
                    className="inline-flex min-h-9 items-center justify-center rounded-md bg-action px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                >
                    {item.actionLabel}
                </Link>
            )}
        </article>
    );
}

function FloatingSetupDock({ state, onRetry }: FloatingSetupDockProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [acknowledgedSetupSignature, setAcknowledgedSetupSignature] = useState<string | null>(
        null
    );
    const items = useMemo(
        () => (state.setup ? buildSetupChecklistItems(state.setup) : []),
        [state.setup]
    );
    const stateSetupSignature = setupSignature(state.setup);
    const { completedSteps, isComplete, nextIncompleteItem, progressPercent } =
        getSetupProgress(items);
    const isAcknowledged = isComplete && acknowledgedSetupSignature === stateSetupSignature;

    if (state.status === 'idle' || isAcknowledged) {
        return null;
    }

    return (
        <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(24rem,calc(100vw-2rem))]">
            {isExpanded ? (
                <section
                    className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg bg-white text-slate-950 shadow-[var(--shadow-command)] ring-1 ring-slate-200 setup-dock-enter"
                    aria-label="Clinic setup assistant"
                >
                    <div className="rounded-t-lg bg-slate-950 px-4 py-4 text-white">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                                    Backend setup status
                                </p>
                                <h2 className="mt-1 text-base font-bold">
                                    Clinic setup assistant
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                aria-label="Collapse setup assistant"
                                onClick={() => setIsExpanded(false)}
                            >
                                -
                            </button>
                        </div>
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-200">
                                <span>
                                    {completedSteps} of {totalChecklistSteps} steps complete
                                </span>
                                <span>{progressPercent}%</span>
                            </div>
                            <SetupProgressBar
                                completedSteps={completedSteps}
                                progressPercent={progressPercent}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 p-4">
                        {state.status === 'loading' && !state.setup ? (
                            <div className="rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-600">
                                Checking setup progress from the backend...
                            </div>
                        ) : null}

                        {state.status === 'loading' && state.setup ? (
                            <div className="rounded-md bg-brand-subtle p-3 text-sm font-medium text-brand-foreground">
                                Refreshing setup progress...
                            </div>
                        ) : null}

                        {state.status === 'error' ? (
                            <div
                                className="rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] p-3 text-sm text-[var(--color-status-danger-text)]"
                                role="alert"
                            >
                                <p className="font-semibold">Setup status could not be loaded.</p>
                                <p className="mt-1">{state.error.message}</p>
                                {state.error.code ? (
                                    <p className="mt-1 text-xs font-semibold">{state.error.code}</p>
                                ) : null}
                                <button
                                    type="button"
                                    className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-status-danger-text)] ring-1 ring-[var(--color-status-danger-border)] transition hover:bg-[var(--color-status-danger-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                                    onClick={onRetry}
                                >
                                    Retry setup status
                                </button>
                            </div>
                        ) : null}

                        {isComplete ? (
                            <div className="rounded-md border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] p-3 text-sm text-[var(--color-status-success-text)]">
                                <p className="font-semibold">Minimum setup complete.</p>
                                <p className="mt-1">
                                    The clinic has settings, one doctor, one patient, and one
                                    appointment available for the operational workflow.
                                </p>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex min-h-9 items-center justify-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-status-success-text)] ring-1 ring-[var(--color-status-success-border)] transition hover:bg-[var(--color-status-success-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                                    onClick={() =>
                                        setAcknowledgedSetupSignature(stateSetupSignature)
                                    }
                                >
                                    Acknowledge
                                </button>
                            </div>
                        ) : null}

                        {items.length > 0 ? (
                            <div className="space-y-2">
                                {nextIncompleteItem ? (
                                    <p className="text-sm font-semibold text-slate-800">
                                        Next: {nextIncompleteItem.title}
                                    </p>
                                ) : null}
                                <div className="grid gap-2">
                                    {items.map((item, index) => (
                                        <SetupStepItem
                                            key={item.id}
                                            item={item}
                                            index={index}
                                            isNext={nextIncompleteItem?.id === item.id}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : (
                <CollapsedDock
                    completedSteps={completedSteps}
                    isComplete={isComplete}
                    nextIncompleteItem={nextIncompleteItem}
                    onExpand={() => setIsExpanded(true)}
                    progressPercent={progressPercent}
                    state={state}
                />
            )}
        </div>
    );
}

export default FloatingSetupDock;
