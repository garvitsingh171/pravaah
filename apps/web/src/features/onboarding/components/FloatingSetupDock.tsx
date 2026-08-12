import { useEffect, useMemo, useState } from 'react';
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
    clinicId: string;
    state: FloatingSetupDockState;
    onRetry: () => void;
};

const completionVisibleMs = 3200;

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

const getSessionDismissalKey = (clinicId: string): string => {
    return `pravaah:setup-assistant-dismissed:${clinicId}`;
};

const readSessionDismissal = (clinicId: string): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.sessionStorage.getItem(getSessionDismissalKey(clinicId)) === 'true';
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

const isSetupComplete = (setup: SetupStatusSummary | null): boolean => {
    if (!setup) {
        return false;
    }

    return buildSetupChecklistItems(setup).every((item) => item.completed);
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

function CompletionDock() {
    return (
        <section
            className="setup-dock-enter fixed inset-x-3 bottom-3 z-40 rounded-lg bg-slate-950 px-4 py-4 text-white shadow-[var(--shadow-command)] ring-1 ring-white/10 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(22rem,calc(100vw-2rem))]"
            role="status"
            aria-label="Clinic setup complete"
        >
            <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-sm font-bold text-slate-950">
                    OK
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold">Clinic ready</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-200">
                        You're ready for today's flow.
                    </p>
                    <div className="mt-3">
                        <SetupProgressBar
                            completedSteps={totalChecklistSteps}
                            progressPercent={100}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function FloatingSetupDock({ clinicId, state, onRetry }: FloatingSetupDockProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSessionDismissed, setIsSessionDismissed] = useState(() =>
        readSessionDismissal(clinicId)
    );
    const [dismissedCompletionSignature, setDismissedCompletionSignature] = useState<string | null>(
        null
    );
    const [hasSeenVisibleIncompleteSetup, setHasSeenVisibleIncompleteSetup] = useState(
        () => Boolean(state.setup) && !isSetupComplete(state.setup) && !readSessionDismissal(clinicId)
    );
    const items = useMemo(
        () => (state.setup ? buildSetupChecklistItems(state.setup) : []),
        [state.setup]
    );
    const stateSetupSignature = setupSignature(state.setup);
    const { completedSteps, isComplete, nextIncompleteItem, progressPercent } =
        getSetupProgress(items);
    const shouldShowCompletion =
        Boolean(state.setup) &&
        isComplete &&
        hasSeenVisibleIncompleteSetup &&
        dismissedCompletionSignature !== stateSetupSignature;

    useEffect(() => {
        if (!shouldShowCompletion) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setDismissedCompletionSignature(stateSetupSignature);
            setHasSeenVisibleIncompleteSetup(false);
        }, completionVisibleMs);

        return () => window.clearTimeout(timer);
    }, [shouldShowCompletion, stateSetupSignature]);

    const handleDismiss = () => {
        window.sessionStorage.setItem(getSessionDismissalKey(clinicId), 'true');
        setIsExpanded(false);
        setIsSessionDismissed(true);
        setHasSeenVisibleIncompleteSetup(false);
    };

    if (state.status === 'idle') {
        return null;
    }

    if (shouldShowCompletion) {
        return <CompletionDock />;
    }

    if (isComplete || isSessionDismissed) {
        return null;
    }

    const helper =
        state.status === 'error'
            ? 'Setup status needs attention'
            : state.status === 'loading'
              ? 'Checking progress'
              : nextIncompleteItem?.title ?? 'Continue setup';

    return (
        <section
            className="setup-dock-enter fixed inset-x-3 bottom-3 z-40 rounded-lg bg-slate-950 text-white shadow-[var(--shadow-command)] ring-1 ring-white/10 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(24rem,calc(100vw-2rem))]"
            role="region"
            aria-label="Clinic setup assistant"
        >
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                            Clinic setup
                        </p>
                        <h2 className="mt-1 text-base font-bold">{helper}</h2>
                    </div>
                    <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/10 text-lg font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        aria-label="Dismiss clinic setup"
                        onClick={handleDismiss}
                    >
                        x
                    </button>
                </div>

                <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-200">
                        <span>
                            {completedSteps} of {totalChecklistSteps} complete
                        </span>
                        <span>{progressPercent}%</span>
                    </div>
                    <SetupProgressBar
                        completedSteps={completedSteps}
                        progressPercent={progressPercent}
                    />
                </div>

                {state.status === 'error' ? (
                    <div
                        className="mt-4 rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] p-3 text-sm text-[var(--color-status-danger-text)]"
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
                            Retry
                        </button>
                    </div>
                ) : null}

                {nextIncompleteItem ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 text-sm font-medium text-slate-200">
                            Next: {nextIncompleteItem.title}
                        </p>
                        {!nextIncompleteItem.blockedReason ? (
                            <Link
                                to={nextIncompleteItem.actionPath}
                                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                            >
                                Continue
                            </Link>
                        ) : null}
                    </div>
                ) : null}

                {items.length > 0 ? (
                    <button
                        type="button"
                        className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        aria-expanded={isExpanded}
                        onClick={() => setIsExpanded((current) => !current)}
                    >
                        {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                ) : null}
            </div>

            {isExpanded && items.length > 0 ? (
                <div className="max-h-[calc(100vh-18rem)] overflow-y-auto border-t border-white/10 bg-white p-4 text-slate-950">
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
        </section>
    );
}

export default FloatingSetupDock;
