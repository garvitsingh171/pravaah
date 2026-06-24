import { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import { accessService } from '../auth/access.service.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { toNoShowPredictionResponse } from '../predictions/prediction.service.js';
import { dashboardRepository } from './dashboard.repository.js';
import type {
    AppointmentStatusCount,
    ClinicDateRange,
    DashboardActivityAppointmentSource,
    DashboardActivityItem,
    DashboardActivityQueueSource,
    DashboardAppointmentSummary,
    DashboardHighRiskAppointment,
    DashboardNoShowRiskSummary,
    DashboardQueueSummary,
    DashboardSummary,
    HighRiskAppointmentCandidate,
    NoShowRiskLevelCount,
    QueueStatusCount,
} from './dashboard.types.js';

const getDateInTimeZone = (date: Date, timeZone: string): string => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
};

const buildAppointmentSummary = (
    statusCounts: AppointmentStatusCount[]
): DashboardAppointmentSummary => {
    const counts = new Map(
        statusCounts.map((statusCount) => [statusCount.status, statusCount._count.status])
    );

    return {
        total: statusCounts.reduce((total, statusCount) => total + statusCount._count.status, 0),
        scheduled: counts.get(AppointmentStatus.SCHEDULED) ?? 0,
        confirmed: counts.get(AppointmentStatus.CONFIRMED) ?? 0,
        arrived: counts.get(AppointmentStatus.ARRIVED) ?? 0,
        inQueue: counts.get(AppointmentStatus.IN_QUEUE) ?? 0,
        called: counts.get(AppointmentStatus.CALLED) ?? 0,
        completed: counts.get(AppointmentStatus.COMPLETED) ?? 0,
        cancelled: counts.get(AppointmentStatus.CANCELLED) ?? 0,
        noShow: counts.get(AppointmentStatus.NO_SHOW) ?? 0,
    };
};

const buildQueueSummary = (statusCounts: QueueStatusCount[]): DashboardQueueSummary => {
    const counts = new Map(
        statusCounts.map((statusCount) => [statusCount.status, statusCount._count.status])
    );

    return {
        total: statusCounts.reduce((total, statusCount) => total + statusCount._count.status, 0),
        waiting: counts.get(QueueStatus.WAITING) ?? 0,
        arrived: counts.get(QueueStatus.ARRIVED) ?? 0,
        called: counts.get(QueueStatus.CALLED) ?? 0,
        completed: counts.get(QueueStatus.COMPLETED) ?? 0,
        cancelled: counts.get(QueueStatus.CANCELLED) ?? 0,
        noShow: counts.get(QueueStatus.NO_SHOW) ?? 0,
    };
};

const buildNoShowRiskSummary = (
    riskLevelCounts: NoShowRiskLevelCount[]
): DashboardNoShowRiskSummary => {
    const summary: DashboardNoShowRiskSummary = {
        low: 0,
        medium: 0,
        high: 0,
    };

    for (const riskLevelCount of riskLevelCounts) {
        summary[riskLevelCount.riskLevel.toLowerCase() as keyof DashboardNoShowRiskSummary] =
            riskLevelCount._count.riskLevel;
    }

    return summary;
};

const buildHighRiskAppointments = (
    appointments: HighRiskAppointmentCandidate[]
): DashboardHighRiskAppointment[] => {
    return appointments.flatMap((appointment) => {
        const noShowPrediction = toNoShowPredictionResponse(appointment.noShowPrediction);

        if (!noShowPrediction || noShowPrediction.riskLevel !== 'HIGH') {
            return [];
        }

        return [
            {
                appointment: {
                    id: appointment.id,
                    scheduledAt: appointment.scheduledAt,
                    durationMinutes: appointment.durationMinutes,
                    status: appointment.status,
                    bookingSource: appointment.bookingSource,
                    reason: appointment.reason,
                },
                doctor: appointment.doctor,
                patient: appointment.patient,
                noShowPrediction,
            },
        ];
    });
};

const isInDateRange = (timestamp: Date | null, dateRange: ClinicDateRange): timestamp is Date => {
    if (!timestamp) {
        return false;
    }

    return (
        timestamp.getTime() >= dateRange.start.getTime() &&
        timestamp.getTime() < dateRange.end.getTime()
    );
};

const buildAppointmentActivityItems = (
    appointments: DashboardActivityAppointmentSource[],
    dateRange: ClinicDateRange
): DashboardActivityItem[] => {
    return appointments.flatMap((appointment) => {
        const appointmentDetails = {
            id: appointment.id,
            scheduledAt: appointment.scheduledAt,
            durationMinutes: appointment.durationMinutes,
            status: appointment.status,
            bookingSource: appointment.bookingSource,
            reason: appointment.reason,
        };

        const activityItems: DashboardActivityItem[] = [];

        if (isInDateRange(appointment.createdAt, dateRange)) {
            activityItems.push({
                id: `appointment:${appointment.id}:booked`,
                type: 'APPOINTMENT_BOOKED',
                timestamp: appointment.createdAt,
                appointment: appointmentDetails,
                doctor: appointment.doctor,
                patient: appointment.patient,
            });
        }

        if (
            appointment.status === AppointmentStatus.CANCELLED &&
            isInDateRange(appointment.updatedAt, dateRange)
        ) {
            activityItems.push({
                id: `appointment:${appointment.id}:cancelled`,
                type: 'APPOINTMENT_CANCELLED',
                timestamp: appointment.updatedAt,
                appointment: appointmentDetails,
                doctor: appointment.doctor,
                patient: appointment.patient,
            });
        }

        if (
            appointment.status === AppointmentStatus.NO_SHOW &&
            isInDateRange(appointment.updatedAt, dateRange)
        ) {
            activityItems.push({
                id: `appointment:${appointment.id}:no-show`,
                type: 'APPOINTMENT_NO_SHOW',
                timestamp: appointment.updatedAt,
                appointment: appointmentDetails,
                doctor: appointment.doctor,
                patient: appointment.patient,
            });
        }

        return activityItems;
    });
};

