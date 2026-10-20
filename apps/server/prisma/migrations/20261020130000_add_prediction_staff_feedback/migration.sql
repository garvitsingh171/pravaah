CREATE TYPE "PredictionFeedbackUsefulness" AS ENUM ('USEFUL', 'NOT_USEFUL', 'UNSURE');
CREATE TYPE "PredictionFeedbackAction" AS ENUM (
  'CONTACTED_PATIENT',
  'REMINDER_SENT',
  'ATTENDANCE_CONFIRMED',
  'RESCHEDULED_APPOINTMENT',
  'MONITORED_APPOINTMENT',
  'NO_ACTION',
  'OTHER'
);

CREATE TABLE "prediction_feedback" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "predictionId" UUID NOT NULL,
  "staffUserId" UUID NOT NULL,
  "usefulness" "PredictionFeedbackUsefulness" NOT NULL,
  "actionTaken" "PredictionFeedbackAction" NOT NULL,
  "note" TEXT,
  "recommendationSnapshot" JSONB NOT NULL,
  "recommendationVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "prediction_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_feedback_predictionId_staffUserId_key"
  ON "prediction_feedback"("predictionId", "staffUserId");
CREATE INDEX "prediction_feedback_staffUserId_createdAt_idx"
  ON "prediction_feedback"("staffUserId", "createdAt");
ALTER TABLE "prediction_feedback" ADD CONSTRAINT "prediction_feedback_predictionId_fkey"
  FOREIGN KEY ("predictionId") REFERENCES "no_show_predictions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_feedback" ADD CONSTRAINT "prediction_feedback_staffUserId_fkey"
  FOREIGN KEY ("staffUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
