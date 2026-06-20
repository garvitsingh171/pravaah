type ErrorDetail = {
    field?: string;
    message: string;
};

type ErrorMessageProps = {
    title?: string;
    message: string;
    code?: string;
    details?: ErrorDetail[] | string[];
    retryLabel?: string;
    onRetry?: () => void;
};

const getDetailText = (detail: ErrorDetail | string): string => {
    if (typeof detail === 'string') {
        return detail;
    }

    return detail.field ? `${detail.field}: ${detail.message}` : detail.message;
};

function ErrorMessage({
    title = 'Something went wrong',
    message,
    code,
    details,
    retryLabel = 'Try again',
    onRetry,
}: ErrorMessageProps) {
    return (
        <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            role="alert"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-red-800">{message}</p>

                    {code ? (
                        <p className="mt-2 font-mono text-xs uppercase tracking-wide text-red-700">
                            {code}
                        </p>
                    ) : null}
                </div>

                {onRetry ? (
                    <button
                        type="button"
                        className="rounded-md border border-red-300 bg-white px-3 py-2 font-medium text-red-700 transition hover:bg-red-100"
                        onClick={onRetry}
                    >
                        {retryLabel}
                    </button>
                ) : null}
            </div>

            {details && details.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-red-800">
                    {details.map((detail) => {
                        const detailText = getDetailText(detail);

                        return <li key={detailText}>{detailText}</li>;
                    })}
                </ul>
            ) : null}
        </div>
    );
}

export default ErrorMessage;
