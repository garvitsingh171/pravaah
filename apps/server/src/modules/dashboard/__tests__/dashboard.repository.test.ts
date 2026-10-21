import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
    $queryRaw: vi.fn(),
    appointment: {
        findMany: vi.fn(),
    },
    queueEntry: {
        findMany: vi.fn(),
    },
}));

vi.mock('../../../config/prisma.js', () => ({
    prisma: mockPrisma,
}));

import { dashboardRepository } from '../dashboard.repository.js';

describe('dashboardRepository.findAppointmentsMissingNoShowPrediction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('backfills only future scheduled or confirmed appointments', async () => {
        mockPrisma.$queryRaw.mockResolvedValueOnce([
            {
                start: new Date('2026-10-20T00:00:00.000Z'),
                end: new Date('2026-10-21T00:00:00.000Z'),
            },
        ]);
        mockPrisma.appointment.findMany.mockResolvedValue([]);

        await dashboardRepository.findAppointmentsMissingNoShowPrediction(
            'clinic-id',
            '2026-10-20',
            'Asia/Kolkata'
        );

        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { in: ['SCHEDULED', 'CONFIRMED'] },
                    scheduledAt: expect.objectContaining({
                        gt: expect.any(Date),
                    }),
                }),
            })
        );
    });
});

describe('dashboardRepository.findUpcomingNoShowIntelligenceCandidates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses clinic-local inclusive-start/exclusive-end boundaries and only active future appointments', async () => {
        const start = new Date('2026-06-18T18:30:00.000Z');
        const end = new Date('2026-07-18T18:30:00.000Z');
        const now = new Date('2026-06-20T10:00:00.000Z');
        mockPrisma.$queryRaw.mockResolvedValueOnce([{ start, end }]);
        mockPrisma.appointment.findMany.mockResolvedValue([]);

        await dashboardRepository.findUpcomingNoShowIntelligenceCandidates(
            'clinic-id', '2026-06-19', '2026-07-18', 'Asia/Kolkata', now
        );

        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                clinicId: 'clinic-id',
                scheduledAt: { gte: now, lt: end },
                status: { in: ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED'] },
            }),
            orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
        }));
    });
});

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
