import { createHash } from 'node:crypto';
import { assertSecurityTestDatabase } from './testDatabaseGuard.js';
import { prisma } from '../../src/config/prisma.js';

export const invitationTokenB = 'sec19syntheticinvitationtoken000000000000';

export const ids = {
    clinicA: '11111111-1111-4111-8111-111111111111',
    clinicB: '22222222-2222-4222-8222-222222222222',
    adminA: '11111111-1111-4111-8111-111111111112',
    staffA: '11111111-1111-4111-8111-111111111113',
    suspendedA: '11111111-1111-4111-8111-111111111114',
    orphan: '11111111-1111-4111-8111-111111111115',
    adminB: '22222222-2222-4222-8222-222222222223',
    staffB: '22222222-2222-4222-8222-222222222224',
    patientA: '11111111-1111-4111-8111-111111111116',
    patientB: '22222222-2222-4222-8222-222222222225',
    sharedPatient: '33333333-3333-4333-8333-333333333333',
    doctorA: '11111111-1111-4111-8111-111111111117',
    doctorB: '22222222-2222-4222-8222-222222222226',
    sharedDoctor: '44444444-4444-4444-8444-444444444444',
    appointmentA: '11111111-1111-4111-8111-111111111118',
    sharedAppointmentA: '11111111-1111-4111-8111-111111111121',
    appointmentB: '22222222-2222-4222-8222-222222222227',
    sharedAppointmentB: '22222222-2222-4222-8222-222222222228',
    queueA: '11111111-1111-4111-8111-111111111119',
    queueSharedA: '11111111-1111-4111-8111-111111111122',
    queueB: '22222222-2222-4222-8222-222222222229',
    queueSharedB: '22222222-2222-4222-8222-222222222230',
    predictionA: '11111111-1111-4111-8111-111111111120',
    predictionSharedA: '11111111-1111-4111-8111-111111111123',
    predictionB: '22222222-2222-4222-8222-222222222231',
    predictionSharedB: '22222222-2222-4222-8222-222222222233',
    invitationB: '22222222-2222-4222-8222-222222222232',
} as const;

export let fixtureDate = '';

