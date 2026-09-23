import { beforeEach, describe, expect, it, vi } from 'vitest';

const findUnique = vi.hoisted(() => vi.fn());
const update = vi.hoisted(() => vi.fn());
const updateMany = vi.hoisted(() => vi.fn());

vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        patientClinic: {
            findUnique,
            update,
            updateMany,
        },
    },
}));

import { routingRepository } from '../routing.repository.js';

describe('routingRepository concurrency guards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        update.mockResolvedValue({});
        updateMany.mockResolvedValue({ count: 1 });
    });

    it('clears legacy/current route values and records both attempt guards', async () => {
        await routingRepository.beginRoutingAttempt(
            'patient-id',
            'clinic-id',
            'source-a',
            'attempt-a'
        );

        expect(update).toHaveBeenCalledWith({
            where: {
                patientId_clinicId: {
                    patientId: 'patient-id',
                    clinicId: 'clinic-id',
                },
            },
            data: expect.objectContaining({
                distanceFromClinicKm: null,
                estimatedTravelTimeMinutes: null,
                routingStatus: 'NOT_CALCULATED',
                routingSourceHash: 'source-a',
                routingAttemptId: 'attempt-a',
            }),
        });
    });

    it('requires source hash and attempt id for success and failure writes', async () => {
        await routingRepository.saveRoutingResultIfCurrent(
            'patient-id',
            'clinic-id',
            'source-a',
            'attempt-a',
            {
                distanceMeters: 8437,
                travelTimeSeconds: 601,
                provider: 'GEOAPIFY',
                distanceKm: '8.44',
                estimatedTravelTimeMinutes: 11,
            }
        );
        await routingRepository.markRoutingFailedIfCurrent(
            'patient-id',
            'clinic-id',
            'source-a',
            'attempt-a'
        );

        expect(updateMany).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                where: {
                    patientId: 'patient-id',
                    clinicId: 'clinic-id',
                    routingSourceHash: 'source-a',
                    routingAttemptId: 'attempt-a',
                },
                data: expect.objectContaining({ routingStatus: 'CALCULATED' }),
            })
        );
        expect(updateMany).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                where: {
                    patientId: 'patient-id',
                    clinicId: 'clinic-id',
                    routingSourceHash: 'source-a',
                    routingAttemptId: 'attempt-a',
                },
                data: expect.objectContaining({ routingStatus: 'FAILED' }),
            })
        );
    });

    it('invalidates active and in-flight derived attempts without touching legacy rows', async () => {
        await routingRepository.invalidateCalculatedRoutesForPatient('patient-id');

        expect(updateMany).toHaveBeenCalledWith({
            where: {
                patientId: 'patient-id',
                routingSourceHash: { not: null },
            },
            data: expect.objectContaining({
                routingStatus: 'NOT_CALCULATED',
                distanceFromClinicKm: null,
                routingSourceHash: null,
                routingAttemptId: null,
            }),
        });
    });
});
