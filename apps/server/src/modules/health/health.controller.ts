import type { Request, Response } from 'express';

export function getHealthCheck(req: Request, res: Response) {
    return res.json({
        success: true,
        message: 'Pravaah API is healthy',
    });
}
