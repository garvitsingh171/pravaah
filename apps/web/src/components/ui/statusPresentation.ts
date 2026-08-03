import {
    AppointmentStatus,
    QueueStatus,
    RiskLevel,
    type AppointmentStatus as AppointmentStatusType,
    type QueueStatus as QueueStatusType,
    type RiskLevel as RiskLevelType,
} from '../../types';
import type { BadgeTone } from './Badge';

export type StatusPresentation = {
    label: string;
    tone: BadgeTone;
    description?: string;
};

export const appointmentStatusPresentation: Record<AppointmentStatusType, StatusPresentation> = {
    [AppointmentStatus.SCHEDULED]: { label: 'Scheduled', tone: 'info' },
    [AppointmentStatus.CONFIRMED]: { label: 'Confirmed', tone: 'brand' },
    [AppointmentStatus.ARRIVED]: { label: 'Arrived', tone: 'brand' },
    [AppointmentStatus.IN_QUEUE]: { label: 'In Queue', tone: 'warning' },
    [AppointmentStatus.CALLED]: { label: 'Called', tone: 'info' },
    [AppointmentStatus.COMPLETED]: { label: 'Completed', tone: 'success' },
    [AppointmentStatus.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
    [AppointmentStatus.NO_SHOW]: { label: 'No Show', tone: 'danger' },
};

export const queueStatusPresentation: Record<QueueStatusType, StatusPresentation> = {
    [QueueStatus.WAITING]: { label: 'Waiting', tone: 'warning' },
    [QueueStatus.ARRIVED]: { label: 'Arrived', tone: 'brand' },
    [QueueStatus.CALLED]: { label: 'Called', tone: 'info' },
    [QueueStatus.COMPLETED]: { label: 'Completed', tone: 'success' },
    [QueueStatus.CANCELLED]: { label: 'Cancelled', tone: 'neutral' },
    [QueueStatus.NO_SHOW]: { label: 'No Show', tone: 'danger' },
};

export const riskPresentation: Record<RiskLevelType, StatusPresentation> = {
    [RiskLevel.LOW]: {
        label: 'Low Risk',
        tone: 'success',
        description: 'Low no-show risk',
    },
    [RiskLevel.MEDIUM]: {
        label: 'Medium Risk',
        tone: 'warning',
        description: 'Medium no-show risk',
    },
    [RiskLevel.HIGH]: {
        label: 'High Risk',
        tone: 'danger',
        description: 'High no-show risk',
    },
};

export const activeStatusPresentation = {
    active: { label: 'Active', tone: 'success' },
    inactive: { label: 'Inactive', tone: 'neutral' },
} as const satisfies Record<string, StatusPresentation>;

export const getAppointmentStatusLabel = (status: AppointmentStatusType): string => {
    return appointmentStatusPresentation[status].label;
};

export const getQueueStatusLabel = (status: QueueStatusType): string => {
    return queueStatusPresentation[status].label;
};
