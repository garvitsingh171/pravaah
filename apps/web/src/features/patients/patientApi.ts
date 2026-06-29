import { apiClient } from '../../lib';
import type { Gender, PatientSummary } from '../../types';

export type CreatePatientRequest = {
    fullName: string;
    phone: string;
    email?: string;
    gender?: Gender;
    dateOfBirth?: string;
    age?: number;
    address?: string;
    city?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    notes?: string;
    distanceFromClinicKm?: number;
};

export type CreatePatientResponseData = {
    patient: PatientSummary;
};

type PatientClinicListItem = {
    id: string;
    patientId: string;
    clinicId: string;
    totalAppointments: number;
    totalNoShows: number;
    totalLateArrivals: number;
    lastVisitAt?: string | null;
    notes?: string | null;
    distanceFromClinicKm?: number | string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    patient: PatientSummary;
};

type PatientListApiResponseData = {
    patients: PatientClinicListItem[];
};

export type PatientListResponseData = {
    patients: PatientSummary[];
};

export type PatientListFilters = {
    search?: string;
};

const getPatientCollectionPath = (clinicId: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/patients`;
};

const toPatientSummary = (patientLink: PatientClinicListItem): PatientSummary => {
    return {
        ...patientLink.patient,
        patientClinicId: patientLink.id,
        clinicLinkIsActive: patientLink.isActive,
        notes: patientLink.notes,
        distanceFromClinicKm: patientLink.distanceFromClinicKm,
        totalAppointments: patientLink.totalAppointments,
        totalNoShows: patientLink.totalNoShows,
        totalLateArrivals: patientLink.totalLateArrivals,
        lastVisitAt: patientLink.lastVisitAt,
    };
};

export const listPatients = async (
    clinicId: string,
    filters: PatientListFilters = {},
    signal?: AbortSignal
): Promise<PatientListResponseData> => {
    const data = await apiClient.get<PatientListApiResponseData>(
        getPatientCollectionPath(clinicId),
        {
            query: {
                search: filters.search,
            },
            signal,
        }
    );

    return {
        patients: data.patients.map(toPatientSummary),
    };
};

export const createPatient = (clinicId: string, payload: CreatePatientRequest) => {
    return apiClient.post<CreatePatientResponseData>(getPatientCollectionPath(clinicId), payload);
};
