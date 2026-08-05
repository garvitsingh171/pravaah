import type { PropsWithChildren } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveClinicReactContext } from './activeClinicContext';
import ProtectedAppShell from './ProtectedAppShell';
import { ApiClientError } from '../lib';
import { UserRole, UserStatus } from '../types';
import {
    completedAdminOnboarding,
    completedStaffOnboarding,
    onboardingNotStarted,
    recoveryRequiredOnboarding,
    testClinicId,
} from '../test/fixtures/onboarding';
import { renderWithProviders } from '../test/renderWithProviders';
import { setClerkLoading, setClerkSignedIn, setClerkSignedOut } from '../test/mocks/clerk';

const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());
const mockActiveClinicRole = vi.hoisted(() => ({ value: 'ADMIN' as UserRole }));

const protectedRouteHeadings: Record<string, RegExp> = {
    '/dashboard': /protected dashboard/i,
    '/doctors': /^doctors$/i,
    '/patients': /^patients$/i,
    '/appointments': /^appointments$/i,
    '/queue': /^queue$/i,
    '/clinic-settings': /^clinic settings$/i,
};

vi.mock('../features/onboarding/onboardingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../features/onboarding/onboardingApi')>();

    return {
        ...actual,
        getOnboardingStatus: mockGetOnboardingStatus,
    };
});

vi.mock('./ActiveClinicProvider', () => ({
    default: ({ children }: PropsWithChildren) => (
        <ActiveClinicReactContext.Provider
            value={{
                clinicId: testClinicId,
                source: 'authenticatedUser',
                clinic: {
                    name: 'Pravaah Test Clinic',
                    slug: 'pravaah-test-clinic',
                    timezone: 'Asia/Kolkata',
                },
                currentUser: {
                    role: mockActiveClinicRole.value,
                    fullName:
                        mockActiveClinicRole.value === UserRole.ADMIN ? 'Test Admin' : 'Test Staff',
                    email:
                        mockActiveClinicRole.value === UserRole.ADMIN
                            ? 'admin+test@pravaah.local'
                            : 'staff+test@pravaah.local',
                },
            }}
        >
            {children}
        </ActiveClinicReactContext.Provider>
    ),
}));

function LocationState() {
    const location = useLocation();

    return (
        <div data-testid="location">
            {location.pathname}
            {location.search}
        </div>
    );
}

function renderShell(route = '/dashboard?tab=today#risk') {
    return renderWithProviders(
        <Routes>
            <Route element={<ProtectedAppShell />}>
                <Route path="/dashboard" element={<h1>Protected Dashboard</h1>} />
                <Route path="/doctors" element={<h1>Doctors</h1>} />
                <Route path="/patients" element={<h1>Patients</h1>} />
                <Route path="/appointments" element={<h1>Appointments</h1>} />
                <Route path="/queue" element={<h1>Queue</h1>} />
                <Route path="/clinic-settings" element={<h1>Clinic Settings</h1>} />
            </Route>
            <Route path="/login" element={<LocationState />} />
            <Route path="/onboarding/clinic" element={<LocationState />} />
        </Routes>,
        {
            route,
        }
    );
}

describe('ProtectedAppShell', () => {
    beforeEach(() => {
        mockGetOnboardingStatus.mockReset();
        mockActiveClinicRole.value = UserRole.ADMIN;
    });

    it('shows the current loading state while Clerk is loading', () => {
        setClerkLoading();

        renderShell();

        expect(screen.getByText('Preparing Pravaah...')).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: /protected dashboard/i })
        ).not.toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('redirects signed-out users to login with the intended safe return path', async () => {
        setClerkSignedOut();

        renderShell();

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent(
                '/login?redirect_url=%2Fdashboard%3Ftab%3Dtoday%23risk'
            );
        });
        expect(
            screen.queryByRole('heading', { name: /protected dashboard/i })
        ).not.toBeInTheDocument();
        expect(mockGetOnboardingStatus).not.toHaveBeenCalled();
    });

    it('redirects signed-in unprovisioned users to clinic onboarding', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

        renderShell('/doctors');

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent(
                '/onboarding/clinic?redirect_url=%2Fdoctors'
            );
        });
        expect(screen.queryByRole('heading', { name: /doctors/i })).not.toBeInTheDocument();
    });

    it.each(['/dashboard', '/doctors', '/patients', '/appointments', '/queue', '/clinic-settings'])(
        'keeps %s inaccessible while onboarding has not started',
        async (route) => {
            setClerkSignedIn();
            mockGetOnboardingStatus.mockResolvedValue(onboardingNotStarted);

            renderShell(route);

            await waitFor(() => {
                expect(screen.getByTestId('location')).toHaveTextContent('/onboarding/clinic');
            });
            expect(
                screen.queryByRole('heading', { name: protectedRouteHeadings[route] })
            ).not.toBeInTheDocument();
        }
    );

    it('allows a completed active Admin into the protected app shell', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /clinic settings/i })).toBeInTheDocument();
    });

    it('opens and closes the mobile workspace navigation with keyboard focus restored', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        const openButton = screen.getByRole('button', { name: /open clinic navigation/i });
        await user.click(openButton);

        expect(
            screen.getByRole('dialog', {
                name: /clinic workspace navigation menu/i,
            })
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /close clinic navigation/i })).toHaveFocus();

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog', {
                    name: /clinic workspace navigation menu/i,
                })
            ).not.toBeInTheDocument();
        });
        await waitFor(() => expect(openButton).toHaveFocus());
    });

    it('allows a completed active Staff user but does not expose Admin navigation', async () => {
        setClerkSignedIn();
        mockActiveClinicRole.value = UserRole.STAFF;
        mockGetOnboardingStatus.mockResolvedValue(completedStaffOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /clinic settings/i })).not.toBeInTheDocument();
    });

    it.each([
        ['explicit recovery', recoveryRequiredOnboarding],
        [
            'completed status with missing user',
            {
                ...completedAdminOnboarding,
                user: null,
            },
        ],
        [
            'completed status with missing clinic',
            {
                ...completedAdminOnboarding,
                clinic: null,
            },
        ],
        [
            'inactive internal user',
            {
                ...completedAdminOnboarding,
                user: {
                    ...completedAdminOnboarding.user!,
                    status: UserStatus.SUSPENDED,
                },
            },
        ],
        [
            'unsupported role',
            {
                ...completedAdminOnboarding,
                user: {
                    ...completedAdminOnboarding.user!,
                    role: 'PATIENT',
                },
            },
        ],
    ])('shows recovery UI for %s', async (_name, response) => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(response);

        renderShell('/dashboard');

        expect(await screen.findByText('Account needs recovery')).toBeInTheDocument();
        expect(screen.getByText('RECOVERY_REQUIRED')).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: /protected dashboard/i })
        ).not.toBeInTheDocument();
    });

    it('shows structured status failures and retries successfully', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus
            .mockRejectedValueOnce(
                new ApiClientError({
                    code: 'INVALID_AUTH_TOKEN',
                    message: 'Authentication token is invalid or expired',
                    status: 401,
                })
            )
            .mockResolvedValueOnce(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByText('Application access could not be checked')
        ).toBeInTheDocument();
        expect(screen.getByText('INVALID_AUTH_TOKEN')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /try again/i }));

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();
        expect(mockGetOnboardingStatus).toHaveBeenCalledTimes(2);
    });
});
