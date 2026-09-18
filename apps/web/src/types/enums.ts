export const UserRole = {
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
    INVITED: 'INVITED',
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AppointmentStatus = {
    SCHEDULED: 'SCHEDULED',
    CONFIRMED: 'CONFIRMED',
    ARRIVED: 'ARRIVED',
    IN_QUEUE: 'IN_QUEUE',
    CALLED: 'CALLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AppointmentCancellationReason = {
    PATIENT_REQUEST: 'PATIENT_REQUEST',
    PATIENT_ILLNESS: 'PATIENT_ILLNESS',
    PATIENT_EMERGENCY: 'PATIENT_EMERGENCY',
    DOCTOR_UNAVAILABLE: 'DOCTOR_UNAVAILABLE',
    CLINIC_REQUEST: 'CLINIC_REQUEST',
    SCHEDULING_CONFLICT: 'SCHEDULING_CONFLICT',
    TRANSPORTATION_ISSUE: 'TRANSPORTATION_ISSUE',
    DUPLICATE_BOOKING: 'DUPLICATE_BOOKING',
    RESCHEDULED_ELSEWHERE: 'RESCHEDULED_ELSEWHERE',
    OTHER: 'OTHER',
} as const;

export type AppointmentCancellationReason =
    (typeof AppointmentCancellationReason)[keyof typeof AppointmentCancellationReason];

export const AppointmentNoShowReason = {
    FORGOT_APPOINTMENT: 'FORGOT_APPOINTMENT',
    UNREACHABLE: 'UNREACHABLE',
    TRANSPORTATION_ISSUE: 'TRANSPORTATION_ISSUE',
    PATIENT_EMERGENCY: 'PATIENT_EMERGENCY',
    SCHEDULING_MISUNDERSTANDING: 'SCHEDULING_MISUNDERSTANDING',
    NO_CONFIRMATION: 'NO_CONFIRMATION',
    OTHER: 'OTHER',
    UNKNOWN: 'UNKNOWN',
} as const;

export type AppointmentNoShowReason =
    (typeof AppointmentNoShowReason)[keyof typeof AppointmentNoShowReason];

export const QueueStatus = {
    WAITING: 'WAITING',
    ARRIVED: 'ARRIVED',
    CALLED: 'CALLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
} as const;

export type QueueStatus = (typeof QueueStatus)[keyof typeof QueueStatus];

export const RiskLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const BookingSource = {
    RECEPTION: 'RECEPTION',
    PHONE: 'PHONE',
    WEB: 'WEB',
    WALK_IN: 'WALK_IN',
} as const;

export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const AppointmentActivityType = {
    APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
    APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
    PATIENT_ARRIVED: 'PATIENT_ARRIVED',
    ENTERED_QUEUE: 'ENTERED_QUEUE',
    PATIENT_CALLED: 'PATIENT_CALLED',
    APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
    APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
    APPOINTMENT_NO_SHOW: 'APPOINTMENT_NO_SHOW',
    APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
} as const;

export type AppointmentActivityType =
    (typeof AppointmentActivityType)[keyof typeof AppointmentActivityType];

export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
    PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export const Weekday = {
    MONDAY: 'MONDAY',
    TUESDAY: 'TUESDAY',
    WEDNESDAY: 'WEDNESDAY',
    THURSDAY: 'THURSDAY',
    FRIDAY: 'FRIDAY',
    SATURDAY: 'SATURDAY',
    SUNDAY: 'SUNDAY',
} as const;

export type Weekday = (typeof Weekday)[keyof typeof Weekday];
