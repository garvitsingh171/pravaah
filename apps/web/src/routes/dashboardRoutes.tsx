import type { ReactNode } from 'react';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import ClinicSettingsPage from '../features/clinics/ClinicSettingsPage';
import DashboardOverviewPage from '../features/dashboard/DashboardOverviewPage';
import DoctorCreatePage from '../features/doctors/DoctorCreatePage';
import DoctorsPage from '../features/doctors/DoctorsPage';
import PatientCreatePage from '../features/patients/PatientCreatePage';
import PatientsPage from '../features/patients/PatientsPage';
import QueuePage from '../features/queues/QueuePage';
import { UserRole, type UserRole as UserRoleType } from '../types';
import NotFoundPage from './NotFoundPage';

export type AppRoute = {
    path: string;
    title: string;
    element: ReactNode;
    showInNavigation: boolean;
    allowedRoles?: UserRoleType[];
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
        path: '/doctors/new',
        title: 'Add Doctor',
        element: <DoctorCreatePage />,
        showInNavigation: false,
    },
    {
        path: '/patients',
        title: 'Patients',
        element: <PatientsPage />,
        showInNavigation: true,
    },
    {
        path: '/patients/new',
        title: 'Add Patient',
        element: <PatientCreatePage />,
        showInNavigation: false,
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
        allowedRoles: [UserRole.ADMIN],
    },
];

const notFoundRoute: AppRoute = {
    path: '*',
    title: 'Page Not Found',
    element: <NotFoundPage />,
    showInNavigation: false,
};

export const getNavigationRoutesForRole = (role?: UserRoleType | null): AppRoute[] => {
    return dashboardRoutes.filter((route) => {
        if (!route.showInNavigation) {
            return false;
        }

        if (!route.allowedRoles || !role) {
            return true;
        }

        return route.allowedRoles.includes(role);
    });
};

export const navigationRoutes = getNavigationRoutesForRole();

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