export async function resetFixtures() {
    assertSecurityTestDatabase();
    // Static SQL and a dedicated database only. This deliberately cannot target a URL supplied by a test.
    await prisma.$executeRaw`TRUNCATE TABLE "clinics", "users", "doctors", "patients" CASCADE`;
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(5, 0, 0, 0);
    fixtureDate = tomorrow.toISOString().slice(0, 10);

    await prisma.clinic.createMany({
        data: [
            { id: ids.clinicA, name: 'Sunrise Family Clinic', slug: 'sec19-sunrise' },
            { id: ids.clinicB, name: 'Riverside Health Clinic', slug: 'sec19-riverside' },
        ],
    });
    await prisma.user.createMany({
        data: [
            {
                id: ids.adminA,
                clerkUserId: 'sec19-admin-a',
                fullName: 'Admin A',
                email: 'admin-a@example.test',
                role: 'ADMIN',
                status: 'ACTIVE',
                clinicId: ids.clinicA,
            },
            {
                id: ids.staffA,
                clerkUserId: 'sec19-staff-a',
                fullName: 'Staff A',
                email: 'staff-a@example.test',
                role: 'STAFF',
                status: 'ACTIVE',
                clinicId: ids.clinicA,
            },
            {
                id: ids.suspendedA,
                clerkUserId: 'sec19-suspended-a',
                fullName: 'Suspended A',
                email: 'suspended-a@example.test',
                role: 'STAFF',
                status: 'SUSPENDED',
                clinicId: ids.clinicA,
            },
            {
                id: ids.orphan,
                clerkUserId: 'sec19-orphan',
                fullName: 'Orphan',
                email: 'orphan@example.test',
                role: 'STAFF',
                status: 'ACTIVE',
            },
            {
                id: ids.adminB,
                clerkUserId: 'sec19-admin-b',
                fullName: 'Admin B',
                email: 'admin-b@example.test',
                role: 'ADMIN',
                status: 'ACTIVE',
                clinicId: ids.clinicB,
            },
            {
                id: ids.staffB,
                clerkUserId: 'sec19-staff-b',
                fullName: 'Staff B',
                email: 'staff-b@example.test',
                role: 'STAFF',
                status: 'ACTIVE',
                clinicId: ids.clinicB,
            },
        ],
    });
    await prisma.patient.createMany({
        data: [
            { id: ids.patientA, fullName: 'Fictional Sunrise Patient', phone: '5550101001' },
            { id: ids.patientB, fullName: 'Fictional Riverside Patient', phone: '5550102001' },
            { id: ids.sharedPatient, fullName: 'Fictional Shared Patient', phone: '5550103001' },
        ],
    });
    await prisma.patientClinic.createMany({
        data: [
            { patientId: ids.patientA, clinicId: ids.clinicA, notes: 'Sunrise private note' },
            { patientId: ids.patientB, clinicId: ids.clinicB, notes: 'Riverside private note' },
            {
                patientId: ids.sharedPatient,
                clinicId: ids.clinicA,
                notes: 'Shared patient Sunrise note',
            },
            {
                patientId: ids.sharedPatient,
                clinicId: ids.clinicB,
                notes: 'Shared patient Riverside note',
            },
        ],
    });
    await prisma.doctor.createMany({
        data: [
            { id: ids.doctorA, fullName: 'Doctor Sunrise' },
            { id: ids.doctorB, fullName: 'Doctor Riverside' },
            { id: ids.sharedDoctor, fullName: 'Doctor Shared' },
        ],
    });
    await prisma.doctorClinic.createMany({
        data: [
            { doctorId: ids.doctorA, clinicId: ids.clinicA },
            { doctorId: ids.doctorB, clinicId: ids.clinicB },
            { doctorId: ids.sharedDoctor, clinicId: ids.clinicA },
            { doctorId: ids.sharedDoctor, clinicId: ids.clinicB },
        ],
    });
    await prisma.appointment.createMany({
        data: [
            {
                id: ids.appointmentA,
                clinicId: ids.clinicA,
                doctorId: ids.doctorA,
                patientId: ids.patientA,
                createdByUserId: ids.staffA,
                scheduledAt: tomorrow,
                status: 'SCHEDULED',
            },
            {
                id: ids.sharedAppointmentA,
                clinicId: ids.clinicA,
                doctorId: ids.doctorA,
                patientId: ids.sharedPatient,
                createdByUserId: ids.staffA,
                scheduledAt: new Date(tomorrow.getTime() + 15 * 60_000),
                status: 'CONFIRMED',
            },
            {
                id: ids.appointmentB,
                clinicId: ids.clinicB,
                doctorId: ids.doctorB,
                patientId: ids.patientB,
                createdByUserId: ids.staffB,
                scheduledAt: tomorrow,
                status: 'SCHEDULED',
            },
            {
                id: ids.sharedAppointmentB,
                clinicId: ids.clinicB,
                doctorId: ids.sharedDoctor,
                patientId: ids.sharedPatient,
                createdByUserId: ids.staffB,
                scheduledAt: new Date(tomorrow.getTime() + 30 * 60_000),
                status: 'SCHEDULED',
            },
        ],
    });
    await prisma.queueEntry.createMany({
        data: [
            {
                id: ids.queueA,
                clinicId: ids.clinicA,
                appointmentId: ids.appointmentA,
                doctorId: ids.doctorA,
                patientId: ids.patientA,
                position: 1,
                queuedAt: tomorrow,
            },
            {
                id: ids.queueSharedA,
                clinicId: ids.clinicA,
                appointmentId: ids.sharedAppointmentA,
                doctorId: ids.doctorA,
                patientId: ids.sharedPatient,
                position: 2,
                queuedAt: tomorrow,
            },
            {
                id: ids.queueB,
                clinicId: ids.clinicB,
                appointmentId: ids.appointmentB,
                doctorId: ids.doctorB,
                patientId: ids.patientB,
                position: 1,
                queuedAt: tomorrow,
            },
            {
                id: ids.queueSharedB,
                clinicId: ids.clinicB,
                appointmentId: ids.sharedAppointmentB,
                doctorId: ids.sharedDoctor,
                patientId: ids.sharedPatient,
                position: 1,
                queuedAt: tomorrow,
            },
        ],
    });
    await prisma.noShowPrediction.createMany({
        data: [
            {
                id: ids.predictionA,
                appointmentId: ids.appointmentA,
                clinicId: ids.clinicA,
                patientId: ids.patientA,
                riskLevel: 'LOW',
                score: 10,
                reasons: [],
            },
            {
                id: ids.predictionSharedA,
                appointmentId: ids.sharedAppointmentA,
                clinicId: ids.clinicA,
                patientId: ids.sharedPatient,
                riskLevel: 'MEDIUM',
                score: 50,
                reasons: [],
            },
            {
                id: ids.predictionB,
                appointmentId: ids.appointmentB,
                clinicId: ids.clinicB,
                patientId: ids.patientB,
                riskLevel: 'HIGH',
                score: 80,
                reasons: [{ code: 'PRIVATE', message: 'Riverside private explanation' }],
            },
            {
                id: ids.predictionSharedB,
                appointmentId: ids.sharedAppointmentB,
                clinicId: ids.clinicB,
                patientId: ids.sharedPatient,
                riskLevel: 'MEDIUM',
                score: 45,
                reasons: [],
            },
        ],
    });
    await prisma.staffInvitation.create({
        data: {
            id: ids.invitationB,
            clinicId: ids.clinicB,
            email: 'invitee-b@example.test',
            tokenHash: createHash('sha256').update(invitationTokenB).digest('hex'),
            invitedByUserId: ids.adminB,
            expiresAt: new Date(Date.now() + 86_400_000),
        },
    });
}

export async function clearFixtures() {
    assertSecurityTestDatabase();
    await prisma.$executeRaw`TRUNCATE TABLE "clinics", "users", "doctors", "patients" CASCADE`;
}
