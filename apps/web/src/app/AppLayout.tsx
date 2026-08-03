import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { useActiveClinic } from './activeClinicContext';
import { getNavigationRoutesForRole, getRouteForPath } from '../routes/dashboardRoutes';

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

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
            <div className="flex min-h-screen min-w-0 flex-col md:flex-row">
                <Sidebar
                    navigationItems={getNavigationRoutesForRole(currentUserRole)}
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

                    <main className="min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6">
                        <div className="mx-auto w-full max-w-screen-2xl">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
