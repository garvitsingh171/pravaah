import { apiClient } from '../../lib';
import type {
    AppointmentStatus,
    AppointmentSummary,
    BookingSource,
    DoctorSummary,
    PatientSummary,
    QueueEntrySummary,
    RiskLevel,
} from '../../types';

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
    score?: number;
    riskScore?: number;
    reasons: unknown[];
    suggestedActions?: string[];
    modelVersion?: string;
    generatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type AppointmentListItem = Omit<AppointmentSummary, 'reason'> & {
    reason?: string | null;
    notes?: string | null;
    doctor: Pick<DoctorSummary, 'id' | 'fullName' | 'specialization'>;
    patient: Pick<PatientSummary, 'id' | 'fullName' | 'phone' | 'email'>;
    queueEntry?:
        | (Pick<QueueEntrySummary, 'id' | 'position' | 'status' | 'queuedAt'> & {
              calledAt?: string | null;
              completedAt?: string | null;
          })
        | null;
    noShowPrediction?: AppointmentNoShowPrediction | null;
};

export type AppointmentListFilters = {
    date?: string;
    doctorId?: string;
    patientId?: string;
    status?: AppointmentStatus;
};

export type AppointmentListResponseData = {
    appointments: AppointmentListItem[];
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

export type UpdateAppointmentStatusResponseData = {
    appointment: AppointmentListItem;
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

export const listAppointments = (
    clinicId: string,
    filters: AppointmentListFilters,
    signal?: AbortSignal
) => {
    return apiClient.get<AppointmentListResponseData>(getAppointmentCollectionPath(clinicId), {
        query: {
            date: filters.date,
            doctorId: filters.doctorId,
            patientId: filters.patientId,
            status: filters.status,
        },
        signal,
    });
};

export const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    return apiClient.patch<UpdateAppointmentStatusResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/status`,
        {
            status,
        }
    );
};
