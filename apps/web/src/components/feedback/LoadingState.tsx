type LoadingStateProps = {
    message?: string;
    variant?: 'inline' | 'panel';
};

function LoadingState({ message = 'Loading...', variant = 'inline' }: LoadingStateProps) {
    if (variant === 'panel') {
        return (
            <div
                className="rounded-lg border border-app-border bg-white p-5 text-sm text-app-muted"
                role="status"
                aria-live="polite"
            >
                <div className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
                    <span className="font-medium">{message}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3" aria-hidden="true">
                    <span className="h-16 rounded-md bg-app-surface-muted" />
                    <span className="h-16 rounded-md bg-app-surface-muted" />
                    <span className="h-16 rounded-md bg-app-surface-muted" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-3 rounded-lg border border-app-border bg-white px-4 py-3 text-sm text-app-muted shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            role="status"
            aria-live="polite"
        >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
            <span>{message}</span>
        </div>
    );
}

export default LoadingState;
