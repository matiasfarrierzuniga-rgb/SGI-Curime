-- CreateTable
CREATE TABLE "IdentityReconciliationManifest" (
    "id" SERIAL NOT NULL,
    "manifestVersion" TEXT NOT NULL,
    "normalizationVersion" TEXT NOT NULL,
    "decisionVersion" TEXT NOT NULL,
    "sourceModel" TEXT NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "rawIdentification" TEXT,
    "identificationType" "IdentificationType",
    "normalizedIdentification" TEXT,
    "identityClusterKey" TEXT,
    "classification" TEXT NOT NULL,
    "selectedPersonId" INTEGER,
    "personCreationAllowed" BOOLEAN NOT NULL,
    "conflictCodes" JSONB NOT NULL,
    "nameReconciliationRequired" BOOLEAN NOT NULL,
    "reviewRequired" BOOLEAN NOT NULL,
    "sourceSnapshot" JSONB NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityReconciliationManifest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityReconciliationManifest_normalizationVersion_decisionVersion_sourceModel_sourceId_key" ON "IdentityReconciliationManifest"("normalizationVersion", "decisionVersion", "sourceModel", "sourceId");

-- CreateIndex
CREATE INDEX "IdentityReconciliationManifest_identityClusterKey_idx" ON "IdentityReconciliationManifest"("identityClusterKey");

-- CreateIndex
CREATE INDEX "IdentityReconciliationManifest_classification_reviewRequired_idx" ON "IdentityReconciliationManifest"("classification", "reviewRequired");

-- CreateIndex
CREATE INDEX "IdentityReconciliationManifest_selectedPersonId_idx" ON "IdentityReconciliationManifest"("selectedPersonId");

-- AddForeignKey
ALTER TABLE "IdentityReconciliationManifest" ADD CONSTRAINT "IdentityReconciliationManifest_selectedPersonId_fkey" FOREIGN KEY ("selectedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
