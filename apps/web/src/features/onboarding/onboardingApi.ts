import { apiClient } from '../../lib';
import type { UserRole, UserStatus } from '../../types';

export const OnboardingStatus = {
    NOT_STARTED: 'NOT_STARTED',
    COMPLETED: 'COMPLETED',
    RECOVERY_REQUIRED: 'RECOVERY_REQUIRED',
} as const;

export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const OnboardingNextStep = {
    CREATE_CLINIC: 'CREATE_CLINIC',
    OPEN_APPLICATION: 'OPEN_APPLICATION',
    RECOVER_ACCOUNT: 'RECOVER_ACCOUNT',
} as const;

export type OnboardingNextStep = (typeof OnboardingNextStep)[keyof typeof OnboardingNextStep];

export type OnboardingSummary = {
    status: OnboardingStatus;
    nextStep: OnboardingNextStep;
    isComplete: boolean;
};

export type OnboardingUserSummary = {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
};

export type OnboardingClinicSummary = {
    id: string;
    name: string;
    slug: string;
};

export type SetupStatusSummary = {
    clinicSettingsComplete: boolean;
    hasDoctor: boolean;
    hasPatient: boolean;
    hasAppointment: boolean;
};

export type OnboardingStatusResponseData = {
    onboarding: OnboardingSummary;
    user: OnboardingUserSummary | null;
    clinic: OnboardingClinicSummary | null;
    setup: SetupStatusSummary | null;
};

export type SampleDataProvisioningSummary = {
    doctors: number;
    patients: number;
    appointments: number;
    noShowPredictions: number;
    queueEntries: number;
    todayQueueEntries: number;
    today: string;
};

export type SampleDataProvisioningOutcome = 'CREATED' | 'ALREADY_PROVISIONED';

export type ProvisionSampleDataResponseData = {
    outcome: SampleDataProvisioningOutcome;
    summary: SampleDataProvisioningSummary;
};

export type CreateClinicOnboardingRequest = {
    name: string;
    slug: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    timezone?: string;
    openingTime?: string;
    closingTime?: string;
    slotDurationMinutes?: number;
    bufferMinutes?: number;
};

export const getOnboardingStatus = (signal?: AbortSignal) => {
    return apiClient.get<OnboardingStatusResponseData>('/auth/onboarding-status', { signal });
};

export const createClinicOnboarding = (payload: CreateClinicOnboardingRequest) => {
    return apiClient.post<OnboardingStatusResponseData>('/auth/onboarding/clinic', payload);
};

export const provisionSampleData = (clinicId: string) => {
    return apiClient.post<ProvisionSampleDataResponseData>(
        `/clinics/${encodeURIComponent(clinicId)}/sample-data`,
        {}
    );
};
