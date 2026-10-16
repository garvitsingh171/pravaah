import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TerminalAppointmentReasonDialog from './TerminalAppointmentReasonDialog';

const commonProps = {
    patientName: 'Rohan Mehta',
    doctorName: 'Dr. Asha Rao',
    scheduledAtLabel: '18 Sep 2026, 10:00 am',
    isSubmitting: false,
    onClose: vi.fn(),
};

describe('TerminalAppointmentReasonDialog', () => {
    it('keeps keyboard focus in the dialog and returns it after closing', async () => {
        const user = userEvent.setup();
        const opener = document.createElement('button');
        opener.textContent = 'Open outcome';
        document.body.appendChild(opener);
        opener.focus();
        const onClose = vi.fn();

        const { unmount } = render(
            <TerminalAppointmentReasonDialog
                {...commonProps}
                mode="no-show"
                onClose={onClose}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByLabelText('No-show reason')).toHaveFocus();
        await user.tab({ shift: true });
        expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
        await user.keyboard('{Escape}');
        expect(onClose).toHaveBeenCalledOnce();

        unmount();
        expect(opener).toHaveFocus();
        opener.remove();
    });

    it('requires a structured cancellation reason and sends the optional note', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <TerminalAppointmentReasonDialog
                {...commonProps}
                mode="cancellation"
                onSubmit={onSubmit}
            />
        );

        const submitButton = screen.getByRole('button', { name: 'Cancel appointment' });
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/Rohan Mehta with Dr. Asha Rao/)).toBeInTheDocument();

        await user.selectOptions(screen.getByLabelText('Cancellation reason'), 'PATIENT_REQUEST');
        await user.type(screen.getByLabelText('Optional staff note'), 'Patient called reception.');
        await user.click(submitButton);

        expect(onSubmit).toHaveBeenCalledWith({
            mode: 'cancellation',
            cancellationReason: 'PATIENT_REQUEST',
            cancellationNote: 'Patient called reception.',
        });
    });

    it('offers explicit UNKNOWN for no-shows without requiring a note', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <TerminalAppointmentReasonDialog {...commonProps} mode="no-show" onSubmit={onSubmit} />
        );

        await user.selectOptions(screen.getByLabelText('No-show reason'), 'UNKNOWN');
        await user.click(screen.getByRole('button', { name: 'Mark no-show' }));

        expect(screen.getByRole('option', { name: 'Reason unknown' })).toBeInTheDocument();
        expect(onSubmit).toHaveBeenCalledWith({
            mode: 'no-show',
            noShowReason: 'UNKNOWN',
            noShowNote: undefined,
        });
    });
});
