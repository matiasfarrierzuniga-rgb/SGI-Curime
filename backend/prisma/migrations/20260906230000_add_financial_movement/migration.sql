-- CreateEnum
CREATE TYPE "FinancialMovementType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FinancialMovementSource" AS ENUM ('MANUAL', 'RESERVATION_PAYMENT', 'DONATION');

-- CreateTable
CREATE TABLE "FinancialMovement" (
    "id" SERIAL NOT NULL,
    "type" "FinancialMovementType" NOT NULL,
    "source" "FinancialMovementSource" NOT NULL DEFAULT 'MANUAL',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CRC',
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceId" INTEGER,
    "recordedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialMovement_occurredAt_idx" ON "FinancialMovement"("occurredAt");

-- CreateIndex
CREATE INDEX "FinancialMovement_type_occurredAt_idx" ON "FinancialMovement"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "FinancialMovement_source_sourceId_idx" ON "FinancialMovement"("source", "sourceId");

-- CreateIndex
CREATE INDEX "FinancialMovement_recordedById_idx" ON "FinancialMovement"("recordedById");

-- AddForeignKey
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
