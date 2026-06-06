-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "address" TEXT,
    "city" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_clinics" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "totalNoShows" INTEGER NOT NULL DEFAULT 0,
    "totalLateArrivals" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "notes" TEXT,
    "distanceFromClinicKm" DECIMAL(6,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_clinics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_fullName_idx" ON "patients"("fullName");

-- CreateIndex
CREATE INDEX "patient_clinics_clinicId_idx" ON "patient_clinics"("clinicId");

-- CreateIndex
CREATE INDEX "patient_clinics_patientId_idx" ON "patient_clinics"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_clinics_patientId_clinicId_key" ON "patient_clinics"("patientId", "clinicId");

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_clinics" ADD CONSTRAINT "patient_clinics_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
