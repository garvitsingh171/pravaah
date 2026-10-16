-- Add the generation sources used by rescheduling and feature-driven refreshes.
ALTER TYPE "PredictionGenerationSource" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED';
ALTER TYPE "PredictionGenerationSource" ADD VALUE IF NOT EXISTS 'PATIENT_HISTORY_CHANGED';
ALTER TYPE "PredictionGenerationSource" ADD VALUE IF NOT EXISTS 'TRAVEL_DISTANCE_CHANGED';

CREATE TYPE "PredictionRefreshStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'RETRYABLE_FAILURE',
    'NEEDS_ATTENTION'
);

CREATE TABLE "prediction_refresh_work" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "requestedRevision" INTEGER NOT NULL DEFAULT 1,
    "processedRevision" INTEGER NOT NULL DEFAULT 0,
    "latestTrigger" "PredictionGenerationSource" NOT NULL,
    "status" "PredictionRefreshStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "prediction_refresh_work_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prediction_refresh_work_clinicId_patientId_key"
ON "prediction_refresh_work"("clinicId", "patientId");
CREATE INDEX "prediction_refresh_work_status_nextAttemptAt_idx"
ON "prediction_refresh_work"("status", "nextAttemptAt");
CREATE INDEX "prediction_refresh_work_clinicId_patientId_requestedRevisio_idx"
ON "prediction_refresh_work"("clinicId", "patientId", "requestedRevision");

ALTER TABLE "prediction_refresh_work" ADD CONSTRAINT "prediction_refresh_work_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "prediction_refresh_work" ADD CONSTRAINT "prediction_refresh_work_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
