import { apiClient } from '../../lib';

export type PredictionFeedbackUsefulness = 'USEFUL' | 'NOT_USEFUL' | 'UNSURE';
export type PredictionFeedbackAction =
    | 'CONTACTED_PATIENT'
    | 'REMINDER_SENT'
    | 'ATTENDANCE_CONFIRMED'
    | 'RESCHEDULED_APPOINTMENT'
    | 'MONITORED_APPOINTMENT'
    | 'NO_ACTION'
    | 'OTHER';

export type PredictionFeedback = {
    id: string;
    predictionId: string;
    usefulness: PredictionFeedbackUsefulness;
    actionTaken: PredictionFeedbackAction;
    note: string | null;
    recommendationSnapshot: string[];
    recommendationVersion: string;
    createdAt: string;
    updatedAt: string;
};

export type PredictionFeedbackPayload = Pick<PredictionFeedback, 'usefulness' | 'actionTaken'> & {
    note?: string;
};

export async function getPredictionFeedback(predictionId: string, signal?: AbortSignal) {
    const data = await apiClient.get<{ feedback: PredictionFeedback | null }>(
        `/predictions/${predictionId}/feedback`, { signal }
    );
    return data.feedback;
}

export async function savePredictionFeedback(predictionId: string, payload: PredictionFeedbackPayload) {
    const data = await apiClient.put<{ feedback: PredictionFeedback }>(
        `/predictions/${predictionId}/feedback`, payload
    );
    return data.feedback;
}
