import { apiClient } from '../../lib';
import type {
    AppointmentStatus,
    BookingSource,
    DoctorSummary,
    PatientSummary,
    QueueStatus,
    RiskLevel,
} from '../../types';

export type QueueNoShowPrediction = {
    id?: string;
    riskLevel: RiskLevel;
    score?: number;
    riskScore?: number;
    reasons: unknown[];
    suggestedActions?: string[];
    modelVersion?: string;
    generatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type QueueAppointmentSummary = {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason?: string | null;
    notes?: string | null;
};

export type QueueListItem = {
    id: string;
    clinicId: string;
    appointmentId: string;
    doctorId: string;
    patientId: string;
    position: number;
    status: QueueStatus;
    queuedAt: string;
    calledAt?: string | null;
    completedAt?: string | null;
    createdAt: string;
    updatedAt: string;
    appointment: QueueAppointmentSummary;
    doctor: Pick<DoctorSummary, 'id' | 'fullName' | 'specialization' | 'qualification'>;
    patient: Pick<PatientSummary, 'id' | 'fullName' | 'phone' | 'email' | 'gender' | 'age'>;
    noShowPrediction?: QueueNoShowPrediction | null;
};

export type QueueListResponseData = {
    queueEntries: QueueListItem[];
};

export type UpdateQueueStatusResponseData = {
    queueEntry: QueueListItem;
};

const getQueueCollectionPath = (clinicId: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/queue`;
};

export const listTodayQueue = (clinicId: string, date: string, signal?: AbortSignal) => {
    return apiClient.get<QueueListResponseData>(getQueueCollectionPath(clinicId), {
        query: {
            date,
        },
        signal,
    });
};

export const updateQueueStatus = (clinicId: string, queueEntryId: string, status: QueueStatus) => {
    return apiClient.patch<UpdateQueueStatusResponseData>(
        `${getQueueCollectionPath(clinicId)}/${encodeURIComponent(queueEntryId)}/status`,
        {
            status,
        }
    );
};
