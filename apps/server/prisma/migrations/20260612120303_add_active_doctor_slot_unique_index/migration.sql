CREATE UNIQUE INDEX "appointment_active_doctor_slot_unique"
ON "appointments" ("clinicId", "doctorId", "scheduledAt")
WHERE "status" IN ('SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED');