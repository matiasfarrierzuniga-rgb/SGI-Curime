ALTER TABLE "AffiliateRequest"
  ADD COLUMN "submittedLocalityKey" TEXT,
  ADD COLUMN "submittedLocalityCategory" TEXT,
  ADD COLUMN "submittedTerritorialSource" TEXT,
  ADD COLUMN "submittedTerritorialVersion" TEXT,
  ADD COLUMN "submittedTerritorialIntegrity" TEXT;
