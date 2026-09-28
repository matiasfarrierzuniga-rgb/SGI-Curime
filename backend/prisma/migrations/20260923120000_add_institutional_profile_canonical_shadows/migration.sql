-- Preparation only: canonical values remain nullable until controlled reconciliation.
-- All columns live on existing InstitutionalProfile singleton; no second root is created.
ALTER TABLE "InstitutionalProfile"
    ADD COLUMN "canonicalLegalName" VARCHAR(200),
    ADD COLUMN "canonicalLegalIdentification" VARCHAR(64),
    ADD COLUMN "canonicalDinadecoRegistrationCode" VARCHAR(64),
    ADD COLUMN "canonicalOrganizationType" VARCHAR(100),
    ADD COLUMN "canonicalRegion" VARCHAR(100),
    ADD COLUMN "canonicalProvince" VARCHAR(100),
    ADD COLUMN "canonicalCanton" VARCHAR(100),
    ADD COLUMN "canonicalDistrict" VARCHAR(100),
    ADD COLUMN "canonicalPhysicalAddress" VARCHAR(500),
    ADD COLUMN "canonicalNotificationPhone" VARCHAR(40),
    ADD COLUMN "canonicalNotificationFax" VARCHAR(40),
    ADD COLUMN "canonicalNotificationEmail" VARCHAR(254);
