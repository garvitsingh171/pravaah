import type { PropsWithChildren } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveClinicReactContext } from './activeClinicContext';
import ProtectedAppShell from './ProtectedAppShell';
import { ApiClientError } from '../lib';
import { UserRole, UserStatus } from '../types';
import {
    completedAdminOnboarding,
    completedStaffOnboarding,
    onboardingNotStarted,
    recoveryRequiredOnboarding,
    setupAllComplete,
    setupNoneComplete,
    testClinicId,
} from '../test/fixtures/onboarding';
import { renderWithProviders } from '../test/renderWithProviders';
import {
    getMockClerkSignOut,
    setClerkLoading,
    setClerkSignedIn,
    setClerkSignedOut,
} from '../test/mocks/clerk';

const mockGetOnboardingStatus = vi.hoisted(() => vi.fn());
const mockActiveClinicRole = vi.hoisted(() => ({ value: 'ADMIN' as UserRole }));
const desktopNavigationMediaQuery = '(min-width: 768px)';

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

function stubDesktopBreakpoint({ matches = false } = {}) {
    let changeListener: EventListener | null = null;
    const mediaQueryList = {
        matches,
        media: desktopNavigationMediaQuery,
        onchange: null,
        addEventListener: vi.fn((eventName: string, listener: EventListener) => {
            if (eventName === 'change') {
                changeListener = listener;
            }
        }),
        removeEventListener: vi.fn((eventName: string, listener: EventListener) => {
            if (eventName === 'change' && changeListener === listener) {
                changeListener = null;
            }
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;

    vi.stubGlobal('matchMedia', vi.fn(() => mediaQueryList));

    return {
        triggerDesktopBreakpoint: () => {
            changeListener?.({
                matches: true,
                media: desktopNavigationMediaQuery,
            } as MediaQueryListEvent);
        },
    };
}

describe('ProtectedAppShell', () => {
    beforeEach(() => {
        mockGetOnboardingStatus.mockReset();
        mockActiveClinicRole.value = UserRole.ADMIN;
    });

    afterEach(() => {
        document.body.style.overflow = '';
        vi.unstubAllGlobals();
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

    it('uses the topbar for current page context without repeating clinic identity', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        const topbar = screen.getByRole('banner');
        expect(within(topbar).getByRole('heading', { name: /today at pravaah/i })).toBeVisible();
        expect(within(topbar).queryByText('Pravaah Test Clinic')).not.toBeInTheDocument();
        expect(screen.getByText('Pravaah Test Clinic')).toBeInTheDocument();
    });

    it('does not render the clinic timezone in protected navigation chrome', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();
        expect(screen.queryByText('Asia/Kolkata')).not.toBeInTheDocument();
    });

    it('routes the protected logo to the dashboard for signed-in users', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/doctors');

        expect(await screen.findAllByRole('heading', { name: /^doctors$/i })).toHaveLength(2);

        await user.click(screen.getAllByRole('link', { name: /pravaah home/i })[0]);

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();
    });

    it('signs out through Clerk and redirects to the public home route', async () => {
        const user = userEvent.setup();
        const signOut = getMockClerkSignOut();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /test admin/i }));
        const menu = screen.getByRole('menu');
        expect(menu.className).toContain('z-[60]');

        await user.click(screen.getByRole('menuitem', { name: /^sign out$/i }));

        await waitFor(() => {
            expect(signOut).toHaveBeenCalledWith({ redirectUrl: '/' });
        });
    });

    it('opens and closes the profile menu with outside click and Escape', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        const trigger = screen.getByRole('button', { name: /test admin/i });
        await user.click(trigger);
        expect(screen.getByRole('menu')).toBeInTheDocument();

        await user.click(document.body);
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());

        await user.click(trigger);
        expect(screen.getByRole('menu')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
        expect(trigger).toHaveFocus();
    });

    it('renders incomplete setup progress and lets users dismiss it for the session', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue({
            ...completedAdminOnboarding,
            setup: setupNoneComplete,
        });

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        expect(
            screen.getByRole('region', { name: /clinic setup assistant/i })
        ).toBeInTheDocument();

        expect(screen.getByText('0 of 4 complete')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /view details/i }));
        expect(screen.getByRole('link', { name: /complete clinic settings/i })).toHaveAttribute(
            'href',
            '/clinic-settings'
        );

        await user.click(screen.getByRole('button', { name: /dismiss clinic setup/i }));

        await waitFor(() => {
            expect(
                screen.queryByRole('region', { name: /clinic setup assistant/i })
            ).not.toBeInTheDocument();
        });
        expect(window.sessionStorage.getItem(`pravaah:setup-assistant-dismissed:${testClinicId}`)).toBe(
            'true'
        );
        expect(mockGetOnboardingStatus).toHaveBeenCalledTimes(1);
    });

    it('does not show the floating setup assistant when setup is already complete', async () => {
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue({
            ...completedAdminOnboarding,
            setup: setupAllComplete,
        });

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole('region', { name: /clinic setup assistant/i })
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /clinic setup complete/i })).not.toBeInTheDocument();
    });

    it('briefly acknowledges setup when visible incomplete progress becomes complete', async () => {
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus
            .mockResolvedValueOnce({
                ...completedAdminOnboarding,
                setup: setupNoneComplete,
            })
            .mockResolvedValueOnce({
                ...completedAdminOnboarding,
                setup: setupAllComplete,
            });

        renderShell('/dashboard');

        expect(
            await screen.findByRole('region', { name: /clinic setup assistant/i })
        ).toBeInTheDocument();

        await user.click(screen.getAllByRole('link', { name: /doctors/i })[0]);

        expect(
            await screen.findByRole('status', { name: /clinic setup complete/i })
        ).toHaveTextContent('Clinic ready');

        await waitFor(
            () => {
                expect(
                    screen.queryByRole('status', { name: /clinic setup complete/i })
                ).not.toBeInTheDocument();
            },
            { timeout: 4000 }
        );
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

    it('closes the mobile workspace navigation when the desktop breakpoint matches', async () => {
        const { triggerDesktopBreakpoint } = stubDesktopBreakpoint();
        const user = userEvent.setup();
        setClerkSignedIn();
        mockGetOnboardingStatus.mockResolvedValue(completedAdminOnboarding);

        renderShell('/dashboard');

        expect(
            await screen.findByRole('heading', { name: /protected dashboard/i })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /open clinic navigation/i }));

        expect(
            screen.getByRole('dialog', {
                name: /clinic workspace navigation menu/i,
            })
        ).toBeInTheDocument();
        expect(document.body.style.overflow).toBe('hidden');

        triggerDesktopBreakpoint();

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog', {
                    name: /clinic workspace navigation menu/i,
                })
            ).not.toBeInTheDocument();
        });
        await waitFor(() => expect(document.body.style.overflow).toBe(''));
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
