import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentActivityType, AppointmentStatus, BookingSource } from '../../types';
import AppointmentActivityDialog from './AppointmentActivityDialog';
import type { AppointmentListItem } from './appointmentApi';

const mockListAppointmentActivities = vi.hoisted(() => vi.fn());

vi.mock('./appointmentApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./appointmentApi')>();

    return {
        ...actual,
        listAppointmentActivities: mockListAppointmentActivities,
    };
});

const appointment: AppointmentListItem = {
    id: '30000000-0000-4000-8000-000000000001',
    clinicId: '00000000-0000-4000-8000-000000000000',
    doctorId: '10000000-0000-4000-8000-000000000001',
    patientId: '20000000-0000-4000-8000-000000000001',
    scheduledAt: '2026-09-18T04:30:00.000Z',
    durationMinutes: 15,
    status: AppointmentStatus.IN_QUEUE,
    bookingSource: BookingSource.RECEPTION,
    reason: null,
    notes: null,
    arrivedAt: '2026-09-18T04:48:00.000Z',
    arrivalOffsetMinutes: 18,
    isLateArrival: true,
    lateArrivalGraceMinutes: 15,
    createdAt: '2026-09-17T04:30:00.000Z',
    updatedAt: '2026-09-18T04:48:00.000Z',
    doctor: {
        id: '10000000-0000-4000-8000-000000000001',
        fullName: 'Dr. Asha Raman',
        specialization: 'Family Medicine',
    },
    patient: {
        id: '20000000-0000-4000-8000-000000000001',
        fullName: 'Ishita Rao',
        phone: '+91 00000 02001',
        email: 'ishita.rao@example.test',
    },
    queueEntry: null,
    noShowPrediction: null,
};

describe('AppointmentActivityDialog', () => {
    beforeEach(() => {
        mockListAppointmentActivities.mockReset();
    });

    it('renders product labels, actor identity, and persisted arrival context', async () => {
        mockListAppointmentActivities.mockResolvedValue({
            activities: [
                {
                    id: 'activity-id',
                    type: AppointmentActivityType.PATIENT_ARRIVED,
                    occurredAt: '2026-09-18T04:48:00.000Z',
                    actor: {
                        id: 'user-id',
                        fullName: 'Clinic Admin',
                        role: 'ADMIN',
                    },
                    metadata: {
                        fromStatus: AppointmentStatus.CONFIRMED,
                        toStatus: AppointmentStatus.IN_QUEUE,
                        arrivalOffsetMinutes: 18,
                        isLateArrival: true,
                        lateArrivalGraceMinutes: 15,
                    },
                },
            ],
        });

        render(
            <AppointmentActivityDialog
                appointment={appointment}
                timezone="Asia/Kolkata"
                onClose={vi.fn()}
            />
        );

        expect(await screen.findByText('Patient arrived')).toBeVisible();
        expect(screen.getByText(/Clinic Admin/)).toBeVisible();
        expect(screen.getByText('Late · 18 min')).toBeVisible();
        expect(screen.queryByText('PATIENT_ARRIVED')).not.toBeInTheDocument();
    });

    it('shows the honest legacy empty state', async () => {
        mockListAppointmentActivities.mockResolvedValue({ activities: [] });

        render(
            <AppointmentActivityDialog
                appointment={appointment}
                timezone="Asia/Kolkata"
                onClose={vi.fn()}
            />
        );

        expect(
            await screen.findByText('No recorded activity is available for this appointment yet.')
        ).toBeVisible();
    });

    it('retries an isolated timeline error without blocking the appointment page', async () => {
        mockListAppointmentActivities
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce({ activities: [] });
        const user = userEvent.setup();

        render(
            <AppointmentActivityDialog
                appointment={appointment}
                timezone="Asia/Kolkata"
                onClose={vi.fn()}
            />
        );

        await user.click(await screen.findByRole('button', { name: 'Try again' }));

        expect(
            await screen.findByText('No recorded activity is available for this appointment yet.')
        ).toBeVisible();
        expect(mockListAppointmentActivities).toHaveBeenCalledTimes(2);
    });

    it('renders terminal reason metadata and keeps legacy terminal activity readable', async () => {
        mockListAppointmentActivities.mockResolvedValueOnce({
            activities: [
                {
                    id: 'cancelled-id',
                    type: AppointmentActivityType.APPOINTMENT_CANCELLED,
                    occurredAt: '2026-09-18T10:00:00.000Z',
                    actor: { id: 'actor-id', fullName: 'Reception Staff', role: 'STAFF' },
                    metadata: {
                        fromStatus: AppointmentStatus.CONFIRMED,
                        toStatus: AppointmentStatus.CANCELLED,
                        cancellationReason: 'PATIENT_REQUEST',
                        cancellationNote: 'Patient called reception.',
                    },
                },
                {
                    id: 'legacy-no-show-id',
                    type: AppointmentActivityType.APPOINTMENT_NO_SHOW,
                    occurredAt: '2026-09-18T11:00:00.000Z',
                    actor: null,
                    metadata: {
                        fromStatus: AppointmentStatus.CONFIRMED,
                        toStatus: AppointmentStatus.NO_SHOW,
                    },
                },
            ],
        });

        render(<AppointmentActivityDialog appointment={appointment} onClose={vi.fn()} />);

        expect(await screen.findByText('Patient requested cancellation')).toBeInTheDocument();
        expect(screen.getByText('Patient called reception.')).toBeInTheDocument();
        expect(screen.getByText('Reason not recorded')).toBeInTheDocument();
    });
});
