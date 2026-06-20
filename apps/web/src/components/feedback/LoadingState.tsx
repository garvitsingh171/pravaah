type LoadingStateProps = {
    message?: string;
};

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
    return (
        <div
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
            role="status"
            aria-live="polite"
        >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <span>{message}</span>
        </div>
    );
}

export default LoadingState;
