import { apiClient } from '../../lib';

export type ClinicSettings = {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    email: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string;
    pincode: string | null;
    timezone: string;
    openingTime: string;
    closingTime: string;
    slotDurationMinutes: number;
    bufferMinutes: number;
    createdAt: string;
    updatedAt: string;
};

export type ClinicSettingsResponseData = {
    clinic: ClinicSettings;
};

export type UpdateClinicSettingsRequest = Partial<{
    name: string;
    phone: string | null;
    email: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    country: string;
    pincode: string | null;
    timezone: string;
    openingTime: string;
    closingTime: string;
    slotDurationMinutes: number;
    bufferMinutes: number;
}>;

export const getClinicSettings = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<ClinicSettingsResponseData>(`/clinics/${clinicId}`, { signal });
};

export const updateClinicSettings = (
    clinicId: string,
    payload: UpdateClinicSettingsRequest
) => {
    return apiClient.patch<ClinicSettingsResponseData>(`/clinics/${clinicId}`, payload);
};
