-- Additive only. A request cannot create a Donation or FinancialMovement.
CREATE TYPE "DonationRequestKind" AS ENUM ('MONETARY', 'IN_KIND');
CREATE TYPE "DonationRequestModality" AS ENUM ('DIGITAL', 'IN_PERSON', 'COORDINATED');
CREATE TYPE "DonationRequestPaymentPreference" AS ENUM ('SINPE', 'BANK_TRANSFER');
CREATE TYPE "DonationRequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'REJECTED', 'CANCELLED');

CREATE TABLE "DonationRequest" (
  "id" UUID NOT NULL,
  "donorName" VARCHAR(160) NOT NULL,
  "email" VARCHAR(254),
  "phone" VARCHAR(32),
  "kind" "DonationRequestKind" NOT NULL,
  "modality" "DonationRequestModality" NOT NULL,
  "paymentPreference" "DonationRequestPaymentPreference",
  "approximateAmount" DECIMAL(14,2),
  "goodsDescription" VARCHAR(2000),
  "comments" VARCHAR(2000),
  "anonymousPublic" BOOLEAN NOT NULL DEFAULT false,
  "status" "DonationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewReason" VARCHAR(1000),
  "reviewedById" INTEGER,
  "reviewedAt" TIMESTAMP(3),
  "idempotencyHash" CHAR(64) NOT NULL,
  "payloadHash" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DonationRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DonationRequest_contact_check" CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL),
  CONSTRAINT "DonationRequest_kind_modality_check" CHECK (
    ("kind" = 'MONETARY' AND "modality" IN ('DIGITAL', 'IN_PERSON') AND "approximateAmount" > 0 AND "goodsDescription" IS NULL AND (("modality" = 'DIGITAL' AND "paymentPreference" IS NOT NULL) OR ("modality" = 'IN_PERSON' AND "paymentPreference" IS NULL))) OR
    ("kind" = 'IN_KIND' AND "modality" IN ('IN_PERSON', 'COORDINATED') AND "paymentPreference" IS NULL AND "approximateAmount" IS NULL AND "goodsDescription" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "DonationRequest_idempotencyHash_key" ON "DonationRequest"("idempotencyHash");
CREATE INDEX "DonationRequest_status_createdAt_idx" ON "DonationRequest"("status", "createdAt");
CREATE INDEX "DonationRequest_reviewedById_idx" ON "DonationRequest"("reviewedById");
ALTER TABLE "DonationRequest" ADD CONSTRAINT "DonationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
