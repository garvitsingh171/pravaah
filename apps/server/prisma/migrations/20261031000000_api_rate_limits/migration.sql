CREATE TABLE "ApiRateLimitCounter" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "hits" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL
);

CREATE INDEX "ApiRateLimitCounter_expiresAt_idx" ON "ApiRateLimitCounter"("expiresAt");
