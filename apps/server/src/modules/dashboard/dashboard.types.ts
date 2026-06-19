import type { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import type {
    DashboardClinicIdParamsSchemaInput,
    DashboardSummaryQuerySchemaInput,
} from './dashboard.validation.js';

export type DashboardClinicIdParamsInput = DashboardClinicIdParamsSchemaInput;

export type DashboardSummaryQueryInput = DashboardSummaryQuerySchemaInput;

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
