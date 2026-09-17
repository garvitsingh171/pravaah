-- AlterTable
ALTER TABLE "patient_clinics"
ADD COLUMN "totalCompletedVisits" INTEGER NOT NULL DEFAULT 0;

-- Backfill the new aggregate from authoritative terminal appointment outcomes.
UPDATE "patient_clinics" AS patient_clinic
SET "totalCompletedVisits" = completed_visits."count"
FROM (
    SELECT
        "clinicId",
        "patientId",
        COUNT(*)::integer AS "count"
    FROM "appointments"
    WHERE "status" = 'COMPLETED'::"AppointmentStatus"
    GROUP BY "clinicId", "patientId"
) AS completed_visits
WHERE patient_clinic."clinicId" = completed_visits."clinicId"
  AND patient_clinic."patientId" = completed_visits."patientId";

-- Backfill the latest known completed visit without replacing a newer existing value.
UPDATE "patient_clinics" AS patient_clinic
SET "lastVisitAt" = completed_visits."lastVisitAt"
FROM (
    SELECT
        appointment."clinicId",
        appointment."patientId",
        MAX(queue_entry."completedAt") AS "lastVisitAt"
    FROM "appointments" AS appointment
    INNER JOIN "queue_entries" AS queue_entry
        ON queue_entry."appointmentId" = appointment."id"
       AND queue_entry."clinicId" = appointment."clinicId"
       AND queue_entry."patientId" = appointment."patientId"
    WHERE appointment."status" = 'COMPLETED'::"AppointmentStatus"
      AND queue_entry."status" = 'COMPLETED'::"QueueStatus"
      AND queue_entry."completedAt" IS NOT NULL
    GROUP BY appointment."clinicId", appointment."patientId"
) AS completed_visits
WHERE patient_clinic."clinicId" = completed_visits."clinicId"
  AND patient_clinic."patientId" = completed_visits."patientId"
  AND (
      patient_clinic."lastVisitAt" IS NULL
      OR patient_clinic."lastVisitAt" < completed_visits."lastVisitAt"
  );
