import { AppointmentStatus, BookingSource, Gender, RiskLevel } from '../../types';
import type {
    DashboardActivityItem,
    DashboardHighRiskAppointment,
    DashboardSummary,
} from '../../features/dashboard/dashboardApi';
import { testClinicId } from './onboarding';

export const emptyDashboardSummary: DashboardSummary = {
    clinicId: testClinicId,
    date: '2026-07-29',
    appointmentSummary: {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        arrived: 0,
        inQueue: 0,
        called: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
    },
    queueSummary: {
        total: 0,
        waiting: 0,
        arrived: 0,
        called: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
    },
    noShowRiskSummary: {
        low: 0,
        medium: 0,
        high: 0,
    },
};

export const activeDashboardSummary: DashboardSummary = {
    ...emptyDashboardSummary,
    appointmentSummary: {
        ...emptyDashboardSummary.appointmentSummary,
        total: 2,
        scheduled: 1,
        confirmed: 1,
    },
    queueSummary: {
        ...emptyDashboardSummary.queueSummary,
        total: 1,
        waiting: 1,
    },
    noShowRiskSummary: {
        low: 1,
        medium: 0,
        high: 1,
    },
};

export const highRiskAppointment: DashboardHighRiskAppointment = {
    appointment: {
        id: 'appointment-id',
        scheduledAt: '2026-07-29T10:00:00.000Z',
        durationMinutes: 15,
        status: AppointmentStatus.CONFIRMED,
        bookingSource: BookingSource.RECEPTION,
        reason: 'Fever',
    },
    doctor: {
        id: 'doctor-id',
        fullName: 'Dr. Asha Rao',
        specialization: 'General Medicine',
        qualification: 'MBBS',
    },
    patient: {
        id: 'patient-id',
        fullName: 'Riya Sharma',
        phone: '+91 90000 00000',
        email: 'riya@example.com',
        gender: Gender.FEMALE,
        age: 32,
    },
    noShowPrediction: {
        id: 'prediction-id',
        riskLevel: RiskLevel.HIGH,
        score: 82,
        reasons: ['Repeat no-show history'],
    },
};

export const activityItem: DashboardActivityItem = {
    id: 'activity-id',
    type: 'APPOINTMENT_BOOKED',
    timestamp: '2026-07-29T09:00:00.000Z',
    appointment: highRiskAppointment.appointment,
    doctor: highRiskAppointment.doctor,
    patient: highRiskAppointment.patient,
};
