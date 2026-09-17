import { QueueStatus } from '../../generated/prisma/client.js';

export const finalQueueStatuses: readonly QueueStatus[] = [
    QueueStatus.COMPLETED,
    QueueStatus.CANCELLED,
    QueueStatus.NO_SHOW,
];

export const queueStatusTransitions: Record<QueueStatus, readonly QueueStatus[]> = {
    WAITING: [
        QueueStatus.ARRIVED,
        QueueStatus.CALLED,
        QueueStatus.COMPLETED,
        QueueStatus.CANCELLED,
        QueueStatus.NO_SHOW,
    ],
    ARRIVED: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW],
    CALLED: [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW],
    COMPLETED: [],
    CANCELLED: [],
    NO_SHOW: [],
};

export function isFinalQueueStatus(status: QueueStatus): boolean {
    return finalQueueStatuses.includes(status);
}

export function getAllowedQueueNextStatuses(currentStatus: QueueStatus): readonly QueueStatus[] {
    return queueStatusTransitions[currentStatus];
}

export function isQueueStatusTransitionAllowed(
    currentStatus: QueueStatus,
    requestedStatus: QueueStatus
): boolean {
    // Same-status requests are idempotent retries; callers should avoid duplicate side effects.
    if (currentStatus === requestedStatus) {
        return true;
    }

    return queueStatusTransitions[currentStatus].includes(requestedStatus);
}
