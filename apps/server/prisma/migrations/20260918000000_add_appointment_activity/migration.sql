-- CreateEnum
CREATE TYPE "AppointmentActivityType" AS ENUM (
    'APPOINTMENT_CREATED',
    'APPOINTMENT_CONFIRMED',
    'PATIENT_ARRIVED',
    'ENTERED_QUEUE',
    'PATIENT_CALLED',
    'APPOINTMENT_COMPLETED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_NO_SHOW',
    'APPOINTMENT_RESCHEDULED'
);

-- CreateTable
CREATE TABLE "appointment_activities" (
    "id" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "actorUserId" UUID,
    "type" "AppointmentActivityType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointment_activities_appointmentId_occurredAt_idx"
ON "appointment_activities"("appointmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "appointment_activities_clinicId_occurredAt_idx"
ON "appointment_activities"("clinicId", "occurredAt");

-- AddForeignKey
ALTER TABLE "appointment_activities"
ADD CONSTRAINT "appointment_activities_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_activities"
ADD CONSTRAINT "appointment_activities_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "clinics"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_activities"
ADD CONSTRAINT "appointment_activities_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- This migration intentionally creates no activity rows for legacy appointments.
