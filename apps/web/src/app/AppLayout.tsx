import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { MobileWorkspaceNavigation } from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { LoadingState } from '../components/feedback';
import { useActiveClinic } from './activeClinicContext';
import { getNavigationRoutesForRole } from '../routes/dashboardRoutes';
import { getOnboardingStatus, type SetupStatusSummary } from '../features/onboarding/onboardingApi';
import FloatingSetupDock, {
    type FloatingSetupDockState,
} from '../features/onboarding/components/FloatingSetupDock';
import { isApiClientError } from '../lib';
import { UserRole } from '../types';

type AppLayoutProps = {
    initialSetup: SetupStatusSummary | null;
};

function ProtectedRouteLoadingState() {
    return (
        <div className="rounded-lg bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-app-border" role="status">
            <LoadingState message="Loading workspace page..." />
        </div>
    );
}

const idleSetupDockState: FloatingSetupDockState = {
    status: 'idle',
    setup: null,
    error: null,
};

const getInitialSetupDockState = (
    isAdmin: boolean,
    initialSetup: SetupStatusSummary | null
): FloatingSetupDockState => {
    if (!isAdmin) {
        return idleSetupDockState;
    }

    if (!initialSetup) {
        return {
            status: 'error',
            setup: null,
            error: {
                message: 'Setup progress was not included by the backend.',
                code: 'SETUP_STATUS_MISSING',
            },
        };
    }

    return {
        status: 'success',
        setup: initialSetup,
        error: null,
    };
};

const getSetupDockErrorState = (
    error: unknown,
    setup: SetupStatusSummary | null
): FloatingSetupDockState | null => {
    if (error instanceof Error && error.name === 'AbortError') {
        return null;
    }

    if (isApiClientError(error)) {
        if (error.code === 'API_REQUEST_ABORTED') {
            return null;
        }

        return {
            status: 'error',
            setup,
            error: {
                message: error.message,
                code: error.code,
            },
        };
    }

    return {
        status: 'error',
        setup,
        error: {
            message: 'Setup progress could not be loaded. Please try again.',
            code: 'SETUP_STATUS_LOAD_FAILED',
        },
    };
};

function AppLayout({ initialSetup }: AppLayoutProps) {
    const location = useLocation();
    const activeClinic = useActiveClinic();
    const currentUserRole = activeClinic.currentUser?.role ?? null;
    const isAdmin = currentUserRole === UserRole.ADMIN;
    const clinicName = activeClinic.clinic?.name ?? 'Active clinic';
    const clinicMeta =
        (activeClinic.clinic?.slug ? `/${activeClinic.clinic.slug}` : null) ??
        (activeClinic.source === 'authenticatedUser'
            ? 'Assigned clinic'
            : activeClinic.source === 'localStorage'
              ? 'Selected clinic'
              : 'Default clinic');
    const userRoleLabel =
        currentUserRole === 'ADMIN' ? 'Admin' : currentUserRole === 'STAFF' ? 'Staff' : 'Clinic';
    const userName = activeClinic.currentUser?.fullName?.trim() || userRoleLabel;
    const navigationItems = getNavigationRoutesForRole(currentUserRole);
    const lastSetupPathRef = useRef(location.pathname);
    const [setupDockState, setSetupDockState] = useState<FloatingSetupDockState>(() =>
        getInitialSetupDockState(isAdmin, initialSetup)
    );

    const loadSetupProgress = useCallback(
        async (signal?: AbortSignal) => {
            if (!isAdmin) {
                setSetupDockState(idleSetupDockState);
                return;
            }

            setSetupDockState((currentState) => ({
                status: 'loading',
                setup: currentState.setup,
                error: null,
            }));

            try {
                const data = await getOnboardingStatus(signal);

                if (!data.setup) {
                    setSetupDockState({
                        status: 'error',
                        setup: null,
                        error: {
                            message: 'Setup progress was not included by the backend.',
                            code: 'SETUP_STATUS_MISSING',
                        },
                    });
                    return;
                }

                setSetupDockState({
                    status: 'success',
                    setup: data.setup,
                    error: null,
                });
            } catch (error: unknown) {
                setSetupDockState((currentState) => {
                    const errorState = getSetupDockErrorState(error, currentState.setup);

                    return errorState ?? currentState;
                });
            }
        },
        [isAdmin]
    );

    useEffect(() => {
        if (!isAdmin) {
            setSetupDockState(idleSetupDockState);
            return undefined;
        }

        if (location.pathname === lastSetupPathRef.current) {
            return undefined;
        }

        lastSetupPathRef.current = location.pathname;
        const abortController = new AbortController();

        void loadSetupProgress(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [isAdmin, loadSetupProgress, location.pathname]);

    return (
        <div className="min-h-screen bg-[var(--color-surface-canvas)] text-slate-900">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-teal-800 focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-teal-600"
            >
                Skip to main content
            </a>
            <MobileWorkspaceNavigation
                navigationItems={navigationItems}
                clinicName={clinicName}
                clinicMeta={clinicMeta}
            />
            <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
                <Sidebar
                    navigationItems={navigationItems}
                    clinicName={clinicName}
                    clinicMeta={clinicMeta}
                />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                    <Topbar
                        clinicName={clinicName}
                        userName={userName}
                        userEmail={activeClinic.currentUser?.email}
                        userRole={userRoleLabel}
                    />

                    <main
                        id="main-content"
                        className="min-w-0 flex-1 px-3 py-4 sm:px-4 md:px-6 md:py-6"
                    >
                        <div className="mx-auto w-full max-w-screen-2xl">
                            <Suspense fallback={<ProtectedRouteLoadingState />}>
                                <div key={location.pathname} className="page-reveal">
                                    <Outlet />
                                </div>
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>
            <FloatingSetupDock state={setupDockState} onRetry={() => void loadSetupProgress()} />
        </div>
    );
}

export default AppLayout;
