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

export type AppointmentStatus =
    (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const QueueStatus = {
    WAITING: 'WAITING',
    ARRIVED: 'ARRIVED',
    CALLED: 'CALLED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
} as const;

export type QueueStatus =
    (typeof QueueStatus)[keyof typeof QueueStatus];

export const RiskLevel = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
} as const;

export type RiskLevel =
    (typeof RiskLevel)[keyof typeof RiskLevel];

export const BookingSource = {
    RECEPTION: 'RECEPTION',
    PHONE: 'PHONE',
    WEB: 'WEB',
    WALK_IN: 'WALK_IN',
} as const;

export type BookingSource =
    (typeof BookingSource)[keyof typeof BookingSource];