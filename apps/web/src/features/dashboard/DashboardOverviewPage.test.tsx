import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardOverviewPage from './DashboardOverviewPage';
import { ApiClientError } from '../../lib';
import {
    activeDashboardSummary,
    activityItem,
    emptyDashboardSummary,
    highRiskAppointment,
} from '../../test/fixtures/dashboard';
import {
    completedAdminOnboarding,
    setupAllComplete,
    setupNoneComplete,
    setupPartiallyComplete,
} from '../../test/fixtures/onboarding';
import {
    adminActiveClinic,
    renderWithProviders,
    staffActiveClinic,
} from '../../test/renderWithProviders';

const mockGetDashboardSummary = vi.hoisted(() => vi.fn());
const mockListHighRiskAppointments = vi.hoisted(() => vi.fn());
const mockListTodayActivity = vi.hoisted(() => vi.fn());
const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());

vi.mock('./dashboardApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./dashboardApi')>();

    return {
        ...actual,
        getDashboardSummary: mockGetDashboardSummary,
        listHighRiskAppointments: mockListHighRiskAppointments,
        listTodayActivity: mockListTodayActivity,
    };
});

vi.mock('../onboarding/onboardingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../onboarding/onboardingApi')>();

    return {
        ...actual,
        getOnboardingStatus: mockGetOnboardingStatus,
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
        mockGetOnboardingStatus.mockReset();
    });

    it('loads dashboard data and Admin setup checklist progress', async () => {
        mockDashboardSuccess();
        mockGetOnboardingStatus.mockResolvedValue({
            ...completedAdminOnboarding,
            setup: setupPartiallyComplete,
        });

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(screen.getByText('Loading dashboard summary...')).toBeInTheDocument();
        expect(screen.getByText('Loading setup checklist...')).toBeInTheDocument();

        expect(await screen.findByText("Today's appointments")).toBeInTheDocument();
        expect(screen.getByText('2 of 4 steps completed')).toBeInTheDocument();
        expect(screen.getAllByText('Riya Sharma').length).toBeGreaterThan(0);
        expect(screen.getByText('Appointment booked')).toBeInTheDocument();
    });

    it('shows an error when Admin setup status is missing from the backend response', async () => {
        mockDashboardSuccess();
        mockGetOnboardingStatus.mockResolvedValue({
            ...completedAdminOnboarding,
            setup: null,
        });

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(await screen.findByText('Setup checklist could not be loaded')).toBeInTheDocument();
        expect(screen.getByText('SETUP_STATUS_MISSING')).toBeInTheDocument();
    });

    it('shows setup-status API failures and retries through refresh', async () => {
        const user = userEvent.setup();
        mockDashboardSuccess();
        mockGetOnboardingStatus
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'INVALID_AUTH_TOKEN',
                    message: 'Authentication token is invalid or expired',
                })
            )
            .mockResolvedValueOnce({
                ...completedAdminOnboarding,
                setup: setupAllComplete,
            });

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(await screen.findByText('Setup checklist could not be loaded')).toBeInTheDocument();
        expect(screen.getByText('INVALID_AUTH_TOKEN')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /try again/i }));

        expect(await screen.findByText('4 of 4 steps completed')).toBeInTheDocument();
        expect(mockGetOnboardingStatus).toHaveBeenCalledTimes(2);
    });

    it('refreshes dashboard and updates checklist progress from changed backend data', async () => {
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
        mockGetOnboardingStatus
            .mockResolvedValueOnce({
                ...completedAdminOnboarding,
                setup: setupNoneComplete,
            })
            .mockResolvedValueOnce({
                ...completedAdminOnboarding,
                setup: setupPartiallyComplete,
            });

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: adminActiveClinic,
        });

        expect(await screen.findByText('0 of 4 steps completed')).toBeInTheDocument();
        expect(screen.getByText('No dashboard activity for today.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /refresh dashboard/i }));

        await waitFor(() => {
            expect(screen.getByText('2 of 4 steps completed')).toBeInTheDocument();
        });
        expect(screen.getAllByText('Riya Sharma').length).toBeGreaterThan(0);
    });

    it('does not request the Admin setup checklist for Staff users', async () => {
        mockDashboardSuccess();

        renderWithProviders(<DashboardOverviewPage />, {
            activeClinic: staffActiveClinic,
        });

        expect(
            await screen.findByRole('heading', { name: /dashboard overview/i })
        ).toBeInTheDocument();
        expect(screen.queryByText('First-run setup')).not.toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });
});
