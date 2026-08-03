type LoadingStateProps = {
    message?: string;
};

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
    return (
        <div
            className="flex items-center gap-3 rounded-lg border border-app-border bg-white px-4 py-3 text-sm text-app-muted"
            role="status"
            aria-live="polite"
        >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
            <span>{message}</span>
        </div>
    );
}

export default LoadingState;
