import { apiClient } from '../../lib';
import type { DoctorSummary, Gender } from '../../types';

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

export type CreateDoctorResponseData = {
    doctor: DoctorSummary;
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
