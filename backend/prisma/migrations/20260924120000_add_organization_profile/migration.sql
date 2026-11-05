CREATE TABLE "OrganizationProfile" (
  "id" INTEGER NOT NULL,
  "legalName" VARCHAR(200) NOT NULL,
  "legalIdentification" VARCHAR(64) NOT NULL,
  "dinadecoRegistrationCode" VARCHAR(64) NOT NULL,
  "organizationType" VARCHAR(100) NOT NULL,
  "region" VARCHAR(100) NOT NULL,
  "province" VARCHAR(100) NOT NULL,
  "canton" VARCHAR(100) NOT NULL,
  "district" VARCHAR(100) NOT NULL,
  "physicalAddress" VARCHAR(500) NOT NULL,
  "notificationPhone" VARCHAR(40) NOT NULL,
  "notificationFax" VARCHAR(40),
  "notificationEmail" VARCHAR(254) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrganizationProfile_id_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "OrganizationProfile_legalName_nonblank_check" CHECK (btrim("legalName") <> ''),
  CONSTRAINT "OrganizationProfile_legalIdentification_nonblank_check" CHECK (btrim("legalIdentification") <> ''),
  CONSTRAINT "OrganizationProfile_dinadecoRegistrationCode_nonblank_check" CHECK (btrim("dinadecoRegistrationCode") <> ''),
  CONSTRAINT "OrganizationProfile_organizationType_nonblank_check" CHECK (btrim("organizationType") <> ''),
  CONSTRAINT "OrganizationProfile_region_nonblank_check" CHECK (btrim("region") <> ''),
  CONSTRAINT "OrganizationProfile_province_nonblank_check" CHECK (btrim("province") <> ''),
  CONSTRAINT "OrganizationProfile_canton_nonblank_check" CHECK (btrim("canton") <> ''),
  CONSTRAINT "OrganizationProfile_district_nonblank_check" CHECK (btrim("district") <> ''),
  CONSTRAINT "OrganizationProfile_physicalAddress_nonblank_check" CHECK (btrim("physicalAddress") <> ''),
  CONSTRAINT "OrganizationProfile_notificationPhone_nonblank_check" CHECK (btrim("notificationPhone") <> ''),
  CONSTRAINT "OrganizationProfile_notificationFax_nonblank_check" CHECK ("notificationFax" IS NULL OR btrim("notificationFax") <> ''),
  CONSTRAINT "OrganizationProfile_notificationEmail_nonblank_check" CHECK (btrim("notificationEmail") <> '')
);

CREATE FUNCTION prevent_organization_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'OrganizationProfile cannot be deleted'
    USING ERRCODE = '55000';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "OrganizationProfile_prevent_delete"
BEFORE DELETE ON "OrganizationProfile"
FOR EACH ROW EXECUTE FUNCTION prevent_organization_profile_delete();
