import { OnboardingNextStep, OnboardingStatus } from '../../features/onboarding/onboardingApi';
import type {
    OnboardingStatusResponseData,
    SetupStatusSummary,
} from '../../features/onboarding/onboardingApi';
import { UserRole, UserStatus } from '../../types';

export const testClinicId = '11111111-1111-4111-8111-111111111111';
export const testClinic = {
    id: testClinicId,
    name: 'Pravaah Test Clinic',
    slug: 'pravaah-test-clinic',
};

export const setupNoneComplete: SetupStatusSummary = {
    clinicSettingsComplete: false,
    hasDoctor: false,
    hasPatient: false,
    hasAppointment: false,
};

export const setupOneComplete: SetupStatusSummary = {
    clinicSettingsComplete: true,
    hasDoctor: false,
    hasPatient: false,
    hasAppointment: false,
};

export const setupPartiallyComplete: SetupStatusSummary = {
    clinicSettingsComplete: true,
    hasDoctor: true,
    hasPatient: false,
    hasAppointment: false,
};

export const setupAllComplete: SetupStatusSummary = {
    clinicSettingsComplete: true,
    hasDoctor: true,
    hasPatient: true,
    hasAppointment: true,
};

export const onboardingNotStarted: OnboardingStatusResponseData = {
    onboarding: {
        status: OnboardingStatus.NOT_STARTED,
        nextStep: OnboardingNextStep.CREATE_CLINIC,
        isComplete: false,
    },
    user: null,
    clinic: null,
    setup: null,
};

export const completedAdminOnboarding: OnboardingStatusResponseData = {
    onboarding: {
        status: OnboardingStatus.COMPLETED,
        nextStep: OnboardingNextStep.OPEN_APPLICATION,
        isComplete: true,
    },
    user: {
        id: 'admin-user-id',
        fullName: 'Test Admin',
        email: 'admin+test@pravaah.local',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    clinic: testClinic,
    setup: setupOneComplete,
};

export const completedStaffOnboarding: OnboardingStatusResponseData = {
    onboarding: {
        status: OnboardingStatus.COMPLETED,
        nextStep: OnboardingNextStep.OPEN_APPLICATION,
        isComplete: true,
    },
    user: {
        id: 'staff-user-id',
        fullName: 'Test Staff',
        email: 'staff+test@pravaah.local',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
    },
    clinic: testClinic,
    setup: null,
};

export const recoveryRequiredOnboarding: OnboardingStatusResponseData = {
    onboarding: {
        status: OnboardingStatus.RECOVERY_REQUIRED,
        nextStep: OnboardingNextStep.RECOVER_ACCOUNT,
        isComplete: false,
    },
    user: {
        id: 'recovery-user-id',
        fullName: 'Recovery User',
        email: 'recovery+test@pravaah.local',
        role: UserRole.ADMIN,
        status: UserStatus.SUSPENDED,
    },
    clinic: null,
    setup: null,
};
