import { apiClient } from '../../lib';
import type { Gender, PatientSummary } from '../../types';

export type CreatePatientRequest = {
    fullName: string;
    phone: string;
    email?: string;
    gender?: Gender;
    dateOfBirth?: string;
    age?: number;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    notes?: string;
};

export type UpdatePatientRequest = {
    fullName?: string;
    phone?: string;
    email?: string | null;
    gender?: Gender | null;
    dateOfBirth?: string | null;
    age?: number | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
    emergencyContactName?: string | null;
    emergencyContactPhone?: string | null;
    notes?: string | null;
};

export type CreatePatientResponseData = {
    patient: PatientSummary;
};

export type UpdatePatientResponseData = {
    patient: PatientSummary;
};

type PatientClinicListItem = {
    id: string;
    patientId: string;
    clinicId: string;
    totalAppointments: number;
    totalCompletedVisits: number;
    totalNoShows: number;
    totalLateArrivals: number;
    lastVisitAt?: string | null;
    isActive: boolean;
    patient: Pick<
        PatientSummary,
        'id' | 'fullName' | 'phone' | 'email' | 'gender' | 'isActive' | 'createdAt' | 'updatedAt'
    >;
};

type PatientListApiResponseData = {
    patients: PatientClinicListItem[];
    pagination: { page: number; limit: number; hasNextPage: boolean };
};

export type PatientListResponseData = {
    patients: PatientSummary[];
    pagination: PatientListApiResponseData['pagination'];
};

export type PatientListFilters = {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
};

const getPatientCollectionPath = (clinicId: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/patients`;
};

const toPatientSummary = (patientLink: PatientClinicListItem): PatientSummary => {
    return {
        ...patientLink.patient,
        patientClinicId: patientLink.id,
        clinicLinkIsActive: patientLink.isActive,
        totalAppointments: patientLink.totalAppointments,
        totalCompletedVisits: patientLink.totalCompletedVisits,
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
                isActive: filters.isActive === undefined ? undefined : String(filters.isActive),
                page: String(filters.page ?? 1),
                limit: String(filters.limit ?? 20),
            },
            signal,
        }
    );

    return {
        patients: data.patients.map(toPatientSummary),
        pagination: data.pagination,
    };
};

export const createPatient = (clinicId: string, payload: CreatePatientRequest) => {
    return apiClient.post<CreatePatientResponseData>(getPatientCollectionPath(clinicId), payload);
};

export const updatePatient = (
    clinicId: string,
    patientId: string,
    payload: UpdatePatientRequest
) => {
    return apiClient.patch<UpdatePatientResponseData>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}`,
        payload
    );
};

export type PatientLifecycleImpact = {
    futureAppointments: number;
    activeAppointments: number;
    activeQueueEntries: number;
};

type PatientClinicDetail = Pick<
    PatientClinicListItem,
    | 'id'
    | 'isActive'
    | 'totalAppointments'
    | 'totalCompletedVisits'
    | 'totalNoShows'
    | 'totalLateArrivals'
    | 'lastVisitAt'
> & {
    notes?: string | null;
    distanceFromClinicKm?: number | string | null;
    estimatedTravelTimeMinutes?: number | null;
    routingStatus?: PatientSummary['routingStatus'];
    routingProvider?: PatientSummary['routingProvider'];
    routingMode?: PatientSummary['routingMode'];
    routingTrafficModel?: PatientSummary['routingTrafficModel'];
    routedAt?: string | null;
};

export const getPatient = async (clinicId: string, patientId: string, signal?: AbortSignal) => {
    const data = await apiClient.get<{
        patient: PatientSummary & { patientClinics?: PatientClinicDetail[] };
    }>(`${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}`, { signal });
    const { patientClinics, ...patient } = data.patient;
    const link = patientClinics?.[0];
    return {
        patient: link
            ? {
                  ...patient,
                  patientClinicId: link.id,
                  clinicLinkIsActive: link.isActive,
                  notes: link.notes,
                  distanceFromClinicKm: link.distanceFromClinicKm,
                  estimatedTravelTimeMinutes: link.estimatedTravelTimeMinutes,
                  routingStatus: link.routingStatus,
                  routingProvider: link.routingProvider,
                  routingMode: link.routingMode,
                  routingTrafficModel: link.routingTrafficModel,
                  routedAt: link.routedAt,
                  totalAppointments: link.totalAppointments,
                  totalCompletedVisits: link.totalCompletedVisits,
                  totalNoShows: link.totalNoShows,
                  totalLateArrivals: link.totalLateArrivals,
                  lastVisitAt: link.lastVisitAt,
              }
            : patient,
    };
};

export const getPatientLifecycleImpact = (clinicId: string, patientId: string) =>
    apiClient.get<{ patient: PatientSummary; impact: PatientLifecycleImpact }>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}/lifecycle-impact`
    );

export const archivePatient = (clinicId: string, patientId: string) =>
    apiClient.delete<{ patient: PatientSummary }>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}`
    );

export const restorePatient = (clinicId: string, patientId: string) =>
    apiClient.post<{ patient: PatientSummary }>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}/restore`,
        {}
    );

export const retryPatientGeocoding = (clinicId: string, patientId: string) => {
    return apiClient.post<UpdatePatientResponseData>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}/geocode`,
        {}
    );
};

export const retryPatientRouting = (clinicId: string, patientId: string) => {
    return apiClient.post<UpdatePatientResponseData>(
        `${getPatientCollectionPath(clinicId)}/${encodeURIComponent(patientId)}/route`,
        {}
    );
};
