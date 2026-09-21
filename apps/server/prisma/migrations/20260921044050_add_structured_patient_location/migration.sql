-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT;

-- Backfill only the known legacy address text. Do not infer city, state,
-- country, or pincode from historical free-form values.
UPDATE "patients"
SET "addressLine1" = "address"
WHERE "addressLine1" IS NULL
  AND "address" IS NOT NULL
  AND BTRIM("address") <> '';
