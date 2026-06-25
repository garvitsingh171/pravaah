import { ApiClientError } from './apiClient';

export type ActiveClinicSource = 'localStorage' | 'environment';

export type ActiveClinicContext = {
    clinicId: string;
    source: ActiveClinicSource;
};

export const ACTIVE_CLINIC_STORAGE_KEY = 'pravaah.activeClinicId';
export const ACTIVE_CLINIC_MISSING_ERROR_CODE = 'CLINIC_CONTEXT_MISSING';
export const ACTIVE_CLINIC_MISSING_MESSAGE =
    'Active clinic is not configured. Set VITE_DEFAULT_CLINIC_ID or choose an active clinic.';

const getDefaultClinicId = (): string | null => {
    const clinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID?.trim();

    return clinicId || null;
};

const getStoredClinicId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const clinicId = window.localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY)?.trim();

        return clinicId || null;
    } catch {
        return null;
    }
};

export const getActiveClinicContext = (): ActiveClinicContext | null => {
    const storedClinicId = getStoredClinicId();

    if (storedClinicId) {
        return {
            clinicId: storedClinicId,
            source: 'localStorage',
        };
    }

    const defaultClinicId = getDefaultClinicId();

    if (defaultClinicId) {
        return {
            clinicId: defaultClinicId,
            source: 'environment',
        };
    }

    return null;
};

export const getActiveClinicId = (): string => {
    const activeClinic = getActiveClinicContext();

    if (!activeClinic) {
        throw new ApiClientError({
            code: ACTIVE_CLINIC_MISSING_ERROR_CODE,
            message: ACTIVE_CLINIC_MISSING_MESSAGE,
        });
    }

    return activeClinic.clinicId;
};
