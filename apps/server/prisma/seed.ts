import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import ws from 'ws';
import { AppointmentActivityType, AppointmentStatus, PredictionGenerationSource, PredictionRefreshStatus, PrismaClient, QueueStatus, UserRole, UserStatus } from '../src/generated/prisma/client.js';
import { buildAppointmentCreatedActivityMetadata, buildAppointmentStatusActivityMetadata } from '../src/modules/appointments/appointment.activity.js';
import { predictNoShowRisk } from '../src/modules/predictions/prediction.service.js';
import { validateSeedEnvironment } from './seed.config.js';
import { generateFixtures, SEED_NAMESPACE } from './seed.fixtures.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const config = validateSeedEnvironment(process.env);
const fixtures = generateFixtures(config.profile, config.anchorDate);
const connectionString = process.env.DATABASE_URL!;
const databaseHost = new URL(connectionString).hostname.toLowerCase();
const useNeonWebSocketAdapter = process.env.PRISMA_DATABASE_ADAPTER?.trim().toLowerCase() === 'neon';
const adapter = useNeonWebSocketAdapter && databaseHost.endsWith('.neon.tech')
    ? (() => { neonConfig.webSocketConstructor = ws; return new PrismaNeon({ connectionString }); })()
    : new PrismaPg({ connectionString, max: 5, connectionTimeoutMillis: 30_000, idleTimeoutMillis: 300_000, keepAlive: true });
const prisma = new PrismaClient({
    adapter,
    transactionOptions: { maxWait: 30_000, timeout: 30_000 },
});
const json = (value: unknown) => value as object;
const seedOwnedAppointmentIds = fixtures.appointments.map((row) => row.id);
const seedOwnedClinicIds = fixtures.clinics.map((row) => row.id);

async function removePreviouslySeededRows() {
    if (!config.cleanupConfirmed) return 0;
    return prisma.$transaction(async (tx) => {
        const activities = await tx.appointmentActivity.deleteMany({ where: { appointmentId: { in: seedOwnedAppointmentIds } } });
        await tx.lifecycleEvent.deleteMany({ where: { clinicId: { in: seedOwnedClinicIds }, entityId: { in: seedOwnedAppointmentIds } } });
        await tx.noShowPrediction.deleteMany({ where: { appointmentId: { in: seedOwnedAppointmentIds } } });
        await tx.queueEntry.deleteMany({ where: { appointmentId: { in: seedOwnedAppointmentIds } } });
        await tx.appointment.deleteMany({ where: { id: { in: seedOwnedAppointmentIds } } });
        return activities.count;
    });
}

