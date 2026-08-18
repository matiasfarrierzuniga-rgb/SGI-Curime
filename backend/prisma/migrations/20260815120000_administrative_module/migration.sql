-- CreateEnum
CREATE TYPE "AssemblyStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIED');

-- CreateEnum
CREATE TYPE "JustificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SanctionStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'REVOKED');

-- CreateTable
CREATE TABLE "Assembly" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "place" TEXT NOT NULL,
    "description" TEXT,
    "status" "AssemblyStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assembly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssemblyAttendance" (
    "id" SERIAL NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observations" TEXT,
    "assemblyId" INTEGER NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssemblyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsenceJustification" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "JustificationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "assemblyId" INTEGER NOT NULL,
    "affiliateId" INTEGER NOT NULL,
    "reviewedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbsenceJustification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateSanction" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SanctionStatus" NOT NULL DEFAULT 'ACTIVE',
    "affiliateId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateSanction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assembly_date_idx" ON "Assembly"("date");
CREATE INDEX "Assembly_status_idx" ON "Assembly"("status");
CREATE INDEX "AssemblyAttendance_assemblyId_status_idx" ON "AssemblyAttendance"("assemblyId", "status");
CREATE INDEX "AssemblyAttendance_affiliateId_idx" ON "AssemblyAttendance"("affiliateId");
CREATE UNIQUE INDEX "AssemblyAttendance_assemblyId_affiliateId_key" ON "AssemblyAttendance"("assemblyId", "affiliateId");
CREATE INDEX "AbsenceJustification_status_idx" ON "AbsenceJustification"("status");
CREATE INDEX "AbsenceJustification_reviewedById_idx" ON "AbsenceJustification"("reviewedById");
CREATE UNIQUE INDEX "AbsenceJustification_assemblyId_affiliateId_key" ON "AbsenceJustification"("assemblyId", "affiliateId");
CREATE INDEX "AffiliateSanction_affiliateId_idx" ON "AffiliateSanction"("affiliateId");
CREATE INDEX "AffiliateSanction_status_idx" ON "AffiliateSanction"("status");
CREATE INDEX "AffiliateSanction_date_idx" ON "AffiliateSanction"("date");
CREATE INDEX "AffiliateSanction_createdById_idx" ON "AffiliateSanction"("createdById");
CREATE UNIQUE INDEX "Affiliate_email_key" ON "Affiliate"("email");
CREATE INDEX "AffiliateRequest_email_idx" ON "AffiliateRequest"("email");
CREATE INDEX "AffiliateRequest_reviewedById_idx" ON "AffiliateRequest"("reviewedById");

-- AddForeignKey
ALTER TABLE "AffiliateRequest" ADD CONSTRAINT "AffiliateRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssemblyAttendance" ADD CONSTRAINT "AssemblyAttendance_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssemblyAttendance" ADD CONSTRAINT "AssemblyAttendance_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AffiliateSanction" ADD CONSTRAINT "AffiliateSanction_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AffiliateSanction" ADD CONSTRAINT "AffiliateSanction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
