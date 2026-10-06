-- Stage C Person-first submitted-snapshot expand wave.
-- Additive only: legacy generic columns, nullable Person links, and existing
-- reconciliation evidence remain intact. No constraint hardening occurs here.

ALTER TABLE "UserRequest"
  ADD COLUMN "submittedFullName" TEXT,
  ADD COLUMN "submittedIdentification" TEXT,
  ADD COLUMN "submittedIdentificationType" "IdentificationType",
  ADD COLUMN "submittedEmail" TEXT,
  ADD COLUMN "submittedPhone" TEXT,
  ADD COLUMN "submittedPhoneCountryCode" TEXT,
  ADD COLUMN "submittedPhoneNationalNumber" TEXT,
  ADD COLUMN "submittedAddress" TEXT,
  ADD COLUMN "submittedReason" TEXT;

ALTER TABLE "AffiliateRequest"
  ADD COLUMN "submittedFullName" TEXT,
  ADD COLUMN "submittedIdentification" TEXT,
  ADD COLUMN "submittedIdentificationType" "IdentificationType",
  ADD COLUMN "submittedBirthDate" TIMESTAMP(3),
  ADD COLUMN "submittedGender" TEXT,
  ADD COLUMN "submittedPhone" TEXT,
  ADD COLUMN "submittedPhoneCountryCode" TEXT,
  ADD COLUMN "submittedPhoneNationalNumber" TEXT,
  ADD COLUMN "submittedEmail" TEXT,
  ADD COLUMN "submittedAddress" TEXT,
  ADD COLUMN "submittedOccupation" TEXT,
  ADD COLUMN "submittedWorkplace" TEXT,
  ADD COLUMN "submittedAffiliationReason" TEXT;

-- Direct value-for-value copy preserves historical submission evidence.
-- fullName stays opaque; no structured Person data is derived or changed.
UPDATE "UserRequest"
SET
  "submittedFullName" = "fullName",
  "submittedIdentification" = "identification",
  "submittedIdentificationType" = "identificationType",
  "submittedEmail" = "email",
  "submittedPhone" = "phone",
  "submittedPhoneCountryCode" = "phoneCountryCode",
  "submittedPhoneNationalNumber" = "phoneNationalNumber",
  "submittedAddress" = "address",
  "submittedReason" = "reason";

UPDATE "AffiliateRequest"
SET
  "submittedFullName" = "fullName",
  "submittedIdentification" = "identification",
  "submittedIdentificationType" = "identificationType",
  "submittedBirthDate" = "birthDate",
  "submittedGender" = "gender",
  "submittedPhone" = "phone",
  "submittedPhoneCountryCode" = "phoneCountryCode",
  "submittedPhoneNationalNumber" = "phoneNationalNumber",
  "submittedEmail" = "email",
  "submittedAddress" = "address",
  "submittedOccupation" = "occupation",
  "submittedWorkplace" = "workplace",
  "submittedAffiliationReason" = "affiliationReason";

-- Supports version-agnostic manifest provenance lookup by source identity.
CREATE INDEX "IdentityReconciliationManifest_sourceModel_sourceId_idx"
ON "IdentityReconciliationManifest"("sourceModel", "sourceId");
