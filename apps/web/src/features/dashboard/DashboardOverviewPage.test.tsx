import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentStatus, QueueStatus } from '../../types';
import { getClinicDateInputValue } from '../../lib/clinicDateTime';
import type { AppointmentListItem } from '../appointments/appointmentApi';
import DashboardOverviewPage from './DashboardOverviewPage';
import {
    activeDashboardSummary,
    activityItem,
    emptyDashboardSummary,
    highRiskAppointment,
} from '../../test/fixtures/dashboard';
import {
    adminActiveClinic,
    renderWithProviders,
    staffActiveClinic,
} from '../../test/renderWithProviders';

const mockGetDashboardSummary = vi.hoisted(() => vi.fn());
const mockListTodayActivity = vi.hoisted(() => vi.fn());
const mockListAppointments = vi.hoisted(() => vi.fn());
const mockGetNoShowIntelligence = vi.hoisted(() => vi.fn());

vi.mock('../appointments/appointmentApi', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../appointments/appointmentApi')>()),
    listAppointments: mockListAppointments,
}));

vi.mock('./dashboardApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./dashboardApi')>();

    return {
        ...actual,
        getDashboardSummary: mockGetDashboardSummary,
        listTodayActivity: mockListTodayActivity,
        getNoShowIntelligence: mockGetNoShowIntelligence,
    };
});

const mockDashboardSuccess = () => {
    const from = getClinicDateInputValue(adminActiveClinic.clinic?.timezone);
    const periodEnd = new Date(`${from}T12:00:00Z`);
    periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);
    mockGetDashboardSummary.mockResolvedValue({
        dashboardSummary: activeDashboardSummary,
    });
    mockListTodayActivity.mockResolvedValue({
        clinicId: activeDashboardSummary.clinicId,
        date: activeDashboardSummary.date,
        activityItems: [activityItem],
    });
    mockGetNoShowIntelligence.mockResolvedValue({
        noShowIntelligence: {
            clinicId: activeDashboardSummary.clinicId,
            from,
            to: periodEnd.toISOString().slice(0, 10),
            totalUpcoming: 4,
            riskCounts: { high: 1, medium: 1, low: 1, unavailable: 1 },
            contributingFactors: [{
                code: 'PREVIOUS_NO_SHOW_HISTORY',
                label: 'Previous no-show history',
                appointmentCount: 1,
                direction: 'increases',
                averageScoreImpact: 30,
            }],
            highRiskAppointments: [highRiskAppointment],
        },
    });
};

