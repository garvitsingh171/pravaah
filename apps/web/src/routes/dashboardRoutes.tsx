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

export const appRoutePaths = {
    dashboard: '/dashboard',
    doctors: '/doctors',
    newDoctor: '/doctors/new',
    patients: '/patients',
    newPatient: '/patients/new',
    appointments: '/appointments',
    queue: '/queue',
    clinicSettings: '/clinic-settings',
} as const;

export type AppRoute = {
    path: string;
    title: string;
    navigationLabel?: string;
    navigationDescription?: string;
    navigationIcon:
        | 'dashboard'
        | 'doctors'
        | 'patients'
        | 'appointments'
        | 'queue'
        | 'settings';
    element: ReactNode;
    showInNavigation: boolean;
    allowedRoles?: UserRoleType[];
};

export const dashboardRoutes: AppRoute[] = [
    {
        path: appRoutePaths.dashboard,
        title: 'Dashboard',
        navigationLabel: 'Dashboard',
        navigationDescription: 'Daily summary',
        navigationIcon: 'dashboard',
        element: <DashboardOverviewPage />,
        showInNavigation: true,
    },
    {
        path: appRoutePaths.doctors,
        title: 'Doctors',
        navigationLabel: 'Doctors',
        navigationDescription: 'Clinic doctor records',
        navigationIcon: 'doctors',
        element: <DoctorsPage />,
        showInNavigation: true,
    },
    {
        path: appRoutePaths.newDoctor,
        title: 'Add Doctor',
        navigationIcon: 'doctors',
        element: <DoctorCreatePage />,
        showInNavigation: false,
    },
    {
        path: appRoutePaths.patients,
        title: 'Patients',
        navigationLabel: 'Patients',
        navigationDescription: 'Patient records',
        navigationIcon: 'patients',
        element: <PatientsPage />,
        showInNavigation: true,
    },
    {
        path: appRoutePaths.newPatient,
        title: 'Add Patient',
        navigationIcon: 'patients',
        element: <PatientCreatePage />,
        showInNavigation: false,
    },
    {
        path: appRoutePaths.appointments,
        title: 'Appointments',
        navigationLabel: 'Appointments',
        navigationDescription: 'Booking and status',
        navigationIcon: 'appointments',
        element: <AppointmentsPage />,
        showInNavigation: true,
    },
    {
        path: appRoutePaths.queue,
        title: 'Queue',
        navigationLabel: 'Queue',
        navigationDescription: 'Arrivals and calls',
        navigationIcon: 'queue',
        element: <QueuePage />,
        showInNavigation: true,
    },
    {
        path: appRoutePaths.clinicSettings,
        title: 'Clinic Settings',
        navigationLabel: 'Clinic Settings',
        navigationDescription: 'Admin workspace',
        navigationIcon: 'settings',
        element: <ClinicSettingsPage />,
        showInNavigation: true,
        allowedRoles: [UserRole.ADMIN],
    },
];

const notFoundRoute: AppRoute = {
    path: '*',
    title: 'Page Not Found',
    navigationIcon: 'dashboard',
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

export const defaultDashboardPath = appRoutePaths.dashboard;

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
