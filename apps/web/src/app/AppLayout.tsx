import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { MobileWorkspaceNavigation } from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { LoadingState } from '../components/feedback';
import { useActiveClinic } from './activeClinicContext';
import { getNavigationRoutesForRole, getRouteForPath } from '../routes/dashboardRoutes';

function ProtectedRouteLoadingState() {
    return (
        <div className="rounded-lg border border-app-border bg-white p-4" role="status">
            <LoadingState message="Loading workspace page..." />
        </div>
    );
}

function AppLayout() {
    const location = useLocation();
    const activeClinic = useActiveClinic();
    const currentRoute = getRouteForPath(location.pathname);
    const currentUserRole = activeClinic.currentUser?.role ?? null;
    const clinicName = activeClinic.clinic?.name ?? 'Active clinic';
    const clinicMeta =
        activeClinic.clinic?.timezone ??
        (activeClinic.source === 'authenticatedUser'
            ? 'Assigned clinic'
            : activeClinic.source === 'localStorage'
              ? 'Selected clinic'
              : 'Default clinic');
    const userRoleLabel =
        currentUserRole === 'ADMIN' ? 'Admin' : currentUserRole === 'STAFF' ? 'Staff' : 'Clinic';
    const userName = activeClinic.currentUser?.fullName?.trim() || userRoleLabel;
    const navigationItems = getNavigationRoutesForRole(currentUserRole);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
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
                        title={currentRoute.title}
                        userName={userName}
                        userEmail={activeClinic.currentUser?.email}
                        userRole={userRoleLabel}
                        clinicTimezone={activeClinic.clinic?.timezone}
                    />

                    <main id="main-content" className="min-w-0 flex-1 px-3 py-4 sm:px-4 md:px-6 md:py-6">
                        <div className="mx-auto w-full max-w-screen-2xl">
                            <Suspense fallback={<ProtectedRouteLoadingState />}>
                                <Outlet />
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
