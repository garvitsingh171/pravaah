import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminActiveClinic, renderWithProviders } from '../../test/renderWithProviders';
import { AppointmentStatus, BookingSource } from '../../types';
import type { AppointmentListItem } from './appointmentApi';
import AppointmentsPage from './AppointmentsPage';

const listAppointments = vi.hoisted(() => vi.fn());
const updateAppointmentStatus = vi.hoisted(() => vi.fn());

vi.mock('./appointmentApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./appointmentApi')>()),
    listAppointments,
    updateAppointmentStatus,
}));
vi.mock('../doctors/doctorApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../doctors/doctorApi')>()),
    listDoctors: vi.fn().mockResolvedValue({ doctors: [] }),
}));
vi.mock('../patients/patientApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../patients/patientApi')>()),
    listPatients: vi.fn().mockResolvedValue({ patients: [] }),
}));

const appointment: AppointmentListItem = {
    id: 'appointment-1',
    clinicId: adminActiveClinic.clinicId,
    doctorId: 'doctor-1',
    patientId: 'patient-1',
    scheduledAt: '2026-10-15T10:00:00.000Z',
    durationMinutes: 15,
    status: AppointmentStatus.SCHEDULED,
    bookingSource: BookingSource.RECEPTION,
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
    doctor: { id: 'doctor-1', fullName: 'Dr. Rao', specialization: 'General Medicine' },
    patient: { id: 'patient-1', fullName: 'Asha Mehra', phone: '9000000000', email: null },
    queueEntry: null,
    noShowPrediction: null,
};

describe('AppointmentsPage primary status action', () => {
    beforeEach(() => {
        listAppointments.mockReset().mockResolvedValue({ appointments: [appointment] });
        updateAppointmentStatus.mockReset().mockResolvedValue({
            appointment: { ...appointment, status: AppointmentStatus.CONFIRMED },
        });
    });

    it('offers the next valid transition directly and saves through the API', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        await user.click(await screen.findByRole('button', { name: 'Confirm' }));

        await waitFor(() => {
            expect(updateAppointmentStatus).toHaveBeenCalledWith(appointment.id, {
                status: AppointmentStatus.CONFIRMED,
            });
        });
        expect(await screen.findByText('Status updated to confirmed.')).toBeInTheDocument();
    });

    it('filters the loaded schedule by patient and pages long lists', async () => {
        const user = userEvent.setup();
        listAppointments.mockResolvedValue({
            appointments: Array.from({ length: 17 }, (_, index) => ({
                ...appointment,
                id: `appointment-${index}`,
                patient: {
                    ...appointment.patient,
                    id: `patient-${index}`,
                    fullName: `Patient ${index + 1}`,
                    phone: `90000000${String(index).padStart(2, '0')}`,
                },
            })),
        });
        renderWithProviders(<AppointmentsPage />, { activeClinic: adminActiveClinic });

        expect(await screen.findByText('Patient 1')).toBeInTheDocument();
        expect(screen.queryByText('Patient 17')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Next' }));
        expect(screen.getByText('Patient 17')).toBeInTheDocument();

        await user.type(screen.getByRole('searchbox', { name: 'Search patient' }), '9000000016');
        expect(screen.getByText('Patient 17')).toBeInTheDocument();
        expect(screen.queryByText('Patient 1')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    });
});
