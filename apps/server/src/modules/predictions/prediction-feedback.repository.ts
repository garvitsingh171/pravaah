import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../config/prisma.js';
import type { PredictionFeedbackBody } from './prediction-feedback.validation.js';

const feedbackSelect = {
    id: true,
    predictionId: true,
    usefulness: true,
    actionTaken: true,
    note: true,
    recommendationSnapshot: true,
    recommendationVersion: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const predictionFeedbackRepository = {
    findPrediction(predictionId: string) {
        return prisma.noShowPrediction.findUnique({
            where: { id: predictionId },
            select: { id: true, clinicId: true, riskLevel: true, reasons: true },
        });
    },

    findOwn(predictionId: string, staffUserId: string) {
        return prisma.predictionFeedback.findUnique({
            where: { predictionId_staffUserId: { predictionId, staffUserId } },
            select: feedbackSelect,
        });
    },

    async save(input: {
        predictionId: string;
        staffUserId: string;
        body: PredictionFeedbackBody;
        recommendationSnapshot: string[];
        recommendationVersion: string;
    }) {
        const where = {
            predictionId_staffUserId: {
                predictionId: input.predictionId,
                staffUserId: input.staffUserId,
            },
        };
        const rows = await prisma.$queryRaw<Array<{
            id: string;
            predictionId: string;
            usefulness: string;
            actionTaken: string;
            note: string | null;
            recommendationSnapshot: unknown;
            recommendationVersion: string;
            createdAt: Date;
            updatedAt: Date;
        }>>(Prisma.sql`
            INSERT INTO "prediction_feedback" (
                "id", "predictionId", "staffUserId", "usefulness", "actionTaken", "note",
                "recommendationSnapshot", "recommendationVersion", "createdAt", "updatedAt"
            ) VALUES (
                gen_random_uuid(), ${input.predictionId}::uuid, ${input.staffUserId}::uuid,
                ${input.body.usefulness}::"PredictionFeedbackUsefulness",
                ${input.body.actionTaken}::"PredictionFeedbackAction",
                ${input.body.note ?? null}, ${JSON.stringify(input.recommendationSnapshot)}::jsonb,
                ${input.recommendationVersion}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
            ON CONFLICT ("predictionId", "staffUserId") DO UPDATE SET
                "usefulness" = EXCLUDED."usefulness",
                "actionTaken" = EXCLUDED."actionTaken",
                "note" = EXCLUDED."note",
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE ("prediction_feedback"."usefulness", "prediction_feedback"."actionTaken", "prediction_feedback"."note")
                IS DISTINCT FROM (EXCLUDED."usefulness", EXCLUDED."actionTaken", EXCLUDED."note")
            RETURNING "id", "predictionId", "usefulness", "actionTaken", "note",
                "recommendationSnapshot", "recommendationVersion", "createdAt", "updatedAt"
        `);

        if (rows[0]) return rows[0];
        return prisma.predictionFeedback.findUnique({ where, select: feedbackSelect });
    },
};
