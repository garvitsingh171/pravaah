import { appRoutePaths } from '../../../routes/dashboardRoutes';
import type { SetupStatusSummary } from '../onboardingApi';

export type SetupChecklistItem = {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    actionLabel: string;
    actionPath: string;
    blockedReason?: string;
};

export const totalChecklistSteps = 4;

export const buildSetupChecklistItems = (setup: SetupStatusSummary): SetupChecklistItem[] => [
    {
        id: 'clinic-settings',
        title: 'Complete clinic settings',
        description: 'Confirm the clinic profile, working hours, slot duration, and buffer time.',
        completed: setup.clinicSettingsComplete,
        actionLabel: 'Complete clinic settings',
        actionPath: appRoutePaths.clinicSettings,
    },
    {
        id: 'doctor',
        title: 'Add the first doctor',
        description: 'Create a doctor record so appointments can be booked against a provider.',
        completed: setup.hasDoctor,
        actionLabel: 'Add doctor',
        actionPath: appRoutePaths.newDoctor,
    },
    {
        id: 'patient',
        title: 'Add the first patient',
        description: 'Create a patient record for the first clinic visit.',
        completed: setup.hasPatient,
        actionLabel: 'Add patient',
        actionPath: appRoutePaths.newPatient,
    },
    {
        id: 'appointment',
        title: 'Book the first appointment',
        description: 'Book an appointment only after the clinic has a doctor and patient ready.',
        completed: setup.hasAppointment,
        actionLabel: 'Book appointment',
        actionPath: appRoutePaths.appointments,
        blockedReason:
            setup.hasDoctor && setup.hasPatient
                ? undefined
                : 'Add at least one active doctor and patient before booking.',
    },
];
