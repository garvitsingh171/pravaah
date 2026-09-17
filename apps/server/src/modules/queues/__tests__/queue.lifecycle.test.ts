import { describe, expect, it } from 'vitest';
import { QueueStatus } from '../../../generated/prisma/client.js';
import {
    getAllowedQueueNextStatuses,
    isFinalQueueStatus,
    isQueueStatusTransitionAllowed,
} from '../queue.lifecycle.js';

describe('queue lifecycle policy', () => {
    it('allows the approved queue status transitions', () => {
        expect(getAllowedQueueNextStatuses(QueueStatus.WAITING)).toEqual([
            QueueStatus.ARRIVED,
            QueueStatus.CALLED,
            QueueStatus.COMPLETED,
            QueueStatus.CANCELLED,
            QueueStatus.NO_SHOW,
        ]);
        expect(getAllowedQueueNextStatuses(QueueStatus.ARRIVED)).toEqual([
            QueueStatus.WAITING,
            QueueStatus.CALLED,
            QueueStatus.CANCELLED,
            QueueStatus.NO_SHOW,
        ]);
        expect(getAllowedQueueNextStatuses(QueueStatus.CALLED)).toEqual([
            QueueStatus.COMPLETED,
            QueueStatus.CANCELLED,
            QueueStatus.NO_SHOW,
        ]);
    });

    it('allows waiting entries to become arrived without treating same-status waiting as arrival', () => {
        expect(isQueueStatusTransitionAllowed(QueueStatus.WAITING, QueueStatus.ARRIVED)).toBe(true);
    });

    it('rejects unsupported queue reversals and skips', () => {
        expect(isQueueStatusTransitionAllowed(QueueStatus.CALLED, QueueStatus.WAITING)).toBe(false);
        expect(isQueueStatusTransitionAllowed(QueueStatus.CALLED, QueueStatus.ARRIVED)).toBe(false);
        expect(isQueueStatusTransitionAllowed(QueueStatus.ARRIVED, QueueStatus.COMPLETED)).toBe(
            false
        );
    });

    it('keeps same-status requests idempotent while terminal statuses remain final', () => {
        expect(isQueueStatusTransitionAllowed(QueueStatus.WAITING, QueueStatus.WAITING)).toBe(true);
        expect(isQueueStatusTransitionAllowed(QueueStatus.COMPLETED, QueueStatus.COMPLETED)).toBe(
            true
        );
        expect(isQueueStatusTransitionAllowed(QueueStatus.COMPLETED, QueueStatus.CALLED)).toBe(
            false
        );
        expect(isFinalQueueStatus(QueueStatus.COMPLETED)).toBe(true);
        expect(isFinalQueueStatus(QueueStatus.NO_SHOW)).toBe(true);
        expect(isFinalQueueStatus(QueueStatus.CALLED)).toBe(false);
    });
});
