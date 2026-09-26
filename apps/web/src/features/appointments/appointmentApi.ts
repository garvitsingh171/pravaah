import { apiClient } from '../../lib';
import {
    AppointmentActivityType,
    AppointmentStatus,
    type AppointmentCancellationReason,
    type AppointmentNoShowReason,
    type AppointmentSummary,
    type BookingSource,
    type DoctorSummary,
    type PatientSummary,
    type QueueEntrySummary,
    type PredictionGenerationSource,
    type RiskLevel,
    type UserRole,
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
    ruleVersion?: string | null;
    featureSchemaVersion?: string | null;
    generationSource?: PredictionGenerationSource;
    modelVersion?: string | null;
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
    currentScheduledAt: string;
};

export type UpdateAppointmentStatusRequest =
    | {
          status: typeof AppointmentStatus.CANCELLED;
          cancellationReason: AppointmentCancellationReason;
          cancellationNote?: string;
      }
    | {
          status: typeof AppointmentStatus.NO_SHOW;
          noShowReason: AppointmentNoShowReason;
          noShowNote?: string;
      }
    | {
          status:
              | typeof AppointmentStatus.SCHEDULED
              | typeof AppointmentStatus.CONFIRMED
              | typeof AppointmentStatus.ARRIVED
              | typeof AppointmentStatus.IN_QUEUE
              | typeof AppointmentStatus.CALLED
              | typeof AppointmentStatus.COMPLETED;
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

type AppointmentActivityActor = {
    id: string;
    fullName: string;
    role: UserRole;
};

type AppointmentCreatedActivityMetadata = {
    scheduledAt: string;
    bookingSource: BookingSource;
    doctorId: string;
    patientId: string;
};

type AppointmentStatusActivityMetadata = {
    fromStatus: AppointmentStatus;
    toStatus: AppointmentStatus;
};

type AppointmentCancelledActivityMetadata = AppointmentStatusActivityMetadata & {
    cancellationReason?: AppointmentCancellationReason | null;
    cancellationNote?: string | null;
};

type AppointmentNoShowActivityMetadata = AppointmentStatusActivityMetadata & {
    noShowReason?: AppointmentNoShowReason | null;
    noShowNote?: string | null;
};

type PatientArrivedActivityMetadata = AppointmentStatusActivityMetadata & {
    arrivalOffsetMinutes: number;
    isLateArrival: boolean;
    lateArrivalGraceMinutes: number;
};

type AppointmentRescheduledActivityMetadata = {
    previousScheduledAt: string;
    newScheduledAt: string;
};

type AppointmentActivityMetadataByType = {
    APPOINTMENT_CREATED: AppointmentCreatedActivityMetadata;
    APPOINTMENT_CONFIRMED: AppointmentStatusActivityMetadata;
    PATIENT_ARRIVED: PatientArrivedActivityMetadata;
    ENTERED_QUEUE: AppointmentStatusActivityMetadata;
    PATIENT_CALLED: AppointmentStatusActivityMetadata;
    APPOINTMENT_COMPLETED: AppointmentStatusActivityMetadata;
    APPOINTMENT_CANCELLED: AppointmentCancelledActivityMetadata;
    APPOINTMENT_NO_SHOW: AppointmentNoShowActivityMetadata;
    APPOINTMENT_RESCHEDULED: AppointmentRescheduledActivityMetadata;
};

type AppointmentActivityBase = {
    id: string;
    occurredAt: string;
    actor: AppointmentActivityActor | null;
};

export type AppointmentActivity = {
    [Type in AppointmentActivityType]: AppointmentActivityBase & {
        type: Type;
        metadata: AppointmentActivityMetadataByType[Type] | null;
    };
}[AppointmentActivityType];

export type AppointmentActivitiesResponseData = {
    activities: AppointmentActivity[];
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

export const updateAppointmentStatus = (
    appointmentId: string,
    payload: UpdateAppointmentStatusRequest
) => {
    return apiClient.patch<UpdateAppointmentStatusResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/status`,
        payload
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

export const listAppointmentActivities = (appointmentId: string, signal?: AbortSignal) => {
    return apiClient.get<AppointmentActivitiesResponseData>(
        `/appointments/${encodeURIComponent(appointmentId)}/activities`,
        { signal }
    );
};
