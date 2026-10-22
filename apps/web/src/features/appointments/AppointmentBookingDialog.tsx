import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import useModalFocus from '../../components/ui/useModalFocus';

export default function AppointmentBookingDialog({
    children,
    onClose,
    isBusy,
}: {
    children: ReactNode;
    onClose: () => void;
    isBusy: boolean;
}) {
    const dialogRef = useModalFocus(onClose, isBusy);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="appointment-booking-title"
                tabIndex={-1}
                className="flex max-h-[min(92dvh,58rem)] w-full max-w-4xl min-w-0 flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl outline-none sm:rounded-2xl"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2
                            id="appointment-booking-title"
                            className="text-lg font-bold text-slate-950 sm:text-xl"
                        >
                            Book appointment
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Choose a patient, doctor, and available clinic time.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close appointment booking"
                        onClick={onClose}
                        disabled={isBusy}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-xl text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                    {children}
                </div>
            </section>
        </div>,
        document.body
    );
}
