import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
    buildCanonicalNoShowPredictionInput,
    recalculateAppointmentIfChanged,
} from '../prediction.recalculation.service.js';
import { NO_SHOW_RULE_VERSION } from '../prediction.types.js';

const future = new Date('2030-01-02T10:00:00.000Z');
const bookedAt = new Date('2030-01-01T10:00:00.000Z');

const createTransaction = (latest: unknown = null) => {
    const create = vi.fn().mockResolvedValue({ id: 'new-run' });
    return {
        $executeRaw: vi.fn().mockResolvedValue(1),
        appointment: {
            findFirst: vi.fn().mockResolvedValue({
                id: 'appointment-id',
                clinicId: 'clinic-id',
                patientId: 'patient-id',
                scheduledAt: future,
                createdAt: bookedAt,
                status: 'SCHEDULED',
            }),
            count: vi.fn().mockResolvedValue(0),
        },
        patientClinic: {
            findUnique: vi.fn().mockResolvedValue({
                totalLateArrivals: 0,
                distanceFromClinicKm: '10.20',
            }),
        },
        noShowPrediction: {
            findFirst: vi.fn().mockResolvedValue(latest),
            create,
        },
    } as unknown as Prisma.TransactionClient & { noShowPrediction: { create: ReturnType<typeof vi.fn> } };
};

describe('prediction recalculation', () => {
    it('appends a changed snapshot even when its score bucket can stay the same', async () => {
        const tx = createTransaction({
            id: 'old-run',
            createdAt: new Date('2030-01-01T11:00:00.000Z'),
            ruleVersion: NO_SHOW_RULE_VERSION,
            featureSnapshot: {
                scheduledAt: future.toISOString(),
                bookedAt: bookedAt.toISOString(),
                patientNoShowCount: 0,
                patientLateArrivalCount: 0,
                patientCompletedAppointmentCount: 0,
                distanceFromClinicKm: 8,
            },
        });

        await expect(
            recalculateAppointmentIfChanged({
                tx,
                clinicId: 'clinic-id',
                appointmentId: 'appointment-id',
                generationSource: 'TRAVEL_DISTANCE_CHANGED',
                now: new Date('2030-01-01T11:00:00.000Z'),
            })
        ).resolves.toEqual({ outcome: 'CREATED', predictionRunId: 'new-run' });

        expect(tx.noShowPrediction.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    generationSource: 'TRAVEL_DISTANCE_CHANGED',
                    featureSnapshot: expect.objectContaining({
                        bookedAt: bookedAt.toISOString(),
                        distanceFromClinicKm: 10.2,
                    }),
                }),
            })
        );
    });

    it('does not append when the six normalized inputs and rule version are unchanged', async () => {
        const snapshot = {
            scheduledAt: future.toISOString(),
            bookedAt: bookedAt.toISOString(),
            patientNoShowCount: 0,
            patientLateArrivalCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 10.2,
        };
        const tx = createTransaction({
            id: 'current-run',
            createdAt: bookedAt,
            ruleVersion: NO_SHOW_RULE_VERSION,
            featureSnapshot: snapshot,
        });

        await expect(
            recalculateAppointmentIfChanged({
                tx,
                clinicId: 'clinic-id',
                appointmentId: 'appointment-id',
                generationSource: 'APPOINTMENT_RESCHEDULED',
            })
        ).resolves.toEqual({ outcome: 'UNCHANGED', predictionRunId: 'current-run' });
        expect(tx.noShowPrediction.create).not.toHaveBeenCalled();
    });

    it('uses only canonical appointment and PatientClinic fields', async () => {
        const tx = createTransaction();
        const input = await buildCanonicalNoShowPredictionInput(tx, {
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            scheduledAt: future,
            createdAt: bookedAt,
        });

        expect(input).toEqual({
            scheduledAt: future,
            bookedAt,
            patientNoShowCount: 0,
            patientLateArrivalCount: 0,
            patientCompletedAppointmentCount: 0,
            distanceFromClinicKm: 10.2,
        });
        expect(JSON.stringify(input)).not.toMatch(/address|phone|latitude|longitude/i);
    });
});
