import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockTransaction = vi.hoisted(() => vi.fn());

vi.mock('../../config/prisma.js', () => ({
    prisma: {
        $transaction: mockTransaction,
    },
}));

import { clinicRepository } from './clinic.repository.js';

describe('clinicRepository.provisionSampleData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('runs sample writes inside a Prisma transaction and propagates transaction failures', async () => {
        const rollbackError = new Error('transaction rolled back');

        mockTransaction.mockRejectedValue(rollbackError);

        await expect(
            clinicRepository.provisionSampleData(
                {
                    clinicId: 'clinic-id',
                    createdByUserId: 'admin-user-id',
                },
                vi.fn()
            )
        ).rejects.toBe(rollbackError);

        expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
});
