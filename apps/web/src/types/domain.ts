import type {
    AppointmentStatus,
    BookingSource,
    Gender,
    QueueStatus,
    RiskLevel,
    UserRole,
    UserStatus,
} from './enums';

export type BaseEntity = {
    id: string;
    createdAt: string;
    updatedAt: string;
};

export type UserSummary = BaseEntity & {
    clerkUserId: string;
    fullName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
};

export type ClinicSummary = BaseEntity & {
    name: string;
    slug: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    timezone?: string | null;
    isActive: boolean;
};

export type DoctorSummary = BaseEntity & {
    doctorClinicId?: string;
    clinicLinkIsActive?: boolean;
    fullName: string;
    specialization?: string | null;
    qualification?: string | null;
    registrationNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    gender?: Gender | null;
    experienceYears?: number | null;
    isActive: boolean;
};

export type PatientSummary = BaseEntity & {
    fullName: string;
    phone: string;
    email?: string;
    city?: string;
    isActive: boolean;
};

export type AppointmentSummary = BaseEntity & {
    clinicId: string;
    doctorId: string;
    patientId: string;
    scheduledAt: string;
    durationMinutes: number;
    status: AppointmentStatus;
    bookingSource: BookingSource;
    reason?: string;
};

export type AppointmentBookingNoShowPrediction = {
    riskLevel: RiskLevel;
    reasons: string[];
};

export type CreateAppointmentResponseData = {
    appointment: AppointmentSummary;
    noShowPrediction: AppointmentBookingNoShowPrediction;
};

export type QueueEntrySummary = BaseEntity & {
    clinicId: string;
    appointmentId: string;
    doctorId: string;
    patientId: string;
    position: number;
    status: QueueStatus;
    queuedAt: string;
};

export type NoShowPredictionSummary = BaseEntity & {
    appointmentId: string;
    clinicId: string;
    patientId: string;
    riskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
    modelVersion: string;
    generatedAt: string;
};
