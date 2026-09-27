/*
  Warnings:

  - A unique constraint covering the columns `[runKey]` on the table `no_show_predictions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PredictionGenerationSource" AS ENUM ('APPOINTMENT_CREATION', 'BACKFILL', 'LEGACY_EXISTING');

-- DropIndex
DROP INDEX "no_show_predictions_appointmentId_key";

-- AlterTable
ALTER TABLE "no_show_predictions" ADD COLUMN     "featureSchemaVersion" TEXT,
ADD COLUMN     "featureSnapshot" JSONB,
ADD COLUMN     "generationSource" "PredictionGenerationSource" NOT NULL DEFAULT 'LEGACY_EXISTING',
ADD COLUMN     "ruleVersion" TEXT,
ADD COLUMN     "runKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "no_show_predictions_runKey_key" ON "no_show_predictions"("runKey");

-- CreateIndex
CREATE INDEX "no_show_predictions_appointmentId_createdAt_idx" ON "no_show_predictions"("appointmentId", "createdAt");
