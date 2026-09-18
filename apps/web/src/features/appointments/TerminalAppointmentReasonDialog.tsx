import { useEffect, useId, useState } from 'react';
import { Button, fieldControlClassName } from '../../components/ui';
import type { AppointmentCancellationReason, AppointmentNoShowReason } from '../../types';
import { cancellationReasonOptions, noShowReasonOptions } from './terminalAppointmentReasons';

export type TerminalAppointmentReasonSubmission =
    | {
          mode: 'cancellation';
          cancellationReason: AppointmentCancellationReason;
          cancellationNote?: string;
      }
    | {
          mode: 'no-show';
          noShowReason: AppointmentNoShowReason;
          noShowNote?: string;
      };

type TerminalAppointmentReasonDialogProps = {
    mode: 'cancellation' | 'no-show';
    patientName: string;
    doctorName: string;
    scheduledAtLabel: string;
    isSubmitting: boolean;
    error?: string | null;
    onClose: () => void;
    onSubmit: (submission: TerminalAppointmentReasonSubmission) => void;
};

const toOptionalNote = (note: string): string | undefined => note.trim() || undefined;

export default function TerminalAppointmentReasonDialog({
    mode,
    patientName,
    doctorName,
    scheduledAtLabel,
    isSubmitting,
    error,
    onClose,
    onSubmit,
}: TerminalAppointmentReasonDialogProps) {
    const titleId = useId();
    const reasonId = useId();
    const noteId = useId();
    const noteCounterId = useId();
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const reasonOptions = mode === 'cancellation' ? cancellationReasonOptions : noShowReasonOptions;
    const isCancellation = mode === 'cancellation';

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting, onClose]);

    const handleSubmit = () => {
        if (!reason) {
            return;
        }

        if (isCancellation) {
            onSubmit({
                mode: 'cancellation',
                cancellationReason: reason as AppointmentCancellationReason,
                cancellationNote: toOptionalNote(note),
            });
            return;
        }

        onSubmit({
            mode: 'no-show',
            noShowReason: reason as AppointmentNoShowReason,
            noShowNote: toOptionalNote(note),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-app-border bg-white p-6 shadow-xl"
            >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-foreground">
                    Terminal appointment outcome
                </p>
                <h2 id={titleId} className="mt-1 text-lg font-semibold text-app-text">
                    {isCancellation ? 'Cancel appointment' : 'Mark appointment as no-show'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-app-muted">
                    {patientName} with {doctorName} · {scheduledAtLabel}
                </p>

                <label
                    htmlFor={reasonId}
                    className="mt-5 block text-sm font-medium text-app-muted"
                >
                    {isCancellation ? 'Cancellation reason' : 'No-show reason'}
                </label>
                <select
                    id={reasonId}
                    className={fieldControlClassName}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                >
                    <option value="">Select a reason</option>
                    {reasonOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <label
                    htmlFor={noteId}
                    className="mt-4 block text-sm font-medium text-app-muted"
                >
                    Optional staff note
                </label>
                <textarea
                    id={noteId}
                    aria-describedby={noteCounterId}
                    className={`${fieldControlClassName} min-h-24 resize-y`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    disabled={isSubmitting}
                    placeholder="Add context for clinic staff"
                />
                <span
                    id={noteCounterId}
                    className="mt-1 block text-xs font-normal text-app-subtle"
                >
                    {note.length}/500 characters
                </span>

                {error ? (
                    <p className="mt-4 rounded-md border border-[var(--color-status-danger-border)] bg-[var(--color-status-danger-bg)] px-3 py-2 text-sm text-[var(--color-status-danger-text)]">
                        {error}
                    </p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Close
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSubmit}
                        disabled={!reason}
                        isLoading={isSubmitting}
                        loadingText={isCancellation ? 'Cancelling...' : 'Marking no-show...'}
                    >
                        {isCancellation ? 'Cancel appointment' : 'Mark no-show'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
