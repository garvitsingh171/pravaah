import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../utils/AppError.js';
import { queueService } from './queue.service.js';
import type { ListQueueQueryInput, QueueClinicIdParamsInput } from './queue.types.js';

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
    };
};

export async function listQueueByClinicDateController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authenticatedReq = req as AuthenticatedRequest;

        if (!authenticatedReq.user?.id) {
            throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required');
        }

        const { clinicId } = req.params as QueueClinicIdParamsInput;
        const { date } = res.locals.validatedQuery as ListQueueQueryInput;

        const queueEntries = await queueService.listQueueByClinicDate(
            authenticatedReq.user.id,
            clinicId,
            date
        );

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