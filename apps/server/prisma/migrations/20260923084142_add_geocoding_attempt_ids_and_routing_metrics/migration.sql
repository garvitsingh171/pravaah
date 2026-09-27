-- CreateEnum
CREATE TYPE "RoutingStatus" AS ENUM ('NOT_CALCULATED', 'CALCULATED', 'FAILED');

-- CreateEnum
CREATE TYPE "RoutingProvider" AS ENUM ('GEOAPIFY');

-- CreateEnum
CREATE TYPE "RoutingMode" AS ENUM ('DRIVE');

-- CreateEnum
CREATE TYPE "RoutingTrafficModel" AS ENUM ('FREE_FLOW');

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "geocodingAttemptId" TEXT;

-- AlterTable
ALTER TABLE "patient_clinics" ADD COLUMN     "estimatedTravelTimeMinutes" INTEGER,
ADD COLUMN     "routedAt" TIMESTAMP(3),
ADD COLUMN     "routingAttemptId" TEXT,
ADD COLUMN     "routingMode" "RoutingMode",
ADD COLUMN     "routingProvider" "RoutingProvider",
ADD COLUMN     "routingSourceHash" TEXT,
ADD COLUMN     "routingStatus" "RoutingStatus" NOT NULL DEFAULT 'NOT_CALCULATED',
ADD COLUMN     "routingTrafficModel" "RoutingTrafficModel";

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "geocodingAttemptId" TEXT;
