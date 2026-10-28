import { useId } from 'react';
import Button from './Button';
import useModalFocus from './useModalFocus';

type ConfirmationDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmVariant?: 'primary' | 'danger';
    isConfirming?: boolean;
    confirmLoadingText?: string;
    confirmDisabled?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
};

function ConfirmationDialog({ open, ...props }: ConfirmationDialogProps) {
    return open ? <ConfirmationDialogContent {...props} /> : null;
}

function ConfirmationDialogContent({
    title,
    description,
    confirmLabel,
    cancelLabel,
    confirmVariant = 'danger',
    isConfirming = false,
    confirmLoadingText,
    confirmDisabled = false,
    error,
    onConfirm,
    onCancel,
}: Omit<ConfirmationDialogProps, 'open'>) {
    const titleId = useId();
    const descriptionId = useId();
    const dialogRef = useModalFocus(onCancel, isConfirming);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 py-6">
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
                        <p
                            role="alert"
                            className="rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] px-3 py-2 text-sm text-[var(--color-status-danger-text)]"
                        >
                            {error}
                        </p>
                    ) : null}
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onCancel} disabled={isConfirming}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={onConfirm}
                        disabled={confirmDisabled}
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
