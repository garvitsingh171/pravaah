import type { UserRole, UserStatus } from '../../generated/prisma/client.js';

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
