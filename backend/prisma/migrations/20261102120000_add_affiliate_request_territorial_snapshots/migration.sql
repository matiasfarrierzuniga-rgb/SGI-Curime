-- SGI-AFF-V1-01 increment M: optional applicant-declared territorial snapshots.
-- Additive only. No catalog, hierarchy, coverage, eligibility, or historical backfill.
ALTER TABLE "AffiliateRequest"
  ADD COLUMN "submittedProvinceCode" TEXT,
  ADD COLUMN "submittedCantonCode" TEXT,
  ADD COLUMN "submittedDistrictCode" TEXT,
  ADD COLUMN "submittedCommunity" TEXT;
