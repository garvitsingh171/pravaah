import { prisma } from '../../src/config/prisma.js';

/** Explicit business state; timestamps and security logging are intentionally excluded. */
export async function businessState() {
    const [
        clinics,
        users,
        patientProfiles,
        patients,
        doctorProfiles,
        doctors,
        availabilityPeriods,
        appointments,
        queues,
        predictions,
        outcomes,
        feedback,
        invitations,
        activities,
        refreshWork,
    ] = await Promise.all([
        prisma.clinic.findMany({
            select: {
                id: true,
                name: true,
                isActive: true,
                timezone: true,
                phone: true,
                email: true,
                openingTime: true,
                closingTime: true,
                slotDurationMinutes: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.user.findMany({
            select: { id: true, clinicId: true, role: true, status: true, fullName: true },
            orderBy: { id: 'asc' },
        }),
        prisma.patient.findMany({
            select: { id: true, fullName: true, phone: true, email: true, isActive: true },
            orderBy: { id: 'asc' },
        }),
        prisma.patientClinic.findMany({
            select: {
                id: true,
                clinicId: true,
                patientId: true,
                isActive: true,
                notes: true,
                totalAppointments: true,
                totalCompletedVisits: true,
                totalNoShows: true,
                totalLateArrivals: true,
                lastVisitAt: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.doctor.findMany({
            select: { id: true, fullName: true, specialization: true, isActive: true },
            orderBy: { id: 'asc' },
        }),
        prisma.doctorClinic.findMany({
            select: { id: true, clinicId: true, doctorId: true, isActive: true },
            orderBy: { id: 'asc' },
        }),
        prisma.doctorAvailabilityPeriod.findMany({
            select: {
                id: true,
                doctorClinicId: true,
                weekday: true,
                startTime: true,
                endTime: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.appointment.findMany({
            select: {
                id: true,
                clinicId: true,
                doctorId: true,
                patientId: true,
                status: true,
                scheduledAt: true,
                reason: true,
                notes: true,
                arrivedAt: true,
                cancellationReason: true,
                noShowReason: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.queueEntry.findMany({
            select: {
                id: true,
                clinicId: true,
                appointmentId: true,
                position: true,
                status: true,
                calledAt: true,
                completedAt: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.noShowPrediction.findMany({
            select: {
                id: true,
                clinicId: true,
                appointmentId: true,
                riskLevel: true,
                score: true,
                reasons: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.appointmentPredictionOutcome.findMany({
            select: {
                id: true,
                appointmentId: true,
                clinicId: true,
                actualOutcome: true,
                actualNoShow: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.predictionFeedback.findMany({
            select: {
                id: true,
                predictionId: true,
                staffUserId: true,
                usefulness: true,
                actionTaken: true,
                note: true,
            },
            orderBy: { id: 'asc' },
        }),
        prisma.staffInvitation.findMany({
            select: { id: true, clinicId: true, status: true, email: true, acceptedByUserId: true },
            orderBy: { id: 'asc' },
        }),
        prisma.appointmentActivity.count(),
        prisma.predictionRefreshWork.findMany({
            select: { id: true, clinicId: true, patientId: true, status: true },
            orderBy: { id: 'asc' },
        }),
    ]);
    return {
        clinics,
        users,
        patientProfiles,
        patients,
        doctorProfiles,
        doctors,
        availabilityPeriods,
        appointments,
        queues,
        predictions,
        outcomes,
        feedback,
        invitations,
        activities,
        refreshWork,
    };
}
