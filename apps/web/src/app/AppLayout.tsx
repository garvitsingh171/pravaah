import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import Sidebar, { MobileWorkspaceNavigation } from '../components/layout/Sidebar';
import CommandPalette from '../components/layout/CommandPalette';
import Topbar from '../components/layout/Topbar';
import { LoadingState } from '../components/feedback';
import { useActiveClinic } from './activeClinicContext';
import {
    appRoutePaths,
    getNavigationRoutesForRole,
    getRouteForPath,
} from '../routes/dashboardRoutes';
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
        <div
            className="rounded-lg bg-white p-4 shadow-[var(--shadow-soft)] ring-1 ring-app-border"
            role="status"
        >
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
    const navigationType = useNavigationType();
    const [commandsOpen, setCommandsOpen] = useState(false);
    const previousScrollPath = useRef<string | null>(null);
    const scrollPositions = useRef(new Map<string, number>());
    const activeClinic = useActiveClinic();
    const currentRoute = getRouteForPath(location.pathname);
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
    const isRouteAllowed =
        !currentRoute.allowedRoles ||
        (currentUserRole !== null && currentRoute.allowedRoles.includes(currentUserRole));
    const topbarSupportingText = currentRoute.navigationDescription;
    const lastSetupPathRef = useRef(location.pathname);
    const mainScrollRef = useRef<HTMLElement>(null);
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
        const scrollContainer = mainScrollRef.current;
        const positions = scrollPositions.current;

        if (!scrollContainer) {
            return;
        }

        const isFirstPage = previousScrollPath.current === null;
        const samePage = previousScrollPath.current === location.pathname;
        previousScrollPath.current = location.pathname;
        const savedTop = samePage
            ? scrollContainer.scrollTop
            : navigationType === 'POP'
              ? (positions.get(location.key) ?? 0)
              : 0;
        scrollContainer.scrollTop = savedTop;
        if (!samePage && !isFirstPage) scrollContainer.focus({ preventScroll: true });
        scrollContainer.scrollLeft = 0;

        if (typeof scrollContainer.scrollTo === 'function') {
            scrollContainer.scrollTo({ top: savedTop, left: 0, behavior: 'auto' });
        }
        if (location.hash) {
            const frame = window.requestAnimationFrame(() => {
                const target = document.getElementById(location.hash.slice(1));
                if (typeof target?.scrollIntoView === 'function') {
                    target.scrollIntoView({ block: 'start' });
                }
            });
            return () => {
                window.cancelAnimationFrame(frame);
            };
        }
        // History may return before a lazy page or its data has filled the scroll area.
        // Restore when the content is tall enough, unless the user starts scrolling.
        const content = scrollContainer.firstElementChild;
        if (savedTop > 0 && content && typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                scrollContainer.scrollTop = savedTop;
                if (scrollContainer.scrollHeight - scrollContainer.clientHeight >= savedTop)
                    observer.disconnect();
            });
            const stopRestoring = () => observer.disconnect();
            observer.observe(content);
            scrollContainer.addEventListener('wheel', stopRestoring, { passive: true });
            scrollContainer.addEventListener('touchstart', stopRestoring, { passive: true });
            scrollContainer.addEventListener('keydown', stopRestoring);
            return () => {
                observer.disconnect();
                scrollContainer.removeEventListener('wheel', stopRestoring);
                scrollContainer.removeEventListener('touchstart', stopRestoring);
                scrollContainer.removeEventListener('keydown', stopRestoring);
            };
        }
        return undefined;
    }, [location.pathname, location.hash, location.key, navigationType]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (
                target?.closest(
                    'input, textarea, select, [contenteditable="true"], [role="dialog"]'
                ) ||
                event.isComposing
            )
                return;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setCommandsOpen(true);
            } else if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
                const search =
                    mainScrollRef.current?.querySelector<HTMLInputElement>('input[type="search"]');
                if (search) {
                    event.preventDefault();
                    search.focus();
                }
            }
        };
        document.addEventListener('keydown', handleShortcut);
        return () => document.removeEventListener('keydown', handleShortcut);
    }, []);

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

    if (!isRouteAllowed) {
        return <Navigate to={appRoutePaths.dashboard} replace />;
    }

    return (
        <div className="workspace-app flex h-dvh min-w-0 flex-col overflow-hidden bg-app-background text-app-text">
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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
                <Sidebar
                    navigationItems={navigationItems}
                    clinicName={clinicName}
                    clinicMeta={clinicMeta}
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <Topbar
                        onOpenCommands={() => setCommandsOpen(true)}
                        title={currentRoute.title}
                        supportingText={topbarSupportingText}
                        clinicName={clinicName}
                        userName={userName}
                        userEmail={activeClinic.currentUser?.email}
                        userRole={userRoleLabel}
                    />

                    <main
                        ref={mainScrollRef}
                        id="main-content"
                        tabIndex={0}
                        data-workspace-scroll-container="true"
                        onScroll={(event) =>
                            scrollPositions.current.set(location.key, event.currentTarget.scrollTop)
                        }
                        className="min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4 md:px-6 md:py-6"
                    >
                        <div className="mx-auto w-full max-w-[1440px]">
                            <Suspense fallback={<ProtectedRouteLoadingState />}>
                                <div key={location.pathname} className="workspace-page">
                                    <Outlet />
                                </div>
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>
            {commandsOpen && (
                <CommandPalette
                    navigationItems={navigationItems}
                    onClose={() => setCommandsOpen(false)}
                />
            )}
            <FloatingSetupDock
                key={activeClinic.clinicId}
                clinicId={activeClinic.clinicId}
                state={setupDockState}
                onRetry={() => void loadSetupProgress()}
            />
        </div>
    );
}

export default AppLayout;
