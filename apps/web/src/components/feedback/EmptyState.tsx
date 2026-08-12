import type { ReactNode } from 'react';

type EmptyStateProps = {
    title: string;
    message: string;
    action?: ReactNode;
    secondaryAction?: ReactNode;
    icon?: ReactNode;
};

function DefaultEmptyIcon() {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M5 7h14" />
            <path d="M5 12h14" />
            <path d="M5 17h8" />
        </svg>
    );
}

function EmptyState({ action, icon, message, secondaryAction, title }: EmptyStateProps) {
    return (
        <div className="rounded-lg border border-dashed border-app-border-strong bg-white p-6 text-center sm:p-8">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-brand-subtle text-brand-foreground ring-1 ring-brand-soft">
                {icon ?? <DefaultEmptyIcon />}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-app-text">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-app-muted">{message}</p>
            {action || secondaryAction ? (
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    {action}
                    {secondaryAction}
                </div>
            ) : null}
        </div>
    );
}

export default EmptyState;
