import { useEffect, useId, useRef } from 'react';
import Button from './Button';

type ConfirmationDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
    isConfirming?: boolean;
    confirmLoadingText?: string;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
};

const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function ConfirmationDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    confirmVariant = 'danger',
    isConfirming = false,
    confirmLoadingText,
    error,
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
    const isConfirmingRef = useRef(isConfirming);
    const onCancelRef = useRef(onCancel);

    useEffect(() => {
        isConfirmingRef.current = isConfirming;
        onCancelRef.current = onCancel;
    }, [isConfirming, onCancel]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        previouslyFocusedElementRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cancelButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isConfirmingRef.current) {
                event.preventDefault();
                onCancelRef.current();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const focusableElements = Array.from(
                dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
            ).filter((element) => !element.hasAttribute('disabled'));

            if (focusableElements.length === 0) {
                event.preventDefault();
                dialogRef.current?.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (!dialogRef.current?.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? lastElement : firstElement).focus();
            } else if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocusedElementRef.current?.focus();
        };
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                tabIndex={-1}
                className="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-app-border bg-white p-6 shadow-xl"
            >
                <div className="space-y-3">
                    <h2 id={titleId} className="text-lg font-semibold text-app-text">
                        {title}
                    </h2>
                    <p id={descriptionId} className="text-sm leading-6 text-app-muted">
                        {description}
                    </p>
                    {error ? (
                        <p className="rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] px-3 py-2 text-sm text-[var(--color-status-danger-text)]">
                            {error}
                        </p>
                    ) : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        ref={cancelButtonRef}
                        variant="outline"
                        onClick={onCancel}
                        disabled={isConfirming}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={onConfirm}
                        isLoading={isConfirming}
                        loadingText={confirmLoadingText}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationDialog;
