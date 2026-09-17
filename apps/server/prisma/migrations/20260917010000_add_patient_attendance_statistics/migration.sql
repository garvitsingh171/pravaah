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
