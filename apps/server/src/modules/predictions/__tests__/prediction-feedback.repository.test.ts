import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), queryRaw: vi.fn() }));
vi.mock('../../../config/prisma.js', () => ({
    prisma: {
        predictionFeedback: { findUnique: mocks.findUnique },
        $queryRaw: mocks.queryRaw,
    },
}));

import { predictionFeedbackRepository } from '../prediction-feedback.repository.js';

const input = {
    predictionId: 'prediction-id', staffUserId: 'staff-id',
    body: { usefulness: 'USEFUL' as const, actionTaken: 'NO_ACTION' as const, note: null },
    recommendationSnapshot: ['Guidance'], recommendationVersion: 'v1',
};
const saved = { id: 'feedback-id', predictionId: input.predictionId, usefulness: 'USEFUL', actionTaken: 'NO_ACTION', note: null, createdAt: new Date(0), updatedAt: new Date(0) };

describe('predictionFeedbackRepository.save', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('creates or updates atomically through the database unique key', async () => {
        mocks.queryRaw.mockResolvedValue([saved]);
        await predictionFeedbackRepository.save(input);
        expect(mocks.queryRaw).toHaveBeenCalledOnce();
        const statement = mocks.queryRaw.mock.calls[0]![0].sql as string;
        expect(statement).toContain('ON CONFLICT ("predictionId", "staffUserId") DO UPDATE');
        expect(statement).toContain('IS DISTINCT FROM');
    });

    it('returns identical feedback without updating timestamps', async () => {
        mocks.queryRaw.mockResolvedValue([]);
        mocks.findUnique.mockResolvedValue(saved);
        expect(await predictionFeedbackRepository.save(input)).toBe(saved);
        expect(mocks.queryRaw).toHaveBeenCalledOnce();
        expect(mocks.findUnique).toHaveBeenCalledOnce();
    });

    it('updates changed feedback while preserving the original creation time and context snapshot', async () => {
        mocks.queryRaw.mockResolvedValue([saved]);
        await predictionFeedbackRepository.save({ ...input, body: { ...input.body, usefulness: 'UNSURE' } });
        const statement = mocks.queryRaw.mock.calls[0]![0].sql as string;
        const updateClause = statement.split('DO UPDATE SET')[1];
        expect(updateClause).not.toContain('"createdAt" =');
        expect(updateClause).not.toContain('"recommendationSnapshot" =');
        expect(updateClause).not.toContain('"recommendationVersion" =');
    });
});
