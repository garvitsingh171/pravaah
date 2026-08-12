import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
const mockListHighRiskAppointments = vi.hoisted(() => vi.fn());
const mockListTodayActivity = vi.hoisted(() => vi.fn());

vi.mock('./dashboardApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./dashboardApi')>();

    return {
        ...actual,
        getDashboardSummary: mockGetDashboardSummary,
        listHighRiskAppointments: mockListHighRiskAppointments,
        listTodayActivity: mockListTodayActivity,
    };
});

const mockDashboardSuccess = () => {
    mockGetDashboardSummary.mockResolvedValue({
        dashboardSummary: activeDashboardSummary,
    });
    mockListHighRiskAppointments.mockResolvedValue({
        clinicId: activeDashboardSummary.clinicId,
        date: activeDashboardSummary.date,
        highRiskAppointments: [highRiskAppointment],
    });
    mockListTodayActivity.mockResolvedValue({
        clinicId: activeDashboardSummary.clinicId,
        date: activeDashboardSummary.date,
        activityItems: [activityItem],
    });
};

describe('DashboardOverviewPage', () => {
    beforeEach(() => {
        mockGetDashboardSummary.mockReset();
        mockListHighRiskAppointments.mockReset();
        mockListTodayActivity.mockReset();
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
        mockListHighRiskAppointments
            .mockResolvedValueOnce({
                clinicId: emptyDashboardSummary.clinicId,
                date: emptyDashboardSummary.date,
                highRiskAppointments: [],
            })
            .mockResolvedValueOnce({
                clinicId: activeDashboardSummary.clinicId,
                date: activeDashboardSummary.date,
                highRiskAppointments: [highRiskAppointment],
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

        expect(
            await screen.findByRole('heading', { name: /today at pravaah/i })
        ).toBeInTheDocument();
        expect(screen.queryByText('First-run setup')).not.toBeInTheDocument();
    });
});
