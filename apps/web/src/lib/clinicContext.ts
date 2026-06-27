import { ApiClientError } from './apiClient';

export type ActiveClinicSource = 'localStorage' | 'authenticatedUser' | 'environment';

export type ActiveClinicContext = {
    clinicId: string;
    source: ActiveClinicSource;
};

export type ActiveClinicCurrentUser = {
    clinicId?: string | null;
    clinic?: {
        id: string;
        isActive: boolean;
    } | null;
};

type ClinicIdReadResult = {
    present: boolean;
    valid: boolean;
    clinicId: string | null;
};

type StoredClinicIdReadResult = ClinicIdReadResult & {
    clearedInvalidValue: boolean;
};

type AuthenticatedUserClinicReadResult = ClinicIdReadResult & {
    hasClinicSummary: boolean;
    clinicIsActive: boolean;
    clinicMatchesUser: boolean;
};

export type ActiveClinicResolution = {
    activeClinic: ActiveClinicContext | null;
    sources: {
        authenticatedUser: AuthenticatedUserClinicReadResult;
        localStorage: StoredClinicIdReadResult;
        environment: ClinicIdReadResult;
    };
};

export const ACTIVE_CLINIC_STORAGE_KEY = 'pravaah.activeClinicId';
export const ACTIVE_CLINIC_MISSING_ERROR_CODE = 'CLINIC_CONTEXT_MISSING';
export const ACTIVE_CLINIC_MISSING_MESSAGE =
    'Active clinic is not configured. Set VITE_DEFAULT_CLINIC_ID or choose an active clinic.';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidClinicId = (clinicId: string): boolean => {
    return uuidRegex.test(clinicId);
};

const readDefaultClinicId = (): ClinicIdReadResult => {
    const clinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID?.trim();

    if (!clinicId) {
        return {
            present: false,
            valid: false,
            clinicId: null,
        };
    }

    return {
        present: true,
        valid: isValidClinicId(clinicId),
        clinicId: isValidClinicId(clinicId) ? clinicId : null,
    };
};

const readStoredClinicId = (): StoredClinicIdReadResult => {
    if (typeof window === 'undefined') {
        return {
            present: false,
            valid: false,
            clinicId: null,
            clearedInvalidValue: false,
        };
    }

    try {
        const clinicId = window.localStorage.getItem(ACTIVE_CLINIC_STORAGE_KEY)?.trim();

        if (!clinicId) {
            return {
                present: false,
                valid: false,
                clinicId: null,
                clearedInvalidValue: false,
            };
        }

        if (!isValidClinicId(clinicId)) {
            window.localStorage.removeItem(ACTIVE_CLINIC_STORAGE_KEY);
            return {
                present: true,
                valid: false,
                clinicId: null,
                clearedInvalidValue: true,
            };
        }

        return {
            present: true,
            valid: true,
            clinicId,
            clearedInvalidValue: false,
        };
    } catch {
        return {
            present: false,
            valid: false,
            clinicId: null,
            clearedInvalidValue: false,
        };
    }
};

const readAuthenticatedUserClinicId = (
    currentUser?: ActiveClinicCurrentUser | null
): AuthenticatedUserClinicReadResult => {
    const clinicId = currentUser?.clinicId?.trim();
    const clinicIdIsValid = clinicId ? isValidClinicId(clinicId) : false;
    const clinic = currentUser?.clinic;
    const hasClinicSummary = Boolean(clinic);
    const clinicIsActive = clinic?.isActive === true;
    const clinicMatchesUser = Boolean(clinicId && clinic?.id === clinicId);

    if (!clinicId || !clinicIdIsValid) {
        return {
            present: Boolean(clinicId),
            valid: false,
            clinicId: null,
            hasClinicSummary,
            clinicIsActive,
            clinicMatchesUser,
        };
    }

    if (!hasClinicSummary || !clinicMatchesUser || !clinicIsActive) {
        return {
            present: true,
            valid: false,
            clinicId: null,
            hasClinicSummary,
            clinicIsActive,
            clinicMatchesUser,
        };
    }

    return {
        present: true,
        valid: true,
        clinicId,
        hasClinicSummary,
        clinicIsActive,
        clinicMatchesUser,
    };
};

export const resolveActiveClinicContext = (
    currentUser?: ActiveClinicCurrentUser | null
): ActiveClinicResolution => {
    const hasAuthenticatedProfile = currentUser !== undefined && currentUser !== null;
    const authenticatedUserClinic = readAuthenticatedUserClinicId(currentUser);
    const storedClinic = readStoredClinicId();
    const environmentClinic = readDefaultClinicId();

    if (authenticatedUserClinic.clinicId) {
        return {
            activeClinic: {
                clinicId: authenticatedUserClinic.clinicId,
                source: 'authenticatedUser',
            },
            sources: {
                authenticatedUser: authenticatedUserClinic,
                localStorage: storedClinic,
                environment: environmentClinic,
            },
        };
    }

    if (hasAuthenticatedProfile) {
        return {
            activeClinic: null,
            sources: {
                authenticatedUser: authenticatedUserClinic,
                localStorage: storedClinic,
                environment: environmentClinic,
            },
        };
    }

    if (storedClinic.clinicId) {
        return {
            activeClinic: {
                clinicId: storedClinic.clinicId,
                source: 'localStorage',
            },
            sources: {
                authenticatedUser: authenticatedUserClinic,
                localStorage: storedClinic,
                environment: environmentClinic,
            },
        };
    }

    if (environmentClinic.clinicId) {
        return {
            activeClinic: {
                clinicId: environmentClinic.clinicId,
                source: 'environment',
            },
            sources: {
                authenticatedUser: authenticatedUserClinic,
                localStorage: storedClinic,
                environment: environmentClinic,
            },
        };
    }

    return {
        activeClinic: null,
        sources: {
            authenticatedUser: authenticatedUserClinic,
            localStorage: storedClinic,
            environment: environmentClinic,
        },
    };
};

export const getActiveClinicContext = (
    currentUser?: ActiveClinicCurrentUser | null
): ActiveClinicContext | null => {
    return resolveActiveClinicContext(currentUser).activeClinic;
};

export const getActiveClinicId = (currentUser?: ActiveClinicCurrentUser | null): string => {
    const activeClinic = getActiveClinicContext(currentUser);

    if (!activeClinic) {
        throw new ApiClientError({
            code: ACTIVE_CLINIC_MISSING_ERROR_CODE,
            message: ACTIVE_CLINIC_MISSING_MESSAGE,
        });
    }

    return activeClinic.clinicId;
};
