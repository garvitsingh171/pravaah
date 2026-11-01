type LoadingStateProps = {
    message?: string;
    variant?: 'inline' | 'panel' | 'table';
};

function LoadingState({ message = 'Loading...', variant = 'inline' }: LoadingStateProps) {
    if (variant === 'table') {
        return (
            <div
                className="rounded-app-lg border border-app-border bg-white p-4"
                role="status"
                aria-live="polite"
            >
                <p className="mb-4 text-sm font-medium text-app-muted">{message}</p>
                <div aria-hidden="true" className="space-y-3">
                    {[0, 1, 2, 3, 4].map((row) => (
                        <div
                            key={row}
                            className="flex items-center gap-4 rounded-md bg-app-surface-muted p-3"
                        >
                            <span className="h-9 w-9 shrink-0 rounded-md bg-app-border" />
                            <span className="h-3 w-1/3 rounded bg-app-border" />
                            <span className="ml-auto h-3 w-1/5 rounded bg-app-border" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
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
