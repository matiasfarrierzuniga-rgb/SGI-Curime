-- Existing identity and phone values may be ambiguous. New columns remain nullable
-- so administrators can normalize them later without inferring a document type.
CREATE TYPE "IdentificationType" AS ENUM ('NATIONAL', 'DIMEX');

ALTER TABLE "User"
ADD COLUMN "identificationType" "IdentificationType",
ADD COLUMN "phoneCountryCode" TEXT,
ADD COLUMN "phoneNationalNumber" TEXT;

ALTER TABLE "UserRequest"
ADD COLUMN "identificationType" "IdentificationType",
ADD COLUMN "phoneCountryCode" TEXT,
ADD COLUMN "phoneNationalNumber" TEXT;

ALTER TABLE "Affiliate"
ADD COLUMN "identificationType" "IdentificationType",
ADD COLUMN "phoneCountryCode" TEXT,
ADD COLUMN "phoneNationalNumber" TEXT;

ALTER TABLE "AffiliateRequest"
ADD COLUMN "identificationType" "IdentificationType",
ADD COLUMN "phoneCountryCode" TEXT,
ADD COLUMN "phoneNationalNumber" TEXT;