const buildQueueActivityItems = (
    queueEntries: DashboardActivityQueueSource[],
    dateRange: ClinicDateRange
): DashboardActivityItem[] => {
    return queueEntries.flatMap((queueEntry) => {
        const activityItems: DashboardActivityItem[] = [];

        if (isInDateRange(queueEntry.queuedAt, dateRange)) {
            activityItems.push({
                id: `queue:${queueEntry.id}:joined`,
                type: 'QUEUE_JOINED',
                timestamp: queueEntry.queuedAt,
                appointment: queueEntry.appointment,
                doctor: queueEntry.doctor,
                patient: queueEntry.patient,
            });
        }

        if (isInDateRange(queueEntry.calledAt, dateRange)) {
            activityItems.push({
                id: `queue:${queueEntry.id}:called`,
                type: 'PATIENT_CALLED',
                timestamp: queueEntry.calledAt,
                appointment: queueEntry.appointment,
                doctor: queueEntry.doctor,
                patient: queueEntry.patient,
            });
        }

        if (isInDateRange(queueEntry.completedAt, dateRange)) {
            activityItems.push({
                id: `queue:${queueEntry.id}:completed`,
                type: 'VISIT_COMPLETED',
                timestamp: queueEntry.completedAt,
                appointment: queueEntry.appointment,
                doctor: queueEntry.doctor,
                patient: queueEntry.patient,
            });
        }

        if (
            queueEntry.status === QueueStatus.CANCELLED &&
            isInDateRange(queueEntry.updatedAt, dateRange)
        ) {
            activityItems.push({
                id: `queue:${queueEntry.id}:cancelled`,
                type: 'QUEUE_CANCELLED',
                timestamp: queueEntry.updatedAt,
                appointment: queueEntry.appointment,
                doctor: queueEntry.doctor,
                patient: queueEntry.patient,
            });
        }

        if (
            queueEntry.status === QueueStatus.NO_SHOW &&
            isInDateRange(queueEntry.updatedAt, dateRange)
        ) {
            activityItems.push({
                id: `queue:${queueEntry.id}:no-show`,
                type: 'QUEUE_NO_SHOW',
                timestamp: queueEntry.updatedAt,
                appointment: queueEntry.appointment,
                doctor: queueEntry.doctor,
                patient: queueEntry.patient,
            });
        }

        return activityItems;
    });
};

export const dashboardService = {
    async getDashboardSummary(
        user: AuthenticatedUser | undefined,
        clinicId: string,
        requestedDate?: string
    ): Promise<DashboardSummary> {
        const clinic = await accessService.verifyClinicAccess(user, clinicId);
        const selectedDate = requestedDate ?? getDateInTimeZone(new Date(), clinic.timezone);

        const [appointmentStatusCounts, queueStatusCounts, riskLevelCounts] = await Promise.all([
            dashboardRepository.countAppointmentsByStatus(clinicId, selectedDate, clinic.timezone),
            dashboardRepository.countQueueEntriesByStatus(clinicId, selectedDate, clinic.timezone),
            dashboardRepository.countNoShowPredictionsByRiskLevel(
                clinicId,
                selectedDate,
                clinic.timezone
            ),
        ]);

        return {
            clinicId,
            date: selectedDate,
            appointmentSummary: buildAppointmentSummary(appointmentStatusCounts),
            queueSummary: buildQueueSummary(queueStatusCounts),
            noShowRiskSummary: buildNoShowRiskSummary(riskLevelCounts),
        };
    },

    async getHighRiskAppointments(
        user: AuthenticatedUser | undefined,
        clinicId: string,
        requestedDate?: string
    ): Promise<{
        clinicId: string;
        date: string;
        highRiskAppointments: DashboardHighRiskAppointment[];
    }> {
        const clinic = await accessService.verifyClinicAccess(user, clinicId);
        const selectedDate = requestedDate ?? getDateInTimeZone(new Date(), clinic.timezone);

        const appointmentCandidates = await dashboardRepository.findHighRiskAppointmentCandidates(
            clinicId,
            selectedDate,
            clinic.timezone
        );

        return {
            clinicId,
            date: selectedDate,
            highRiskAppointments: buildHighRiskAppointments(appointmentCandidates),
        };
    },

    async getTodayActivity(
        user: AuthenticatedUser | undefined,
        clinicId: string
    ): Promise<{
        clinicId: string;
        date: string;
        activityItems: DashboardActivityItem[];
    }> {
        const clinic = await accessService.verifyClinicAccess(user, clinicId);
        const selectedDate = getDateInTimeZone(new Date(), clinic.timezone);
        const dateRange = await dashboardRepository.getClinicDateRange(
            selectedDate,
            clinic.timezone
        );

        if (!dateRange) {
            return {
                clinicId,
                date: selectedDate,
                activityItems: [],
            };
        }

        const [appointments, queueEntries] = await Promise.all([
            dashboardRepository.findAppointmentActivityCandidates(clinicId, dateRange),
            dashboardRepository.findQueueActivityCandidates(clinicId, dateRange),
        ]);

        const activityItems = [
            ...buildAppointmentActivityItems(appointments, dateRange),
            ...buildQueueActivityItems(queueEntries, dateRange),
        ].sort((firstItem, secondItem) => {
            return secondItem.timestamp.getTime() - firstItem.timestamp.getTime();
        });

        return {
            clinicId,
            date: selectedDate,
            activityItems,
        };
    },
};
