import { apiClient } from '../../lib';
import type {
    AppointmentStatus,
    BookingSource,
    DoctorSummary,
    PatientSummary,
    RiskLevel,
} from '../../types';

export type DashboardAppointmentSummary = {
    total: number;
    scheduled: number;
    confirmed: number;
    arrived: number;
    inQueue: number;
    called: number;
    completed: number;
    cancelled: number;
    noShow: number;
};

export type DashboardQueueSummary = {
    total: number;
    waiting: number;
    arrived: number;
    called: number;
    completed: number;
    cancelled: number;
    noShow: number;
};

export type DashboardNoShowRiskSummary = {
    low: number;
    medium: number;
    high: number;
};

export type DashboardSummary = {
    clinicId: string;
    date: string;
    appointmentSummary: DashboardAppointmentSummary;
    queueSummary: DashboardQueueSummary;
    noShowRiskSummary: DashboardNoShowRiskSummary;
};

export type DashboardAppointmentDetails = {
    id: string;
    scheduledAt: string;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason?: string | null;
};

export type DashboardDoctorDetails = Pick<
    DoctorSummary,
    'id' | 'fullName' | 'specialization' | 'qualification'
>;

export type DashboardPatientDetails = Pick<
    PatientSummary,
    'id' | 'fullName' | 'phone' | 'email' | 'gender' | 'age'
>;

export type DashboardNoShowPrediction = {
    id?: string;
    riskLevel: RiskLevel;
    reasons: unknown[];
    createdAt?: string;
    updatedAt?: string;
};

export type DashboardHighRiskAppointment = {
    appointment: DashboardAppointmentDetails;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
    noShowPrediction: DashboardNoShowPrediction;
};

export type DashboardActivityType =
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_NO_SHOW'
    | 'QUEUE_JOINED'
    | 'PATIENT_CALLED'
    | 'VISIT_COMPLETED'
    | 'QUEUE_CANCELLED'
    | 'QUEUE_NO_SHOW';

export type DashboardActivityItem = {
    id: string;
    type: DashboardActivityType;
    timestamp: string;
    appointment: DashboardAppointmentDetails;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
};

export type DashboardSummaryResponseData = {
    dashboardSummary: DashboardSummary;
};

export type HighRiskAppointmentsResponseData = {
    clinicId: string;
    date: string;
    highRiskAppointments: DashboardHighRiskAppointment[];
};

export type TodayActivityResponseData = {
    clinicId: string;
    date: string;
    activityItems: DashboardActivityItem[];
};

const getDashboardPath = (clinicId: string, path: string): string => {
    return `/clinics/${encodeURIComponent(clinicId)}/dashboard/${path}`;
};

export const getDashboardSummary = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<DashboardSummaryResponseData>(getDashboardPath(clinicId, 'summary'), {
        signal,
    });
};

export const listHighRiskAppointments = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<HighRiskAppointmentsResponseData>(
        getDashboardPath(clinicId, 'high-risk-appointments'),
        {
            signal,
        }
    );
};

export const listTodayActivity = (clinicId: string, signal?: AbortSignal) => {
    return apiClient.get<TodayActivityResponseData>(getDashboardPath(clinicId, 'today-activity'), {
        signal,
    });
};
