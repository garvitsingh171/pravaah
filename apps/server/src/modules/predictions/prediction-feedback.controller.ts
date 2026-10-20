import type { NextFunction, Request, Response } from 'express';
import { predictionFeedbackService } from './prediction-feedback.service.js';
import type { PredictionFeedbackBody } from './prediction-feedback.validation.js';

export async function getPredictionFeedbackController(req: Request, res: Response, next: NextFunction) {
    try {
        const { predictionId } = req.params as { predictionId: string };
        const feedback = await predictionFeedbackService.getOwn(req.user, predictionId);
        res.status(200).json({ success: true, data: { feedback } });
    } catch (error) { next(error); }
}

export async function savePredictionFeedbackController(req: Request, res: Response, next: NextFunction) {
    try {
        const { predictionId } = req.params as { predictionId: string };
        const feedback = await predictionFeedbackService.saveOwn(req.user, predictionId, req.body as PredictionFeedbackBody);
        res.status(200).json({ success: true, message: 'Prediction feedback saved successfully', data: { feedback } });
    } catch (error) { next(error); }
}
