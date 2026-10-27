import { apiClient } from '../../lib';
import type {
    AppointmentStatus,
    BookingSource,
    DoctorSummary,
    PatientSummary,
    PredictionGenerationSource,
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

export type DashboardPatientDetails = Pick<PatientSummary, 'id' | 'fullName' | 'phone' | 'email'>;

export type DashboardNoShowPrediction = {
    id?: string;
    riskLevel: RiskLevel;
    score?: number;
    riskScore?: number;
    reasons: unknown[];
    suggestedActions?: unknown;
    ruleVersion?: string | null;
    featureSchemaVersion?: string | null;
    generationSource?: PredictionGenerationSource | null;
    modelVersion?: string | null;
    generatedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    predictionContext?: { distanceFromClinicKm: number | null };
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
    hasMoreHighRisk?: boolean;
};

export type TodayActivityResponseData = {
    clinicId: string;
    date: string;
    activityItems: DashboardActivityItem[];
};

export type NoShowIntelligence = {
    clinicId: string;
    from: string;
    to: string;
    totalUpcoming: number;
    riskCounts: DashboardNoShowRiskSummary & { unavailable: number };
    contributingFactors: Array<{
        code: string;
        label: string;
        appointmentCount: number;
        direction: 'increases' | 'decreases' | 'mixed' | 'neutral';
        averageScoreImpact: number | null;
    }>;
    highRiskAppointments: DashboardHighRiskAppointment[];
};

export type NoShowIntelligenceResponseData = { noShowIntelligence: NoShowIntelligence };

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

export const getNoShowIntelligence = (
    clinicId: string,
    from: string,
    to: string,
    signal?: AbortSignal
) => {
    return apiClient.get<NoShowIntelligenceResponseData>(
        getDashboardPath(clinicId, 'no-show-intelligence'),
        { query: { from, to }, signal }
    );
};
