import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveClinicReactContext } from '../../app/activeClinicContext';
import { ToastProvider } from '../../components/feedback';
import { adminActiveClinic } from '../../test/renderWithProviders';
import PatientCreatePage from './PatientCreatePage';

const createPatient = vi.hoisted(() => vi.fn());

vi.mock('./patientApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./patientApi')>()),
    createPatient,
}));

function BookingReturn() {
    const location = useLocation();
    return <output data-testid="booking-return">{JSON.stringify(location.state)}</output>;
}

describe('PatientCreatePage booking return', () => {
    beforeEach(() => {
        createPatient.mockReset().mockResolvedValue({ patient: { id: 'new-patient-id' } });
    });

    it('focuses the first invalid field and connects its error text', async () => {
        const user = userEvent.setup();
        render(
            <MemoryRouter initialEntries={['/patients/new']}>
                <ActiveClinicReactContext.Provider value={adminActiveClinic}>
                    <ToastProvider>
                        <Routes>
                            <Route path="/patients/new" element={<PatientCreatePage />} />
                        </Routes>
                    </ToastProvider>
                </ActiveClinicReactContext.Provider>
            </MemoryRouter>
        );
        await user.click(screen.getByRole('button', { name: 'Create patient' }));
        const name = screen.getByRole('textbox', { name: /full name/i });
        expect(name).toHaveFocus();
        expect(name).toHaveAccessibleName('Full name *');
        expect(name).toHaveAttribute('aria-invalid', 'true');
        expect(name).toHaveAccessibleDescription('Patient name is required.');
        expect(screen.getByRole('textbox', { name: /^phone/i })).toHaveAccessibleDescription(
            'Patient phone number is required.'
        );
        expect(createPatient).not.toHaveBeenCalled();
    });

    it('returns the booking draft and selects the newly created patient', async () => {
        const user = userEvent.setup();
        const bookingDraft = {
            doctorId: 'doctor-id',
            patientId: '',
            appointmentDate: '2026-10-19',
            scheduledAt: '',
            durationMinutes: '15',
            reason: 'Follow-up',
            notes: '',
        };
        render(
            <MemoryRouter
                initialEntries={[
                    { pathname: '/patients/new', state: { returnToBooking: true, bookingDraft } },
                ]}
            >
                <ActiveClinicReactContext.Provider value={adminActiveClinic}>
                    <ToastProvider>
                        <Routes>
                            <Route path="/patients/new" element={<PatientCreatePage />} />
                            <Route path="/appointments" element={<BookingReturn />} />
                        </Routes>
                    </ToastProvider>
                </ActiveClinicReactContext.Provider>
            </MemoryRouter>
        );

        await user.type(screen.getByRole('textbox', { name: /full name/i }), 'New Patient');
        await user.type(screen.getByRole('textbox', { name: /^phone/i }), '9000000000');
        await user.click(screen.getByRole('button', { name: 'Create patient' }));

        await waitFor(() => expect(createPatient).toHaveBeenCalledOnce());
        const returned = JSON.parse(
            (await screen.findByTestId('booking-return')).textContent ?? '{}'
        );
        expect(returned).toMatchObject({ bookingDraft, patientId: 'new-patient-id' });
    });
});
