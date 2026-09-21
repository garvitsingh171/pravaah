-- CreateEnum
CREATE TYPE "GeocodingStatus" AS ENUM ('NOT_GEOCODED', 'GEOCODED', 'FAILED');

-- CreateEnum
CREATE TYPE "GeocodingProvider" AS ENUM ('GEOAPIFY');

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "geocodedAddress" TEXT,
ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "geocodingConfidence" DOUBLE PRECISION,
ADD COLUMN     "geocodingMatchType" TEXT,
ADD COLUMN     "geocodingPlaceId" TEXT,
ADD COLUMN     "geocodingProvider" "GeocodingProvider",
ADD COLUMN     "geocodingResultType" TEXT,
ADD COLUMN     "geocodingSourceHash" TEXT,
ADD COLUMN     "geocodingAttemptId" TEXT,
ADD COLUMN     "geocodingStatus" "GeocodingStatus" NOT NULL DEFAULT 'NOT_GEOCODED',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "geocodedAddress" TEXT,
ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "geocodingConfidence" DOUBLE PRECISION,
ADD COLUMN     "geocodingMatchType" TEXT,
ADD COLUMN     "geocodingPlaceId" TEXT,
ADD COLUMN     "geocodingProvider" "GeocodingProvider",
ADD COLUMN     "geocodingResultType" TEXT,
ADD COLUMN     "geocodingSourceHash" TEXT,
ADD COLUMN     "geocodingAttemptId" TEXT,
ADD COLUMN     "geocodingStatus" "GeocodingStatus" NOT NULL DEFAULT 'NOT_GEOCODED',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
