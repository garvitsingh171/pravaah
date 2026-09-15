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

export type AvailableAppointmentSlot = {
    scheduledAt: string;
    endsAt: string;
    localDate: string;
    localStartTime: string;
    localEndTime: string;
};

export type AvailableAppointmentSlotsFilters = {
    doctorId: string;
    date: string;
    durationMinutes: number;
};

export type AvailableAppointmentSlotsResponseData = {
    clinicId: string;
    doctorId: string;
    date: string;
    timezone: string;
    durationMinutes: number;
    slotDurationMinutes: number;
    bufferMinutes: number;
    slots: AvailableAppointmentSlot[];
};

export type RescheduleAppointmentSlotsResponseData = {
    availability: AvailableAppointmentSlotsResponseData & {
        appointmentId: string;
        currentScheduledAt: string;
    };
};

export type RescheduleAppointmentRequest = {
    scheduledAt: string;
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

export type RescheduleAppointmentResponseData = {
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

export const listAvailableAppointmentSlots = (
    clinicId: string,
    filters: AvailableAppointmentSlotsFilters,
    signal?: AbortSignal
) => {
    return apiClient.get<AvailableAppointmentSlotsResponseData>(
        `${getAppointmentCollectionPath(clinicId)}/available-slots`,
        {
            query: {
                doctorId: filters.doctorId,
                date: filters.date,
                durationMinutes: String(filters.durationMinutes),
            },
            signal,
        }
    );
};

export const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus) => {
    return apiClient.patch<UpdateAppointmentStatusResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/status`,
        {
            status,
        }
    );
};

export const listAppointmentRescheduleSlots = (
    appointmentId: string,
    date: string,
    signal?: AbortSignal
) => {
    return apiClient.get<RescheduleAppointmentSlotsResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/reschedule-slots`,
        {
            query: {
                date,
            },
            signal,
        }
    );
};

export const rescheduleAppointment = (
    appointmentId: string,
    payload: RescheduleAppointmentRequest
) => {
    return apiClient.patch<RescheduleAppointmentResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
        payload
    );
};
