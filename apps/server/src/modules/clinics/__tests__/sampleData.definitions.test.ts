import { describe, expect, it } from 'vitest';
import { predictNoShowRisk } from '../../predictions/prediction.service.js';
import { sampleDoctorDefinitions, samplePatientDefinitions } from '../sampleData.definitions.js';

const getCompletedAppointmentCount = (patientIndex: number): number => {
    const patient = samplePatientDefinitions[patientIndex];

    if (!patient) {
        throw new Error(`Missing sample patient at index ${patientIndex}`);
    }

    return Math.max(patient.history.totalAppointments - patient.history.totalNoShows, 0);
};

const predictForSamplePatient = (
    patientIndex: number,
    bookedMinutesBefore: number
): ReturnType<typeof predictNoShowRisk> => {
    const patient = samplePatientDefinitions[patientIndex];

    if (!patient) {
        throw new Error(`Missing sample patient at index ${patientIndex}`);
    }

    const scheduledAt = new Date('2026-08-14T05:00:00.000Z');

    return predictNoShowRisk({
        scheduledAt,
        bookedAt: new Date(scheduledAt.getTime() - bookedMinutesBefore * 60 * 1000),
        patientNoShowCount: patient.history.totalNoShows,
        patientLateArrivalCount: patient.history.totalLateArrivals,
        patientCompletedAppointmentCount: getCompletedAppointmentCount(patientIndex),
        distanceFromClinicKm: Number(patient.history.distanceFromClinicKm),
    });
};

describe('sample data definitions', () => {
    it('provide a screenshot-sized clinic roster with deterministic safe contacts', () => {
        expect(sampleDoctorDefinitions).toHaveLength(6);
        expect(samplePatientDefinitions).toHaveLength(24);

        const ids = new Set([
            ...sampleDoctorDefinitions.map((doctor) => doctor.id),
            ...samplePatientDefinitions.map((patient) => patient.id),
        ]);
        const emails = new Set([
            ...sampleDoctorDefinitions.map((doctor) => doctor.email),
            ...samplePatientDefinitions.map((patient) => patient.email),
        ]);

        expect(ids.size).toBe(sampleDoctorDefinitions.length + samplePatientDefinitions.length);
        expect(emails.size).toBe(sampleDoctorDefinitions.length + samplePatientDefinitions.length);

        for (const doctor of sampleDoctorDefinitions) {
            expect(doctor.phone).toMatch(/^\+91 00000 01\d{3}$/);
            expect(doctor.email).toMatch(/@example\.test$/);
            expect(doctor.fullName).not.toMatch(/test|demo|fake/i);
        }

        for (const patient of samplePatientDefinitions) {
            expect(patient.phone).toMatch(/^\+91 00000 02\d{3}$/);
            expect(patient.email).toMatch(/@example\.test$/);
            expect(patient.fullName).not.toMatch(/test|demo|fake|patient \d+/i);
        }
    });

    it('still yields low, medium, and high no-show risk through the real rules', () => {
        expect(predictForSamplePatient(0, 3 * 24 * 60).riskLevel).toBe('LOW');
        expect(predictForSamplePatient(6, 6 * 60).riskLevel).toBe('MEDIUM');
        expect(predictForSamplePatient(2, 4 * 60).riskLevel).toBe('HIGH');
    });
});
