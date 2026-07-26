import type { UserRole, UserStatus } from '../../generated/prisma/client.js';
import type { CreateClinicInput } from '../clinics/clinic.types.js';

export type ClerkIdentity = {
    clerkUserId: string;
};

export type AuthenticatedUser = {
    id: string;
    clerkUserId: string;
    role: UserRole;
    status: UserStatus;
    clinicId: string | null;
};

export type CurrentUserClinicSummary = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    timezone: string;
};

export type CurrentUserProfile = {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    clinicId: string | null;
    clinic: CurrentUserClinicSummary | null;
};

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

export type OnboardingStatusResult = {
    onboarding: OnboardingSummary;
    user: OnboardingUserSummary | null;
    clinic: OnboardingClinicSummary | null;
};

export type OnboardingUserRecord = OnboardingUserSummary & {
    clinicId: string | null;
    clinic: (OnboardingClinicSummary & { isActive: boolean }) | null;
};

export type OnboardingClinicInput = CreateClinicInput;

export type TrustedClerkUserIdentity = {
    clerkUserId: string;
    email: string;
    fullName: string;
};

export type ProvisionClinicWithAdminInput = {
    clinic: OnboardingClinicInput;
    admin: TrustedClerkUserIdentity;
};

export type ProvisionClinicWithAdminResult = {
    user: OnboardingUserSummary;
    clinic: OnboardingClinicSummary;
};

export type ClinicOnboardingMutationOutcome = 'CREATED' | 'ALREADY_COMPLETED';

export type ClinicOnboardingMutationResult = {
    outcome: ClinicOnboardingMutationOutcome;
    data: OnboardingStatusResult;
};
