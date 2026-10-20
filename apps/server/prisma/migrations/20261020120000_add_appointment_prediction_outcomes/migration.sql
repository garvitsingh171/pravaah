CREATE TYPE "AppointmentActualOutcome" AS ENUM (
    'PENDING',
    'ATTENDED',
    'NO_SHOW',
    'CANCELLED',
    'EXCLUDED'
);

CREATE TYPE "AppointmentOutcomeSource" AS ENUM (
    'ARRIVAL_EVIDENCE',
    'COMPLETED_STATUS',
    'NO_SHOW_STATUS',
    'CANCELLATION_STATUS',
    'UNRESOLVED',
    'CONFLICTING_EVIDENCE'
);

CREATE TABLE "appointment_prediction_outcomes" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "actualOutcome" "AppointmentActualOutcome" NOT NULL DEFAULT 'PENDING',
    "actualNoShow" BOOLEAN,
    "outcomeSource" "AppointmentOutcomeSource" NOT NULL DEFAULT 'UNRESOLVED',
    "outcomeRecordedAt" TIMESTAMP(3),
    "evidenceAt" TIMESTAMP(3),
    "exclusionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_prediction_outcomes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "appointment_prediction_outcomes_appointmentId_fkey"
        FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_prediction_outcomes_clinicId_fkey"
        FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointment_prediction_outcomes_label_consistency_check" CHECK (
        ("actualOutcome" = 'ATTENDED' AND "actualNoShow" = FALSE AND "exclusionReason" IS NULL)
        OR ("actualOutcome" = 'NO_SHOW' AND "actualNoShow" = TRUE AND "exclusionReason" IS NULL)
        OR ("actualOutcome" IN ('PENDING', 'CANCELLED') AND "actualNoShow" IS NULL AND "exclusionReason" IS NULL)
        OR ("actualOutcome" = 'EXCLUDED' AND "actualNoShow" IS NULL AND "exclusionReason" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "appointment_prediction_outcomes_appointmentId_key"
    ON "appointment_prediction_outcomes"("appointmentId");
CREATE INDEX "appointment_prediction_outcomes_clinicId_actualOutcome_outc_idx"
    ON "appointment_prediction_outcomes"("clinicId", "actualOutcome", "outcomeRecordedAt");
