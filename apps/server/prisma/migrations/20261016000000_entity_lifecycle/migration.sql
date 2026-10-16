ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'REMOVED';

CREATE TABLE "lifecycle_events" (
    "id" UUID NOT NULL,
    "clinicId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lifecycle_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lifecycle_events_clinicId_createdAt_idx" ON "lifecycle_events"("clinicId", "createdAt");
CREATE INDEX "lifecycle_events_entityType_entityId_createdAt_idx" ON "lifecycle_events"("entityType", "entityId", "createdAt");

ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lifecycle_events" ADD CONSTRAINT "lifecycle_events_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
