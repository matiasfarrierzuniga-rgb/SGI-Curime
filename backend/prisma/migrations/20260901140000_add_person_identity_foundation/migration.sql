-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "firstSurname" TEXT,
    "secondSurname" TEXT,
    "legacyFullName" TEXT,
    "identification" TEXT,
    "identificationType" "IdentificationType",
    "normalizedIdentification" TEXT,
    "birthDate" TIMESTAMP(3),
    "email" TEXT,
    "phoneCountryCode" TEXT,
    "phoneNationalNumber" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN "personId" INTEGER;

-- AlterTable
ALTER TABLE "AffiliateRequest" ADD COLUMN "personId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "personId" INTEGER;

-- AlterTable
ALTER TABLE "UserRequest" ADD COLUMN "personId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_personId_key" ON "Affiliate"("personId");

-- CreateIndex
CREATE INDEX "UserRequest_personId_idx" ON "UserRequest"("personId");

-- CreateIndex
CREATE INDEX "AffiliateRequest_personId_idx" ON "AffiliateRequest"("personId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateRequest" ADD CONSTRAINT "AffiliateRequest_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
