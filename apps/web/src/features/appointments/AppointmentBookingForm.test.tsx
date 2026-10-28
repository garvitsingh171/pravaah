import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import AppointmentBookingForm, {
    type AppointmentBookingFormValues,
} from './AppointmentBookingForm';

const emptyValues: AppointmentBookingFormValues = {
    doctorId: '',
    patientId: '',
    appointmentDate: '',
    scheduledAt: '',
    durationMinutes: '',
    reason: '',
    notes: '',
};

describe('AppointmentBookingForm accessibility', () => {
    it('has no axe structural violations in the booking form', async () => {
        const { container } = render(
            <main>
                <AppointmentBookingForm
                    values={emptyValues}
                    fieldErrors={{}}
                    doctors={[]}
                    patients={[]}
                    availableSlots={[]}
                    isLoadingSlots={false}
                    isLoadingPatients={false}
                    isSubmitting={false}
                    isDisabled={false}
                    onChange={vi.fn()}
                    onSubmit={vi.fn()}
                    onAddPatient={vi.fn()}
                    patientSearch=""
                    onPatientSearchChange={vi.fn()}
                />
            </main>
        );
        const result = await axe.run(container, {
            rules: { 'color-contrast': { enabled: false } },
        });
        expect(result.violations.map((violation) => violation.id)).toEqual([]);
    });

    it('keeps native patient selection keyboard accessible and announces search state', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <AppointmentBookingForm
                values={emptyValues}
                fieldErrors={{}}
                doctors={[]}
                patients={[]}
                availableSlots={[]}
                isLoadingSlots={false}
                isLoadingPatients={true}
                isSubmitting={false}
                isDisabled={false}
                onChange={onChange}
                onSubmit={vi.fn()}
                onAddPatient={vi.fn()}
                patientSearch="Kabir"
                onPatientSearchChange={vi.fn()}
            />
        );
        expect(screen.getByRole('status')).toHaveTextContent('Searching patients');
        const search = screen.getByRole('searchbox', { name: 'Find patient' });
        expect(search).toHaveAccessibleDescription(/search by name or phone/i);
        await user.click(search);
        await user.tab();
        expect(screen.getByRole('combobox', { name: /patient/i })).toHaveFocus();
    });

    it('focuses and describes the first invalid field after submission', async () => {
        const user = userEvent.setup();
        const props = {
            values: emptyValues,
            doctors: [],
            patients: [],
            availableSlots: [],
            isLoadingSlots: false,
            isLoadingPatients: false,
            isSubmitting: false,
            isDisabled: false,
            onChange: vi.fn(),
            onSubmit: vi.fn(),
            onAddPatient: vi.fn(),
            patientSearch: '',
            onPatientSearchChange: vi.fn(),
        };
        const { rerender } = render(<AppointmentBookingForm {...props} fieldErrors={{}} />);
        await user.click(screen.getByRole('button', { name: 'Book appointment' }));
        rerender(
            <AppointmentBookingForm {...props} fieldErrors={{ doctorId: 'Select a doctor.' }} />
        );
        const doctor = screen.getByRole('combobox', { name: /doctor/i });
        expect(doctor).toHaveFocus();
        expect(doctor).toHaveAccessibleName('Doctor *');
        expect(doctor).toHaveAttribute('aria-invalid', 'true');
        expect(doctor).toHaveAccessibleDescription('Select a doctor.');
    });
});
