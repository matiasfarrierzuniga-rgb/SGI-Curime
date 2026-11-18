-- Additive, non-destructive identity transition.
-- Existing accounts remain valid with a nullable displayName until their holder
-- explicitly supplies one. No Person link or atomic name part is inferred.

ALTER TABLE "User" ADD COLUMN "displayName" TEXT;

ALTER TABLE "UserRequest" ADD COLUMN "submittedNameRaw" TEXT;
ALTER TABLE "AffiliateRequest" ADD COLUMN "submittedNameRaw" TEXT;

-- Preserve the exact submitted value as opaque evidence. Prefer the prior
-- submitted snapshot and fall back to the legacy column only when it is absent.
-- This is not a name parser and does not change any existing generic legacy
-- column.
UPDATE "UserRequest"
SET "submittedNameRaw" = COALESCE("submittedFullName", "fullName")
WHERE "submittedNameRaw" IS NULL
  AND COALESCE("submittedFullName", "fullName") IS NOT NULL;

UPDATE "AffiliateRequest"
SET "submittedNameRaw" = COALESCE("submittedFullName", "fullName")
WHERE "submittedNameRaw" IS NULL
  AND COALESCE("submittedFullName", "fullName") IS NOT NULL;

ALTER TABLE "User"
  ADD CONSTRAINT "User_displayName_length_check"
  CHECK ("displayName" IS NULL OR char_length(btrim("displayName")) BETWEEN 1 AND 100);
