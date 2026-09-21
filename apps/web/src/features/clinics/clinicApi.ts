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
    latitude: number | null;
    longitude: number | null;
    geocodingStatus: 'NOT_GEOCODED' | 'GEOCODED' | 'FAILED';
    geocodingProvider: 'GEOAPIFY' | null;
    geocodingConfidence: number | null;
    geocodingResultType: string | null;
    geocodedAddress: string | null;
    geocodedAt: string | null;
    timezone: string;
    openingTime: string;
    closingTime: string;
    slotDurationMinutes: number;
    bufferMinutes: number;
    lateArrivalGraceMinutes: number;
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
    lateArrivalGraceMinutes: number;
}>;

export const getClinicSettings = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<ClinicSettingsResponseData>(`/clinics/${encodeURIComponent(clinicId)}`, {
        signal,
    });
};

export const updateClinicSettings = (clinicId: string, payload: UpdateClinicSettingsRequest) => {
    return apiClient.patch<ClinicSettingsResponseData>(
        `/clinics/${encodeURIComponent(clinicId)}`,
        payload
    );
};

export const retryClinicGeocoding = (clinicId: string) => {
    return apiClient.post<ClinicSettingsResponseData>(
        `/clinics/${encodeURIComponent(clinicId)}/geocode`,
        {}
    );
};
