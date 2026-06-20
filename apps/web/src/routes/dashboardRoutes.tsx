import type { ReactNode } from 'react';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import ClinicSettingsPage from '../features/clinics/ClinicSettingsPage';
import DashboardOverviewPage from '../features/dashboard/DashboardOverviewPage';
import DoctorsPage from '../features/doctors/DoctorsPage';
import PatientsPage from '../features/patients/PatientsPage';
import QueuePage from '../features/queues/QueuePage';
import NotFoundPage from './NotFoundPage';

export type AppRoute = {
    path: string;
    title: string;
    element: ReactNode;
    showInNavigation: boolean;
};

export const dashboardRoutes: AppRoute[] = [
    {
        path: '/dashboard',
        title: 'Dashboard',
        element: <DashboardOverviewPage />,
        showInNavigation: true,
    },
    {
        path: '/doctors',
        title: 'Doctors',
        element: <DoctorsPage />,
        showInNavigation: true,
    },
    {
        path: '/patients',
        title: 'Patients',
        element: <PatientsPage />,
        showInNavigation: true,
    },
    {
        path: '/appointments',
        title: 'Appointments',
        element: <AppointmentsPage />,
        showInNavigation: true,
    },
    {
        path: '/queue',
        title: 'Queue',
        element: <QueuePage />,
        showInNavigation: true,
    },
    {
        path: '/clinic-settings',
        title: 'Clinic Settings',
        element: <ClinicSettingsPage />,
        showInNavigation: true,
    },
];

const notFoundRoute: AppRoute = {
    path: '*',
    title: 'Page Not Found',
    element: <NotFoundPage />,
    showInNavigation: false,
};

export const navigationRoutes = dashboardRoutes.filter((route) => route.showInNavigation);

export const defaultDashboardPath = '/dashboard';

export const normalizeRoutePath = (path: string): string => {
    if (path === '/') {
        return defaultDashboardPath;
    }

    return path.replace(/\/+$/, '') || defaultDashboardPath;
};

export const getRouteForPath = (path: string): AppRoute => {
    const normalizedPath = normalizeRoutePath(path);

    return dashboardRoutes.find((route) => route.path === normalizedPath) ?? notFoundRoute;
};
