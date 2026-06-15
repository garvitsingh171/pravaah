import type { Request, Response, NextFunction } from 'express';
import { queueService } from './queue.service.js';
import type { ListQueueQueryInput, QueueClinicIdParamsInput } from './queue.types.js';

export async function listQueueByClinicDateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { clinicId } = req.params as QueueClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as ListQueueQueryInput;

        const queueEntries = await queueService.listQueueByClinicDate(clinicId, date);

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
