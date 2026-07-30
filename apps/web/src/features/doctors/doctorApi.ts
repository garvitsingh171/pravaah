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

export type UpdateDoctorRequest = {
    fullName?: string;
    specialization?: string | null;
    qualification?: string | null;
    registrationNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: Gender | null;
    experienceYears?: number | null;
    isActive?: boolean;
};

export type CreateDoctorResponseData = {
    doctor: DoctorSummary;
};

export type UpdateDoctorResponseData = {
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

export const updateDoctor = (clinicId: string, doctorId: string, payload: UpdateDoctorRequest) => {
    return apiClient.patch<UpdateDoctorResponseData>(
        `${getDoctorCollectionPath(clinicId)}/${encodeURIComponent(doctorId)}`,
        payload
    );
};
