import { apiClient } from '../../lib';
import {
    QueueStatus,
    type AppointmentCancellationReason,
    type AppointmentNoShowReason,
    type AppointmentStatus,
    type BookingSource,
    type DoctorSummary,
    type PatientSummary,
    type RiskLevel,
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
    cancellationReason?: AppointmentCancellationReason | null;
    cancellationNote?: string | null;
    noShowReason?: AppointmentNoShowReason | null;
    noShowNote?: string | null;
    arrivedAt?: string | null;
    arrivalOffsetMinutes?: number | null;
    isLateArrival?: boolean | null;
    lateArrivalGraceMinutes?: number | null;
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

export type ReorderQueueRequest = {
    date: string;
    queueEntryIds: string[];
};

export type UpdateQueueStatusRequest =
    | {
          status: typeof QueueStatus.CANCELLED;
          cancellationReason: AppointmentCancellationReason;
          cancellationNote?: string;
      }
    | {
          status: typeof QueueStatus.NO_SHOW;
          noShowReason: AppointmentNoShowReason;
          noShowNote?: string;
      }
    | {
          status:
              | typeof QueueStatus.WAITING
              | typeof QueueStatus.ARRIVED
              | typeof QueueStatus.CALLED
              | typeof QueueStatus.COMPLETED;
      };

export type ReorderQueueResponseData = {
    queueEntries: QueueListItem[];
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

export const updateQueueStatus = (
    clinicId: string,
    queueEntryId: string,
    payload: UpdateQueueStatusRequest
) => {
    return apiClient.patch<UpdateQueueStatusResponseData>(
        `${getQueueCollectionPath(clinicId)}/${encodeURIComponent(queueEntryId)}/status`,
        payload
    );
};

export const reorderQueue = (clinicId: string, payload: ReorderQueueRequest) => {
    return apiClient.patch<ReorderQueueResponseData>(
        `${getQueueCollectionPath(clinicId)}/reorder`,
        payload
    );
};
