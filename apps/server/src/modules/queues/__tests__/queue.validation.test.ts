import { describe, expect, it } from 'vitest';
import { updateQueueStatusBodySchema } from '../queue.validation.js';

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
