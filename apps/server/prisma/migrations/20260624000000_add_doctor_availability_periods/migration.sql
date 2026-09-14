-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "doctor_availability_periods" (
    "id" UUID NOT NULL,
    "doctorClinicId" UUID NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_availability_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_periods_doctorClinicId_weekday_startTime_endTime_key" ON "doctor_availability_periods"("doctorClinicId", "weekday", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "doctor_availability_periods_doctorClinicId_weekday_startTime_idx" ON "doctor_availability_periods"("doctorClinicId", "weekday", "startTime");

-- AddForeignKey
ALTER TABLE "doctor_availability_periods" ADD CONSTRAINT "doctor_availability_periods_doctorClinicId_fkey" FOREIGN KEY ("doctorClinicId") REFERENCES "doctor_clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
