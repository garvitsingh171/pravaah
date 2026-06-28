import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import { getRouteForPath, navigationRoutes } from '../routes/dashboardRoutes';

function AppLayout() {
    const location = useLocation();
    const currentRoute = getRouteForPath(location.pathname);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="flex min-h-screen flex-col md:flex-row">
                <Sidebar navigationItems={navigationRoutes} />

                <div className="flex min-h-screen flex-1 flex-col">
                    <Topbar title={currentRoute.title} userContext="Clinic Admin/Staff" />

                    <main className="flex-1 p-4 md:p-6">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AppLayout;
