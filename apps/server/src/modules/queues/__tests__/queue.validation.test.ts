import { describe, expect, it } from 'vitest';
import { reorderQueueBodySchema, updateQueueStatusBodySchema } from '../queue.validation.js';

describe('reorderQueueBodySchema', () => {
    const first = '40000000-0000-4000-8000-000000000001';
    const second = '40000000-0000-4000-8000-000000000002';
    const request = {
        date: '2026-09-15',
        queueEntryIds: [second, first],
        expectedQueueEntryIds: [first, second],
    };

    it('requires the complete confirmed order', () => {
        expect(reorderQueueBodySchema.safeParse(request).success).toBe(true);
        expect(
            reorderQueueBodySchema.safeParse({
                date: request.date,
                queueEntryIds: request.queueEntryIds,
            }).success
        ).toBe(false);
        expect(
            reorderQueueBodySchema.safeParse({ ...request, expectedQueueEntryIds: [first, first] })
                .success
        ).toBe(false);
    });
});

describe('updateQueueStatusBodySchema', () => {
    it('uses the same terminal reason contract as appointment status updates', () => {
        expect(
            updateQueueStatusBodySchema.safeParse({
                status: 'CANCELLED',
                cancellationReason: 'DOCTOR_UNAVAILABLE',
            }).success
        ).toBe(true);
        expect(
            updateQueueStatusBodySchema.safeParse({
                status: 'NO_SHOW',
                noShowReason: 'UNKNOWN',
            }).success
        ).toBe(true);
    });

    it('rejects missing, mismatched, and non-terminal reason fields', () => {
        expect(updateQueueStatusBodySchema.safeParse({ status: 'CANCELLED' }).success).toBe(false);
        expect(
            updateQueueStatusBodySchema.safeParse({
                status: 'NO_SHOW',
                cancellationReason: 'PATIENT_REQUEST',
            }).success
        ).toBe(false);
        expect(
            updateQueueStatusBodySchema.safeParse({
                status: 'COMPLETED',
                noShowReason: 'UNKNOWN',
            }).success
        ).toBe(false);
    });
});
