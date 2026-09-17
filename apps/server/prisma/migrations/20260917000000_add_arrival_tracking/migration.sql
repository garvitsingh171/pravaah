-- AlterTable
ALTER TABLE "clinics"
ADD COLUMN "lateArrivalGraceMinutes" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "appointments"
ADD COLUMN "arrivedAt" TIMESTAMP(3),
ADD COLUMN "arrivalOffsetMinutes" INTEGER,
ADD COLUMN "isLateArrival" BOOLEAN,
ADD COLUMN "lateArrivalGraceMinutes" INTEGER;
