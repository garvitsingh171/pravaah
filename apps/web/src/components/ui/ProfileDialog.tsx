import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';
import useModalFocus from './useModalFocus';

type ProfileDialogProps = {
    title: string;
    description?: string;
    initials: string;
    isEditing: boolean;
    isBusy?: boolean;
    children: ReactNode;
    onEdit?: () => void;
    onClose: () => void;
};

/** Shared accessible shell for patient and doctor profile dialogs. */
export default function ProfileDialog({
    title,
    description,
    initials,
    isEditing,
    isBusy = false,
    children,
    onEdit,
    onClose,
}: ProfileDialogProps) {
    const dialogRef = useModalFocus(onClose, isBusy || isEditing);
    const titleId = `profile-dialog-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            const target = isEditing
                ? dialogRef.current?.querySelector<HTMLElement>(
                      'input:not([disabled]), textarea:not([disabled]), select:not([disabled])'
                  )
                : dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])');
            target?.focus();
        });
        return () => window.cancelAnimationFrame(frame);
    }, [dialogRef, isEditing]);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="flex max-h-[min(92dvh,56rem)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-subtle font-bold text-brand-foreground ring-1 ring-brand-soft"
                        >
                            {initials}
                        </span>
                        <div className="min-w-0">
                            <h2
                                id={titleId}
                                className="break-words text-lg font-bold text-slate-950 sm:text-xl"
                            >
                                {title}
                            </h2>
                            {description ? (
                                <p className="mt-1 break-words text-sm text-slate-600">
                                    {description}
                                </p>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {!isEditing && onEdit ? (
                            <button
                                type="button"
                                onClick={onEdit}
                                className="inline-flex min-h-10 items-center rounded-md bg-action px-3 py-2 text-sm font-semibold text-white hover:bg-action-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                            >
                                Edit
                            </button>
                        ) : null}
                        <button
                            type="button"
                            aria-label={`Close ${title} profile`}
                            onClick={onClose}
                            disabled={isBusy || isEditing}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50"
                        >
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                    {children}
                </div>
                {!isEditing ? (
                    <footer className="flex justify-end border-t border-slate-200 px-4 py-3 sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
                        >
                            Close
                        </button>
                    </footer>
                ) : null}
            </section>
        </div>,
        document.body
    );
}
