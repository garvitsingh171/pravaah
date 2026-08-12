import type { ReactNode } from 'react';
import { cx } from './classNames';

export type LifecycleRailStep = {
    id: string;
    label: string;
    description?: string;
    marker?: ReactNode;
};

type LifecycleRailProps = {
    steps: LifecycleRailStep[];
    currentStepId?: string;
    terminalLabel?: string;
    className?: string;
    ariaLabel?: string;
};

function LifecycleRail({
    ariaLabel = 'Workflow lifecycle',
    className,
    currentStepId,
    steps,
    terminalLabel,
}: LifecycleRailProps) {
    const currentIndex = currentStepId ? steps.findIndex((step) => step.id === currentStepId) : -1;

    return (
        <div
            className={cx(
                'rounded-lg border border-app-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
                className
            )}
        >
            <ol
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-none lg:auto-cols-fr lg:grid-flow-col"
                aria-label={ariaLabel}
            >
                {steps.map((step, index) => {
                    const isCurrent = index === currentIndex;
                    const isComplete = currentIndex > index;
                    const isUpcoming = currentIndex < index || currentIndex === -1;

                    return (
                        <li key={step.id} className="relative">
                            <div
                                className={cx(
                                    'flex h-full gap-3 rounded-md border p-3 transition',
                                    isCurrent
                                        ? 'border-brand-soft bg-brand-subtle text-app-text'
                                        : isComplete
                                          ? 'border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] text-app-text'
                                          : 'border-app-border bg-app-surface-muted text-app-muted',
                                    isUpcoming ? 'opacity-90' : ''
                                )}
                                aria-current={isCurrent ? 'step' : undefined}
                            >
                                <span
                                    className={cx(
                                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ring-1',
                                        isCurrent
                                            ? 'bg-white text-brand-foreground ring-brand-soft'
                                            : isComplete
                                              ? 'bg-white text-[var(--color-status-success-text)] ring-[var(--color-status-success-border)]'
                                              : 'bg-white text-app-subtle ring-app-border'
                                    )}
                                >
                                    {step.marker ?? index + 1}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-app-text">
                                        {step.label}
                                    </span>
                                    {step.description ? (
                                        <span className="mt-1 block text-xs leading-5 text-app-muted">
                                            {step.description}
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ol>
            {terminalLabel ? (
                <p className="mt-3 text-xs font-medium leading-5 text-app-subtle">
                    {terminalLabel}
                </p>
            ) : null}
        </div>
    );
}

export default LifecycleRail;
