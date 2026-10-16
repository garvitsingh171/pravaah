import { apiClient } from '../../lib';
import type { DoctorAvailability, DoctorAvailabilityDay, DoctorSummary, Gender } from '../../types';

export type DoctorListResponseData = {
    doctors: DoctorSummary[];
};

export type CreateDoctorRequest = {
    fullName: string;
    specialization?: string;
    qualification?: string;
    registrationNumber?: string;
    phone?: string;
    email?: string;
    gender?: Gender;
    experienceYears?: number;
};

export type UpdateDoctorRequest = {
    fullName?: string;
    specialization?: string | null;
    qualification?: string | null;
    registrationNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: Gender | null;
    experienceYears?: number | null;
};

export type CreateDoctorResponseData = {
    doctor: DoctorSummary;
};

export type UpdateDoctorResponseData = {
    doctor: DoctorSummary;
};

export type DoctorAvailabilityResponseData = {
    availability: DoctorAvailability;
};

export type ReplaceDoctorAvailabilityRequest = {
    days: DoctorAvailabilityDay[];
};

const getDoctorCollectionPath = (clinicId: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/doctors`;
};

export const listDoctors = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<DoctorListResponseData>(getDoctorCollectionPath(clinicId), { signal });
};

export const createDoctor = (clinicId: string, payload: CreateDoctorRequest) => {
    return apiClient.post<CreateDoctorResponseData>(getDoctorCollectionPath(clinicId), payload);
};

export const updateDoctor = (clinicId: string, doctorId: string, payload: UpdateDoctorRequest) => {
    return apiClient.patch<UpdateDoctorResponseData>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}`,
        payload
    );
};

export type LifecycleImpact = {
    futureAppointments: number;
    activeAppointments: number;
    activeQueueEntries: number;
};

export const getDoctor = (clinicId: string, doctorId: string, signal?: AbortSignal) =>
    apiClient.get<{ doctor: DoctorSummary }>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}`,
        { signal }
    );

export const getDoctorLifecycleImpact = (clinicId: string, doctorId: string) =>
    apiClient.get<{ doctor: DoctorSummary; impact: LifecycleImpact }>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}/lifecycle-impact`
    );

export const archiveDoctor = (clinicId: string, doctorId: string) =>
    apiClient.delete<{ doctor: DoctorSummary }>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}`
    );

export const restoreDoctor = (clinicId: string, doctorId: string) =>
    apiClient.post<{ doctor: DoctorSummary }>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}/restore`,
        {}
    );

const getDoctorAvailabilityPath = (clinicId: string, doctorId: string): string => {
    return `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}/availability`;
};

export const getDoctorAvailability = (clinicId: string, doctorId: string, signal?: AbortSignal) => {
    return apiClient.get<DoctorAvailabilityResponseData>(
        getDoctorAvailabilityPath(clinicId, doctorId),
        { signal }
    );
};

export const replaceDoctorAvailability = (
    clinicId: string,
    doctorId: string,
    payload: ReplaceDoctorAvailabilityRequest
) => {
    return apiClient.put<DoctorAvailabilityResponseData>(
        getDoctorAvailabilityPath(clinicId, doctorId),
        payload
    );
};
