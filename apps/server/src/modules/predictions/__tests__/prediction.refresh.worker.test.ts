import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PredictionRefreshStatus } from '../../../generated/prisma/client.js';

const { tx, prisma } = vi.hoisted(() => {
    const transaction = {
        predictionRefreshWork: { findFirst: vi.fn(), updateMany: vi.fn() },
    };
    return {
        tx: transaction,
        prisma: {
            $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
                callback(transaction)
            ),
            appointment: { findMany: vi.fn() },
            predictionRefreshWork: { updateMany: vi.fn() },
        },
    };
});

vi.mock('../../../config/prisma.js', () => ({ prisma }));

import { drainPendingPredictionRefreshWork } from '../prediction.recalculation.service.js';

describe('prediction refresh worker recovery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        tx.predictionRefreshWork.updateMany.mockResolvedValue({ count: 1 });
        prisma.predictionRefreshWork.updateMany.mockResolvedValue({ count: 1 });
        prisma.appointment.findMany.mockResolvedValue([]);
    });

    it('reclaims expired PROCESSING work and acknowledges the captured revision', async () => {
        const candidate = {
            id: 'work-id',
            clinicId: 'clinic-id',
            patientId: 'patient-id',
            requestedRevision: 2,
            processedRevision: 1,
            latestTrigger: 'TRAVEL_DISTANCE_CHANGED',
        };
        tx.predictionRefreshWork.findFirst.mockImplementation(async ({ where }) => {
            expect(where.status.in).toContain(PredictionRefreshStatus.PROCESSING);
            expect(where.OR).toEqual(
                expect.arrayContaining([{ leaseExpiresAt: { lt: expect.any(Date) } }])
            );
            return candidate;
        });

        await drainPendingPredictionRefreshWork(1);

        expect(tx.predictionRefreshWork.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: 'work-id',
                    requestedRevision: 2,
                    status: { in: expect.arrayContaining([PredictionRefreshStatus.PROCESSING]) },
                }),
                data: expect.objectContaining({
                    status: PredictionRefreshStatus.PROCESSING,
                    attemptCount: { increment: 1 },
                }),
            })
        );
        expect(prisma.predictionRefreshWork.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ id: 'work-id', requestedRevision: 2 }),
                data: expect.objectContaining({
                    processedRevision: 2,
                    status: PredictionRefreshStatus.COMPLETED,
                }),
            })
        );
    });
});
