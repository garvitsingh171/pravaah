import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    queueEntry: {
        findMany: vi.fn(),
    },
}));

vi.mock('../../../config/prisma.js', () => ({
    prisma: mockPrisma,
}));

import { dashboardRepository } from '../dashboard.repository.js';

describe('dashboardRepository.findQueueActivityCandidates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('scopes queue activity to the appointment scheduled day', async () => {
        const dateRange = {
            start: new Date('2026-06-18T18:30:00.000Z'),
            end: new Date('2026-06-19T18:30:00.000Z'),
        };

        mockPrisma.queueEntry.findMany.mockResolvedValue([]);

        await dashboardRepository.findQueueActivityCandidates('clinic-id', dateRange);

        expect(mockPrisma.queueEntry.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    clinicId: 'clinic-id',
                    appointment: {
                        scheduledAt: {
                            gte: dateRange.start,
                            lt: dateRange.end,
                        },
                    },
                }),
            })
        );
    });
});