async function seed() {
    const deletedActivities = await removePreviouslySeededRows();
    for (const clinic of fixtures.clinics) await prisma.clinic.upsert({ where: { id: clinic.id }, update: { ...clinic, country: 'India', timezone: 'Asia/Kolkata', isActive: true }, create: { ...clinic, country: 'India', timezone: 'Asia/Kolkata', isActive: true } });
    for (const user of fixtures.users) {
        const clerkUserId = user.clerkUserId === 'BOUND_ADMIN' ? config.adminClerkUserId ?? `seed-${user.id}` : user.clerkUserId === 'BOUND_STAFF' ? config.staffClerkUserId ?? `seed-${user.id}` : user.clerkUserId;
        const status = user.clerkUserId === 'BOUND_STAFF' && config.staffClerkUserId ? UserStatus.ACTIVE : user.status;
        await prisma.user.upsert({ where: { id: user.id }, update: { clerkUserId, fullName: user.fullName, email: user.email, role: user.role, status, clinicId: user.clinicId }, create: { id: user.id, clerkUserId, fullName: user.fullName, email: user.email, role: user.role, status, clinicId: user.clinicId } });
    }
    for (const doctor of fixtures.doctors) await prisma.doctor.upsert({ where: { id: doctor.id }, update: doctor, create: doctor });
    for (const link of fixtures.doctorClinics) await prisma.doctorClinic.upsert({ where: { doctorId_clinicId: { doctorId: link.doctorId, clinicId: link.clinicId } }, update: { displayName: link.displayName, consultationFee: link.consultationFee, isActive: true }, create: { ...link, consultationFee: link.consultationFee } });
    for (const availability of fixtures.availability) await prisma.doctorAvailabilityPeriod.upsert({ where: { id: availability.id }, update: availability, create: availability });
    for (const patient of fixtures.patients) await prisma.patient.upsert({ where: { id: patient.id }, update: { ...patient, country: 'India', isActive: true }, create: { ...patient, country: 'India', isActive: true } });

    const attendance = new Map<string, { total: number; completed: number; noShows: number; late: number; lastVisitAt: Date | null }>();
    for (const row of fixtures.patientClinics) attendance.set(`${row.patientId}:${row.clinicId}`, { total: 0, completed: 0, noShows: 0, late: 0, lastVisitAt: null });
    for (const appointment of fixtures.appointments) {
        const count = attendance.get(`${appointment.patientId}:${appointment.clinicId}`)!; count.total += 1; if (appointment.status === AppointmentStatus.COMPLETED) { count.completed += 1; count.lastVisitAt = count.lastVisitAt && count.lastVisitAt > appointment.scheduledAt ? count.lastVisitAt : new Date(appointment.scheduledAt.getTime() + 20 * 60_000); } if (appointment.status === AppointmentStatus.NO_SHOW) count.noShows += 1; if (appointment.isLateArrival) count.late += 1;
    }
    for (const row of fixtures.patientClinics) { const count = attendance.get(`${row.patientId}:${row.clinicId}`)!; await prisma.patientClinic.upsert({ where: { patientId_clinicId: { patientId: row.patientId, clinicId: row.clinicId } }, update: { totalAppointments: count.total, totalCompletedVisits: count.completed, totalNoShows: count.noShows, totalLateArrivals: count.late, lastVisitAt: count.lastVisitAt, distanceFromClinicKm: row.distanceFromClinicKm, routingStatus: 'NOT_CALCULATED', isActive: true }, create: { ...row, totalAppointments: count.total, totalCompletedVisits: count.completed, totalNoShows: count.noShows, totalLateArrivals: count.late, lastVisitAt: count.lastVisitAt, routingStatus: 'NOT_CALCULATED', isActive: true } }); }

    for (const appointment of fixtures.appointments) {
        const { queueStatus, position, ...appointmentData } = appointment;
        await prisma.appointment.upsert({ where: { id: appointment.id }, update: appointmentData, create: appointmentData });
        const prior = fixtures.appointments.filter((candidate) => candidate.patientId === appointment.patientId && candidate.clinicId === appointment.clinicId && candidate.scheduledAt < appointment.scheduledAt);
        const patientClinic = fixtures.patientClinics.find((row) => row.patientId === appointment.patientId && row.clinicId === appointment.clinicId)!;
        const prediction = predictNoShowRisk({ scheduledAt: appointment.scheduledAt, bookedAt: appointment.createdAt, patientNoShowCount: prior.filter((row) => row.status === AppointmentStatus.NO_SHOW).length, patientLateArrivalCount: prior.filter((row) => row.isLateArrival).length, patientCompletedAppointmentCount: prior.filter((row) => row.status === AppointmentStatus.COMPLETED).length, distanceFromClinicKm: Number(patientClinic.distanceFromClinicKm) });
        const runKey = `${SEED_NAMESPACE}:prediction:${appointment.id}`;
        await prisma.noShowPrediction.upsert({ where: { runKey }, update: { appointmentId: appointment.id, clinicId: appointment.clinicId, patientId: appointment.patientId, riskLevel: prediction.riskLevel, score: prediction.score, reasons: json(prediction.reasons), featureSchemaVersion: prediction.featureSchemaVersion, featureSnapshot: json(prediction.featureSnapshot), ruleVersion: prediction.ruleVersion, generationSource: PredictionGenerationSource.BACKFILL }, create: { appointmentId: appointment.id, clinicId: appointment.clinicId, patientId: appointment.patientId, riskLevel: prediction.riskLevel, score: prediction.score, reasons: json(prediction.reasons), featureSchemaVersion: prediction.featureSchemaVersion, featureSnapshot: json(prediction.featureSnapshot), ruleVersion: prediction.ruleVersion, generationSource: PredictionGenerationSource.BACKFILL, runKey, createdAt: appointment.createdAt } });
        if (queueStatus !== null && position !== null) { const queueData = { clinicId: appointment.clinicId, appointmentId: appointment.id, doctorId: appointment.doctorId, patientId: appointment.patientId, position, status: queueStatus, queuedAt: new Date(appointment.scheduledAt.getTime() - 15 * 60_000), calledAt: queueStatus === QueueStatus.CALLED || queueStatus === QueueStatus.COMPLETED ? new Date(appointment.scheduledAt.getTime() + 5 * 60_000) : null, completedAt: queueStatus === QueueStatus.COMPLETED ? new Date(appointment.scheduledAt.getTime() + 20 * 60_000) : null }; await prisma.queueEntry.upsert({ where: { appointmentId: appointment.id }, update: queueData, create: queueData }); }
        const activityId = `90000000-0000-4000-8000-${String(Number(appointment.id.slice(1, 8)) * 10).padStart(12, '0')}`;
        await prisma.appointmentActivity.upsert({ where: { id: activityId }, update: { clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, type: AppointmentActivityType.APPOINTMENT_CREATED, occurredAt: appointment.createdAt, metadata: json(buildAppointmentCreatedActivityMetadata({ scheduledAt: appointment.scheduledAt, bookingSource: appointment.bookingSource, doctorId: appointment.doctorId, patientId: appointment.patientId })) }, create: { id: activityId, appointmentId: appointment.id, clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, type: AppointmentActivityType.APPOINTMENT_CREATED, occurredAt: appointment.createdAt, metadata: json(buildAppointmentCreatedActivityMetadata({ scheduledAt: appointment.scheduledAt, bookingSource: appointment.bookingSource, doctorId: appointment.doctorId, patientId: appointment.patientId })) } });
        if (appointment.status !== AppointmentStatus.SCHEDULED) { const statusId = `90000000-0000-4000-8000-${String(Number(appointment.id.slice(1, 8)) * 10 + 1).padStart(12, '0')}`; const type = appointment.status === AppointmentStatus.CONFIRMED ? AppointmentActivityType.APPOINTMENT_CONFIRMED : appointment.status === AppointmentStatus.ARRIVED ? AppointmentActivityType.PATIENT_ARRIVED : appointment.status === AppointmentStatus.IN_QUEUE ? AppointmentActivityType.ENTERED_QUEUE : appointment.status === AppointmentStatus.CALLED ? AppointmentActivityType.PATIENT_CALLED : appointment.status === AppointmentStatus.COMPLETED ? AppointmentActivityType.APPOINTMENT_COMPLETED : appointment.status === AppointmentStatus.CANCELLED ? AppointmentActivityType.APPOINTMENT_CANCELLED : AppointmentActivityType.APPOINTMENT_NO_SHOW; await prisma.appointmentActivity.upsert({ where: { id: statusId }, update: { clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, type, occurredAt: new Date(appointment.scheduledAt.getTime() - 30 * 60_000), metadata: json(buildAppointmentStatusActivityMetadata(AppointmentStatus.CONFIRMED, appointment.status)) }, create: { id: statusId, appointmentId: appointment.id, clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, type, occurredAt: new Date(appointment.scheduledAt.getTime() - 30 * 60_000), metadata: json(buildAppointmentStatusActivityMetadata(AppointmentStatus.CONFIRMED, appointment.status)) } }); }
        const lifecycleId = `91000000-0000-4000-8000-${String(Number(appointment.id.slice(1, 8))).padStart(12, '0')}`;
        await prisma.lifecycleEvent.upsert({ where: { id: lifecycleId }, update: { clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, entityType: 'APPOINTMENT', entityId: appointment.id, action: appointment.status === AppointmentStatus.SCHEDULED ? 'CREATED' : appointment.status, metadata: json({ seedNamespace: SEED_NAMESPACE, status: appointment.status }) }, create: { id: lifecycleId, clinicId: appointment.clinicId, actorUserId: appointment.createdByUserId, entityType: 'APPOINTMENT', entityId: appointment.id, action: appointment.status === AppointmentStatus.SCHEDULED ? 'CREATED' : appointment.status, metadata: json({ seedNamespace: SEED_NAMESPACE, status: appointment.status }), createdAt: appointment.createdAt } });
    }

    const clinicIdsWithActive = new Set(fixtures.appointments.filter((row) => fixtures.activeAppointmentStatuses.includes(row.status)).map((row) => `${row.clinicId}:${row.patientId}`));
    for (const key of clinicIdsWithActive) { const [clinicId, patientId] = key.split(':') as [string, string]; await prisma.predictionRefreshWork.upsert({ where: { clinicId_patientId: { clinicId, patientId } }, update: { requestedRevision: 2, processedRevision: patientId.endsWith('1') ? 0 : 2, latestTrigger: PredictionGenerationSource.PATIENT_HISTORY_CHANGED, status: patientId.endsWith('1') ? PredictionRefreshStatus.PENDING : PredictionRefreshStatus.COMPLETED }, create: { clinicId, patientId, requestedRevision: 1, processedRevision: patientId.endsWith('1') ? 0 : 1, latestTrigger: PredictionGenerationSource.BACKFILL, status: patientId.endsWith('1') ? PredictionRefreshStatus.PENDING : PredictionRefreshStatus.COMPLETED } }); }
    const admins = fixtures.users.filter((user) => user.role === UserRole.ADMIN);
    for (const clinic of fixtures.clinics) for (const [index, email] of ['pending-staff@example.test', 'revoked-staff@example.test'].entries()) { const invitationId = `a0000000-0000-4000-8000-${String(fixtures.clinics.indexOf(clinic) * 10 + index + 1).padStart(12, '0')}`; const actorUserId = admins.find((user) => user.clinicId === clinic.id)!.id; const invitationStatus = index === 0 ? 'PENDING' : 'REVOKED'; await prisma.staffInvitation.upsert({ where: { id: invitationId }, update: { email, status: invitationStatus, expiresAt: new Date(Date.now() + 7 * 86400000), revokedAt: index === 0 ? null : new Date() }, create: { id: invitationId, clinicId: clinic.id, email, tokenHash: `${SEED_NAMESPACE}:invite:${invitationId}`, invitedByUserId: actorUserId, status: invitationStatus, expiresAt: new Date(Date.now() + 7 * 86400000), revokedAt: index === 0 ? null : new Date() } }); const lifecycleId = `92000000-0000-4000-8000-${String(fixtures.clinics.indexOf(clinic) * 10 + index + 1).padStart(12, '0')}`; await prisma.lifecycleEvent.upsert({ where: { id: lifecycleId }, update: { clinicId: clinic.id, actorUserId, entityType: 'STAFF_INVITATION', entityId: invitationId, action: index === 0 ? 'CREATED' : 'REVOKED', metadata: json({ seedNamespace: SEED_NAMESPACE, status: invitationStatus }) }, create: { id: lifecycleId, clinicId: clinic.id, actorUserId, entityType: 'STAFF_INVITATION', entityId: invitationId, action: index === 0 ? 'CREATED' : 'REVOKED', metadata: json({ seedNamespace: SEED_NAMESPACE, status: invitationStatus }) } }); }

    const counts = await Promise.all([prisma.clinic.count({ where: { id: { in: seedOwnedClinicIds } } }), prisma.user.count({ where: { id: { in: fixtures.users.map((row) => row.id) } } }), prisma.doctor.count({ where: { id: { in: fixtures.doctors.map((row) => row.id) } } }), prisma.patient.count({ where: { id: { in: fixtures.patients.map((row) => row.id) } } }), prisma.appointment.count({ where: { id: { in: seedOwnedAppointmentIds } } }), prisma.queueEntry.count({ where: { appointmentId: { in: seedOwnedAppointmentIds } } }), prisma.noShowPrediction.count({ where: { appointmentId: { in: seedOwnedAppointmentIds } } }), prisma.appointmentActivity.count({ where: { appointmentId: { in: seedOwnedAppointmentIds } } })]);
    console.log(`Seeded ${config.profile} profile into allowlisted development database '${config.databaseName}'.`);
    console.log(JSON.stringify({ namespace: SEED_NAMESPACE, anchorDate: config.anchorDate, counts: { clinics: counts[0], users: counts[1], doctors: counts[2], patients: counts[3], appointments: counts[4], queueEntries: counts[5], predictions: counts[6], activities: counts[7] }, deletedSeedActivities: deletedActivities }, null, 2));
    console.log('Clerk: set SEED_ADMIN_CLERK_USER_ID to a real development Clerk user to sign in as Clinic A admin.');
    console.log('Scenarios: busy queue, repeat/no-show patients, cancellation, high-risk prediction, future bookings, and sparse clinic.');
}

seed().catch((error: unknown) => {
    if (error instanceof Error) {
        const prismaDetails = error as Error & { code?: string; meta?: unknown; cause?: unknown };
        const diagnostic = `${error.name}: ${error.message}\ncode=${prismaDetails.code ?? 'unknown'}\nmeta=${JSON.stringify(prismaDetails.meta ?? null)}\n${error.stack ?? ''}`.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[redacted-database-url]');
        console.error(diagnostic);
    } else {
        console.error('Seed failed with a non-Error value:', error);
    }
    process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
