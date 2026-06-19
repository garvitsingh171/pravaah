import type {
    AppointmentStatus,
    BookingSource,
    Gender,
    QueueStatus,
} from '../../generated/prisma/client.js';
import type {
    DashboardClinicIdParamsSchemaInput,
    DashboardSummaryQuerySchemaInput,
    HighRiskAppointmentsQuerySchemaInput,
} from './dashboard.validation.js';

export type DashboardClinicIdParamsInput = DashboardClinicIdParamsSchemaInput;

export type DashboardSummaryQueryInput = DashboardSummaryQuerySchemaInput;

export type HighRiskAppointmentsQueryInput = HighRiskAppointmentsQuerySchemaInput;

export type AppointmentStatusCount = {
    status: AppointmentStatus;
    _count: {
        status: number;
    };
};

export type QueueStatusCount = {
    status: QueueStatus;
    _count: {
        status: number;
    };
};

export type AppointmentRiskSource = {
    patientId: string;
    scheduledAt: Date;
    createdAt: Date;
};

export type PatientStatusCount = {
    patientId: string;
    status: AppointmentStatus;
    _count: {
        status: number;
    };
};

export type ClinicDateRange = {
    start: Date;
    end: Date;
};

export type DashboardAppointmentDetails = {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason: string | null;
};

export type DashboardDoctorDetails = {
    id: string;
    fullName: string;
    specialization: string | null;
    qualification: string | null;
};

export type DashboardPatientDetails = {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    gender: Gender | null;
    age: number | null;
};

export type HighRiskAppointmentCandidate = AppointmentRiskSource & {
    id: string;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason: string | null;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
};

export type DashboardHighRiskAppointment = {
    appointment: DashboardAppointmentDetails;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
    prediction: {
        riskLevel: 'HIGH';
        reasons: string[];
    };
};

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

export type DashboardActivityType =
    | 'APPOINTMENT_BOOKED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_NO_SHOW'
    | 'QUEUE_JOINED'
    | 'PATIENT_CALLED'
    | 'VISIT_COMPLETED'
    | 'QUEUE_CANCELLED'
    | 'QUEUE_NO_SHOW';

export type DashboardActivityAppointmentSource = {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason: string | null;
    createdAt: Date;
    updatedAt: Date;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
};

export type DashboardActivityQueueSource = {
    id: string;
    position: number;
    status: QueueStatus;
    queuedAt: Date;
    calledAt: Date | null;
    completedAt: Date | null;
    updatedAt: Date;
    appointment: DashboardAppointmentDetails;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
};

export type DashboardActivityItem = {
    id: string;
    type: DashboardActivityType;
    timestamp: Date;
    appointment: DashboardAppointmentDetails;
    doctor: DashboardDoctorDetails;
    patient: DashboardPatientDetails;
};