describe('DashboardOverviewPage', () => {
    beforeEach(() => {
        const from = getClinicDateInputValue(adminActiveClinic.clinic?.timezone);
        const periodEnd = new Date(`${from}T12:00:00Z`);
        periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);
        mockGetDashboardSummary.mockReset();
        mockListTodayActivity.mockReset();
        mockGetNoShowIntelligence.mockReset().mockResolvedValue({
            noShowIntelligence: {
                clinicId: adminActiveClinic.clinicId,
                from,
                to: periodEnd.toISOString().slice(0, 10),
                totalUpcoming: 0,
                riskCounts: { high: 0, medium: 0, low: 0, unavailable: 0 },
                contributingFactors: [],
                highRiskAppointments: [],
            },
        });
        mockListAppointments.mockReset().mockResolvedValue({ appointments: [] });
    });

    it('loads dashboard data into operational command modules', async () => {
        mockDashboardSuccess();

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(screen.getByText('Loading dashboard summary...')).toBeInTheDocument();

        expect(await screen.findByText("Today's appointments")).toBeInTheDocument();
        expect(screen.getByText('Operational pulse')).toBeInTheDocument();
        expect(screen.getByText('Today by status')).toBeInTheDocument();
        expect(screen.getAllByText('Riya Sharma').length).toBeGreaterThan(0);
        expect(screen.getByText('Appointment booked')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Book appointment' })[0]).toHaveAttribute(
            'href',
            '/appointments#book-appointment'
        );
        expect(screen.getByText('No-show risk intelligence')).toBeInTheDocument();
        expect(screen.getByText('High-risk appointments requiring review')).toBeInTheDocument();
        expect(screen.getByText('Upcoming appointments').parentElement?.textContent).toContain('4');
        expect(screen.queryByText('First-run setup')).not.toBeInTheDocument();
    });

    it('refreshes dashboard and updates operational modules from changed backend data', async () => {
        const user = userEvent.setup();
        mockGetDashboardSummary
            .mockResolvedValueOnce({
                dashboardSummary: emptyDashboardSummary,
            })
            .mockResolvedValueOnce({
                dashboardSummary: activeDashboardSummary,
            });
        mockListTodayActivity
            .mockResolvedValueOnce({
                clinicId: emptyDashboardSummary.clinicId,
                date: emptyDashboardSummary.date,
                activityItems: [],
            })
            .mockResolvedValueOnce({
                clinicId: activeDashboardSummary.clinicId,
                date: activeDashboardSummary.date,
                activityItems: [activityItem],
            });

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(await screen.findByText('No dashboard activity for today.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /^refresh$/i }));

        await waitFor(() => {
            expect(screen.getAllByText('Riya Sharma').length).toBeGreaterThan(0);
        });
        expect(screen.getByText('Appointment booked')).toBeInTheDocument();
    });

    it('does not render first-run setup inside the Staff dashboard', async () => {
        mockDashboardSuccess();

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: staffActiveClinic,
        });

        expect(await screen.findByText("Today's appointments")).toBeInTheDocument();
        expect(screen.queryByText('First-run setup')).not.toBeInTheDocument();
    });

    it('does not count a booked queue entry as a patient who has arrived', async () => {
        mockDashboardSuccess();
        const bookedAppointment: AppointmentListItem = {
            id: 'booking-id',
            clinicId: activeDashboardSummary.clinicId,
            doctorId: highRiskAppointment.doctor.id,
            patientId: highRiskAppointment.patient.id,
            scheduledAt: highRiskAppointment.appointment.scheduledAt,
            durationMinutes: 15,
            status: AppointmentStatus.SCHEDULED,
            bookingSource: highRiskAppointment.appointment.bookingSource,
            createdAt: '2026-07-29T09:00:00.000Z',
            updatedAt: '2026-07-29T09:00:00.000Z',
            doctor: highRiskAppointment.doctor,
            patient: highRiskAppointment.patient,
            queueEntry: {
                id: 'queue-id',
                position: 2,
                status: QueueStatus.WAITING,
                queuedAt: '2026-07-29T09:00:00.000Z',
            },
            noShowPrediction: null,
        };
        mockListAppointments.mockResolvedValue({ appointments: [bookedAppointment] });
        renderWithProviders(<DashboardOverviewPage />, { activeClinic: adminActiveClinic });

        const waitingLabel = await screen.findByText('Patients waiting');
        expect(
            within(waitingLabel.parentElement as HTMLElement).getByText('0')
        ).toBeInTheDocument();
        expect(screen.getByText('Live queue preview')).toBeInTheDocument();
        expect(
            screen.getByText('No arrived patients are in the queue right now.')
        ).toBeInTheDocument();
    });

    it('keeps the summary visible when the schedule preview request fails', async () => {
        mockDashboardSuccess();
        mockListAppointments.mockRejectedValue(new Error('preview unavailable'));
        renderWithProviders(<DashboardOverviewPage />, { activeClinic: adminActiveClinic });

        expect(
            await screen.findByText(
                'Schedule preview could not be loaded. Open appointments to retry.'
            )
        ).toBeInTheDocument();
        expect(screen.getByText("Today's appointments")).toBeInTheDocument();
        expect(
            screen.getByText('Queue preview unavailable; open the live queue')
        ).toBeInTheDocument();
    });
});
