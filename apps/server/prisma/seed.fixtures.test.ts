import { describe, expect, it } from 'vitest';
import { AppointmentStatus, QueueStatus } from '../src/generated/prisma/client.js';
import { generateFixtures } from './seed.fixtures.js';

describe('deterministic seed fixtures', () => {
    it('is deterministic and profile-sized', () => {
        const first = generateFixtures('small', '2026-10-16');
        const second = generateFixtures('small', '2026-10-16');
        expect(first).toEqual(second);
        expect(first.clinics).toHaveLength(2);
        expect(first.appointments).toHaveLength(72);
    });

    it('keeps queue ownership and positions coherent', () => {
        const fixtures = generateFixtures('demo', '2026-10-16');
        const queueAppointments = fixtures.appointments.filter((row) => row.queueStatus !== null);
        expect(new Set(queueAppointments.map((row) => row.id)).size).toBe(queueAppointments.length);
        for (const row of queueAppointments) {
            expect(row.position).toBeGreaterThan(0);
            expect(Object.values(QueueStatus)).toContain(row.queueStatus);
        }
        expect(fixtures.appointments.some((row) => row.status === AppointmentStatus.CANCELLED)).toBe(true);
        expect(fixtures.appointments.some((row) => row.status === AppointmentStatus.NO_SHOW)).toBe(true);
    });

    it('covers low, medium, and high predictions through the real rule function', () => {
        const fixtures = generateFixtures('demo', '2026-10-16');
        const levels = new Set(fixtures.appointments.map((appointment) => {
            const patient = fixtures.patientClinics.find((row) => row.patientId === appointment.patientId && row.clinicId === appointment.clinicId)!;
            const prior = fixtures.appointments.filter((candidate) => candidate.patientId === appointment.patientId && candidate.clinicId === appointment.clinicId && candidate.scheduledAt < appointment.scheduledAt);
            return fixtures.predictNoShowRisk({ scheduledAt: appointment.scheduledAt, bookedAt: appointment.createdAt, patientNoShowCount: prior.filter((row) => row.status === AppointmentStatus.NO_SHOW).length, patientLateArrivalCount: prior.filter((row) => row.isLateArrival).length, patientCompletedAppointmentCount: prior.filter((row) => row.status === AppointmentStatus.COMPLETED).length, distanceFromClinicKm: Number(patient.distanceFromClinicKm) }).riskLevel;
        }));
        expect(levels).toEqual(new Set(['LOW', 'MEDIUM']));
        expect(fixtures.predictNoShowRisk({
            scheduledAt: new Date('2026-10-20T04:30:00.000Z'),
            bookedAt: new Date('2026-10-20T04:00:00.000Z'),
            patientNoShowCount: 2,
            patientLateArrivalCount: 2,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 20,
        }).riskLevel).toBe('HIGH');
    });
});

