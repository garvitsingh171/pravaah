import { apiClient } from '../../lib';
import type { UserRole, UserStatus } from '../../types';

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

export type CurrentUserResponseData = {
    user: CurrentUserProfile;
};

type GetCurrentUserOptions = {
    authToken?: () => string | null | undefined | Promise<string | null | undefined>;
    signal?: AbortSignal;
};

export const getCurrentUserProfile = ({ authToken, signal }: GetCurrentUserOptions = {}) => {
    return apiClient.get<CurrentUserResponseData>('/auth/me', {
        authToken,
        signal,
    });
};
