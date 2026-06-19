import { AppointmentStatus, QueueStatus } from '../../generated/prisma/client.js';
import { AppError } from '../../utils/AppError.js';
import { predictNoShowRisk } from '../predictions/prediction.service.js';
import type { NoShowRiskLevel } from '../predictions/prediction.types.js';
import { dashboardRepository } from './dashboard.repository.js';
import type {
    AppointmentRiskSource,
    AppointmentStatusCount,
    DashboardAppointmentSummary,
    DashboardNoShowRiskSummary,
    DashboardQueueSummary,
    DashboardSummary,
    PatientStatusCount,
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

const verifyClinicAccess = async (userId: string, clinicId: string) => {
    const user = await dashboardRepository.findUserById(userId);

    if (!user || user.status !== 'ACTIVE') {
        throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
    }

    if (user.clinicId !== clinicId) {
        throw new AppError(403, 'CLINIC_ACCESS_DENIED', 'You do not have access to this clinic');
    }

    const clinic = await dashboardRepository.findClinicById(clinicId);

    if (!clinic) {
        throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
    }

    if (!clinic.isActive) {
        throw new AppError(400, 'CLINIC_INACTIVE', 'Clinic is inactive');
    }

    return clinic;
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

const buildPatientHistoryMap = (statusCounts: PatientStatusCount[]) => {
    const historyByPatientId = new Map<
        string,
        {
            noShowCount: number;
            completedCount: number;
        }
    >();

    for (const statusCount of statusCounts) {
        const existingHistory = historyByPatientId.get(statusCount.patientId) ?? {
            noShowCount: 0,
            completedCount: 0,
        };

        if (statusCount.status === AppointmentStatus.NO_SHOW) {
            existingHistory.noShowCount = statusCount._count.status;
        }

        if (statusCount.status === AppointmentStatus.COMPLETED) {
            existingHistory.completedCount = statusCount._count.status;
        }

        historyByPatientId.set(statusCount.patientId, existingHistory);
    }

    return historyByPatientId;
};

const buildNoShowRiskSummary = (
    appointments: AppointmentRiskSource[],
    patientStatusCounts: PatientStatusCount[]
): DashboardNoShowRiskSummary => {
    const patientHistory = buildPatientHistoryMap(patientStatusCounts);
    const summary: Record<Lowercase<NoShowRiskLevel>, number> = {
        low: 0,
        medium: 0,
        high: 0,
    };

    for (const appointment of appointments) {
        const history = patientHistory.get(appointment.patientId) ?? {
            noShowCount: 0,
            completedCount: 0,
        };

        const prediction = predictNoShowRisk({
            scheduledAt: appointment.scheduledAt,
            bookedAt: appointment.createdAt,
            patientNoShowCount: history.noShowCount,
            patientCompletedAppointmentCount: history.completedCount,
        });

        summary[prediction.riskLevel.toLowerCase() as Lowercase<NoShowRiskLevel>] += 1;
    }

    return summary;
};

export const dashboardService = {
    async getDashboardSummary(
        userId: string,
        clinicId: string,
        requestedDate?: string
    ): Promise<DashboardSummary> {
        const clinic = await verifyClinicAccess(userId, clinicId);
        const selectedDate = requestedDate ?? getDateInTimeZone(new Date(), clinic.timezone);

        const [appointmentStatusCounts, queueStatusCounts, riskAppointments] = await Promise.all([
            dashboardRepository.countAppointmentsByStatus(clinicId, selectedDate, clinic.timezone),
            dashboardRepository.countQueueEntriesByStatus(clinicId, selectedDate, clinic.timezone),
            dashboardRepository.findAppointmentsForRiskSummary(
                clinicId,
                selectedDate,
                clinic.timezone
            ),
        ]);

        const patientIds = [
            ...new Set(riskAppointments.map((appointment) => appointment.patientId)),
        ];

        const patientStatusCounts =
            patientIds.length > 0
                ? await dashboardRepository.countPatientAppointmentsByStatuses(
                      clinicId,
                      patientIds,
                      [AppointmentStatus.NO_SHOW, AppointmentStatus.COMPLETED]
                  )
                : [];

        return {
            clinicId,
            date: selectedDate,
            appointmentSummary: buildAppointmentSummary(appointmentStatusCounts),
            queueSummary: buildQueueSummary(queueStatusCounts),
            noShowRiskSummary: buildNoShowRiskSummary(riskAppointments, patientStatusCounts),
        };
    },
};
