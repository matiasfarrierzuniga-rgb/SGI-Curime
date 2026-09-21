CREATE TYPE "InstitutionalOrganizationType" AS ENUM ('INTEGRAL', 'SPECIFIC');

CREATE TABLE "InstitutionalProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "legalName" TEXT,
    "legalIdentification" TEXT,
    "dinadecoRegistrationCode" TEXT,
    "dinadecoRegion" TEXT,
    "organizationType" "InstitutionalOrganizationType",
    "province" TEXT,
    "canton" TEXT,
    "district" TEXT,
    "locality" TEXT,
    "correspondenceAddress" TEXT,
    "phone" TEXT,
    "telefax" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InstitutionalProfile_singleton_check" CHECK ("id" = 1)
);

INSERT INTO "InstitutionalProfile" ("id") VALUES (1);
