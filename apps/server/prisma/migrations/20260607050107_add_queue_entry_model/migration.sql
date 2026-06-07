-- DropForeignKey
ALTER TABLE "patient_clinics" DROP CONSTRAINT "patient_clinics_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "patient_clinics" DROP CONSTRAINT "patient_clinics_patientId_fkey";

-- CreateTable
CREATE TABLE "queue_entries" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "doctorId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'WAITING',
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_appointmentId_key" ON "queue_entries"("appointmentId");

-- CreateIndex
CREATE INDEX "queue_entries_clinicId_status_idx" ON "queue_entries"("clinicId", "status");

-- CreateIndex
CREATE INDEX "queue_entries_clinicId_doctorId_position_idx" ON "queue_entries"("clinicId", "doctorId", "position");

-- CreateIndex
CREATE INDEX "queue_entries_clinicId_queuedAt_idx" ON "queue_entries"("clinicId", "queuedAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_scheduledAt_idx" ON "appointments"("clinicId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_doctorId_scheduledAt_idx" ON "appointments"("clinicId", "doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_patientId_scheduledAt_idx" ON "appointments"("clinicId", "patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_clinicId_status_idx" ON "appointments"("clinicId", "status");

-- CreateIndex
CREATE INDEX "patient_clinics_isActive_idx" ON "patient_clinics"("isActive");

-- CreateIndex
CREATE INDEX "patients_isActive_idx" ON "patients"("isActive");

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_entries" ADD CONSTRAINT "queue_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
