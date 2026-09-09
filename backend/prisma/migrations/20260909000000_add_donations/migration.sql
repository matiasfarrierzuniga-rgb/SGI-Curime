-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'SINPE_MOVIL', 'OTHER');

-- CreateTable
CREATE TABLE "Donation" (
    "id" SERIAL NOT NULL,
    "donorName" TEXT,
    "donorIdentification" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CRC',
    "method" "DonationMethod" NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "recordedById" INTEGER NOT NULL,
    "cancelledById" INTEGER,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "originalMovementId" INTEGER,
    "reversalMovementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_originalMovementId_key" ON "Donation"("originalMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_reversalMovementId_key" ON "Donation"("reversalMovementId");

-- CreateIndex
CREATE INDEX "Donation_status_idx" ON "Donation"("status");

-- CreateIndex
CREATE INDEX "Donation_method_idx" ON "Donation"("method");

-- CreateIndex
CREATE INDEX "Donation_receivedAt_idx" ON "Donation"("receivedAt");

-- CreateIndex
CREATE INDEX "Donation_recordedById_idx" ON "Donation"("recordedById");

-- CreateIndex
CREATE INDEX "Donation_cancelledById_idx" ON "Donation"("cancelledById");

-- CreateIndex
CREATE INDEX "Donation_status_receivedAt_idx" ON "Donation"("status", "receivedAt");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_originalMovementId_fkey" FOREIGN KEY ("originalMovementId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_reversalMovementId_fkey" FOREIGN KEY ("reversalMovementId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
