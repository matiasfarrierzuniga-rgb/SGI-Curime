CREATE TYPE "AssemblyQuorumType" AS ENUM ('FIXED', 'PERCENTAGE');

ALTER TABLE "Assembly"
  ADD COLUMN "quorumType" "AssemblyQuorumType",
  ADD COLUMN "quorumValue" INTEGER,
  ADD COLUMN "convocationsLockedAt" TIMESTAMP(3),
  ADD CONSTRAINT "Assembly_quorum_value_check" CHECK (
    ("quorumType" IS NULL AND "quorumValue" IS NULL)
    OR ("quorumType" = 'FIXED' AND "quorumValue" > 0)
    OR ("quorumType" = 'PERCENTAGE' AND "quorumValue" > 0 AND "quorumValue" <= 100)
  );

CREATE TABLE "AssemblyConvocation" (
  "id" SERIAL NOT NULL,
  "assemblyId" INTEGER NOT NULL,
  "affiliateId" INTEGER NOT NULL,
  "roleId" INTEGER,
  "roleNameSnapshot" TEXT NOT NULL,
  "convenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssemblyConvocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssemblyConvocation_assemblyId_affiliateId_key" ON "AssemblyConvocation"("assemblyId", "affiliateId");
CREATE INDEX "AssemblyConvocation_assemblyId_idx" ON "AssemblyConvocation"("assemblyId");
CREATE INDEX "AssemblyConvocation_affiliateId_idx" ON "AssemblyConvocation"("affiliateId");
CREATE INDEX "AssemblyConvocation_roleId_idx" ON "AssemblyConvocation"("roleId");

ALTER TABLE "AssemblyConvocation" ADD CONSTRAINT "AssemblyConvocation_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssemblyConvocation" ADD CONSTRAINT "AssemblyConvocation_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AssemblyConvocation" ADD CONSTRAINT "AssemblyConvocation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
