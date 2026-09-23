import type {
    AppointmentStatus,
    AppointmentCancellationReason,
    AppointmentNoShowReason,
    BookingSource,
    Gender,
    QueueStatus,
    RiskLevel,
    UserRole,
    UserStatus,
    Weekday,
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
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    geocodingStatus?: 'NOT_GEOCODED' | 'GEOCODED' | 'FAILED';
    geocodingProvider?: 'GEOAPIFY' | null;
    geocodingConfidence?: number | null;
    geocodingResultType?: string | null;
    geocodedAddress?: string | null;
    geocodedAt?: string | null;
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

export type DoctorAvailabilityPeriod = {
    id?: string;
    startTime: string;
    endTime: string;
};

export type DoctorAvailabilityDay = {
    weekday: Weekday;
    periods: DoctorAvailabilityPeriod[];
};

export type DoctorAvailability = {
    doctorId: string;
    doctorClinicId: string;
    clinicId: string;
    timezone: string;
    days: DoctorAvailabilityDay[];
};

export type StructuredAddress = {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    pincode?: string | null;
};

export type PatientSummary = BaseEntity &
    StructuredAddress & {
        patientClinicId?: string;
        clinicLinkIsActive?: boolean;
        fullName: string;
        phone: string;
        email?: string | null;
        gender?: Gender | null;
        dateOfBirth?: string | null;
        age?: number | null;
        /** Transitional DB compatibility field; structured fields are authoritative. */
        address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        geocodingStatus?: 'NOT_GEOCODED' | 'GEOCODED' | 'FAILED';
        geocodingProvider?: 'GEOAPIFY' | null;
        geocodingConfidence?: number | null;
        geocodingResultType?: string | null;
        geocodedAddress?: string | null;
        geocodedAt?: string | null;
        emergencyContactName?: string | null;
        emergencyContactPhone?: string | null;
        notes?: string | null;
        distanceFromClinicKm?: number | string | null;
        estimatedTravelTimeMinutes?: number | null;
        routingStatus?: 'NOT_CALCULATED' | 'CALCULATED' | 'FAILED';
        routingProvider?: 'GEOAPIFY' | null;
        routingMode?: 'DRIVE' | null;
        routingTrafficModel?: 'FREE_FLOW' | null;
        routedAt?: string | null;
        totalAppointments?: number;
        totalCompletedVisits?: number;
        totalNoShows?: number;
        totalLateArrivals?: number;
        lastVisitAt?: string | null;
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
    cancellationReason?: AppointmentCancellationReason | null;
    cancellationNote?: string | null;
    noShowReason?: AppointmentNoShowReason | null;
    noShowNote?: string | null;
    arrivedAt?: string | null;
    arrivalOffsetMinutes?: number | null;
    isLateArrival?: boolean | null;
    lateArrivalGraceMinutes?: number | null;
};

export type AppointmentBookingNoShowPrediction = {
    riskLevel: RiskLevel;
    score?: number;
    riskScore?: number;
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
    score?: number;
    riskScore?: number;
    riskLevel: RiskLevel;
    reasons: string[];
    modelVersion?: string;
    generatedAt?: string;
};
