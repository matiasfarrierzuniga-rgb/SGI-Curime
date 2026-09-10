-- Preserve historical affiliates without inventing a role. Application code
-- requires a functional role for every new approved affiliation.
ALTER TABLE "Affiliate" ADD COLUMN "roleId" INTEGER;

CREATE INDEX "Affiliate_roleId_idx" ON "Affiliate"("roleId");

ALTER TABLE "Affiliate"
  ADD CONSTRAINT "Affiliate_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
