import type { Request, Response, NextFunction } from 'express';
import { queueService } from './queue.service.js';
import type {
    ListQueueQueryInput,
    QueueClinicIdParamsInput,
    QueueStatusUpdateParamsInput,
    ReorderQueueBodyInput,
    UpdateQueueStatusBodyInput,
} from './queue.types.js';

export async function listQueueByClinicDateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as QueueClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as ListQueueQueryInput;

        const queueEntries = await queueService.listQueueByClinicDate(req.user, clinicId, date);

        res.status(200).json({
            success: true,
            message: 'Queue fetched successfully',
            data: {
                queueEntries,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function updateQueueStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId, queueEntryId } = req.params as QueueStatusUpdateParamsInput;
        const { status } = req.body as UpdateQueueStatusBodyInput;

        const queueEntry = await queueService.updateQueueStatus(
            req.user,
            clinicId,
            queueEntryId,
            status
        );

        res.status(200).json({
            success: true,
            message: 'Queue status updated successfully',
            data: {
                queueEntry,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function reorderQueueController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as QueueClinicIdParamsInput;
        const { date, queueEntryIds } = req.body as ReorderQueueBodyInput;

        const queueEntries = await queueService.reorderQueue(
            req.user,
            clinicId,
            date,
            queueEntryIds
        );

        res.status(200).json({
            success: true,
            message: 'Queue reordered successfully',
            data: {
                queueEntries,
            },
        });
    } catch (error) {
        next(error);
    }
}
