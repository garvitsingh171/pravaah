import { Button } from '../ui';

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
            className="rounded-lg border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] p-4 text-sm text-[var(--color-status-danger-text)]"
            role="alert"
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1">{message}</p>

                    {code ? (
                        <p className="mt-2 font-mono text-xs uppercase tracking-wide">
                            {code}
                        </p>
                    ) : null}
                </div>

                {onRetry ? (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                ) : null}
            </div>

            {details && details.length > 0 ? (
                <ul className="mt-3 list-disc space-y-1 pl-5">
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
