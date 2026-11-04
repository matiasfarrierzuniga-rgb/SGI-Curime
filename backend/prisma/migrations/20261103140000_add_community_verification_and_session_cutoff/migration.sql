-- Existing accounts retain unknown verification history; no backfill is performed.
ALTER TABLE "User" ADD COLUMN "communityEmailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "sessionsInvalidBefore" TIMESTAMP(3),
  ADD COLUMN "sessionGeneration" INTEGER NOT NULL DEFAULT 0;
