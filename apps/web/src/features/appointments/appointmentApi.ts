import { apiClient } from '../../lib';
import type { AppointmentSummary, BookingSource, QueueEntrySummary, RiskLevel } from '../../types';

export type CreateAppointmentRequest = {
    doctorId: string;
    patientId: string;
    scheduledAt: string;
    durationMinutes: number;
    reason?: string;
    notes?: string;
    bookingSource: BookingSource;
};

export type AppointmentNoShowPrediction = {
    id?: string;
    riskLevel: RiskLevel;
    reasons: unknown[];
    createdAt?: string;
    updatedAt?: string;
};

export type CreateAppointmentResponseData = {
    appointment: Omit<AppointmentSummary, 'reason'> & {
        reason?: string | null;
        notes?: string | null;
        noShowPrediction?: AppointmentNoShowPrediction | null;
    };
    queueEntry: QueueEntrySummary;
    noShowPrediction: AppointmentNoShowPrediction | null;
};

const getAppointmentCollectionPath = (clinicId: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/appointments`;
};

export const createAppointment = (clinicId: string, payload: CreateAppointmentRequest) => {
    return apiClient.post<CreateAppointmentResponseData>(
        getAppointmentCollectionPath(clinicId),
        payload
    );
};
