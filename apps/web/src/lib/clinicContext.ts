import { ApiClientError } from './apiClient';

const ACTIVE_CLINIC_STORAGE_KEY = 'pravaah.activeClinicId';

const getStoredClinicId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const clinicId = window.localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY)?.trim();

    return clinicId || null;
};

export const getActiveClinicId = (): string => {
    const clinicId = getStoredClinicId() ?? import.meta.env.VITE_DEFAULT_CLINIC_ID?.trim();

    if (!clinicId) {
        throw new ApiClientError({
            code: 'CLINIC_CONTEXT_MISSING',
            message:
                'No active clinic is configured. Set VITE_DEFAULT_CLINIC_ID or store pravaah.activeClinicId.',
        });
    }

    return clinicId;
};

export { ACTIVE_CLINIC_STORAGE_KEY };
