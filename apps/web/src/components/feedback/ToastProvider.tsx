import type { PropsWithChildren } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
    ToastContext,
    type ToastContextValue,
    type ToastInput,
    type ToastType,
} from './toastContext';

type Toast = {
    id: number;
    type: ToastType;
    message: string;
};

const TOAST_VISIBLE_MS = 4500;

const getToastClassName = (type: ToastType): string => {
    if (type === 'success') {
        return 'border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-text)]';
    }

    return 'border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger-text)]';
};

function ToastProvider({ children }: PropsWithChildren) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: number) => {
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        ({ message, type = 'success' }: ToastInput) => {
            const id = Date.now() + Math.random();

            setToasts((currentToasts) => [...currentToasts, { id, type, message }]);
            window.setTimeout(() => dismissToast(id), TOAST_VISIBLE_MS);
        },
        [dismissToast]
    );

    const value = useMemo<ToastContextValue>(
        () => ({
            showToast,
            showSuccessToast: (message) => showToast({ type: 'success', message }),
            showErrorToast: (message) => showToast({ type: 'error', message }),
        }),
        [showToast]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div
                className="fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
                aria-live="polite"
                aria-atomic="true"
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${getToastClassName(
                            toast.type
                        )}`}
                        role={toast.type === 'error' ? 'alert' : 'status'}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">{toast.message}</p>
                            <button
                                type="button"
                                className="rounded-md px-1 font-semibold opacity-70 transition hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                                onClick={() => dismissToast(toast.id)}
                                aria-label="Dismiss message"
                            >
                                x
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export default ToastProvider;
