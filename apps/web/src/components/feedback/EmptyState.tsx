import type { ReactNode } from 'react';

type EmptyStateProps = {
    title: string;
    message: string;
    action?: ReactNode;
};

function EmptyState({ title, message, action }: EmptyStateProps) {
    return (
        <div className="rounded-lg border border-dashed border-app-border-strong bg-white p-8 text-center">
            <h2 className="text-lg font-semibold text-app-text">{title}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-app-muted">{message}</p>
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export default EmptyState;
