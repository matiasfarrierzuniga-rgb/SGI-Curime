-- PENDING_HUMAN_DATABASE_APPROVAL
-- DESTRUCTIVE TARGET PROPOSAL. Execute only after application cutover, backup,
-- diagnostics, reconciliation, and rollback rehearsal. Not a deployable migration.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User"
    WHERE "personId" IS NOT NULL
      AND "fullName" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "Person" p WHERE p."id" = "User"."personId")
  ) THEN
    RAISE EXCEPTION 'User identity reconciliation incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "Affiliate" WHERE "personId" IS NULL
  ) THEN
    RAISE EXCEPTION 'Affiliate.personId reconciliation incomplete';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "BoardAppointment" gm
    JOIN "Affiliate" a ON a."id" = gm."affiliateId"
    WHERE gm."affiliateId" IS NOT NULL
      AND (a."personId" IS NULL OR a."personId" <> gm."personId")
  ) THEN
    RAISE EXCEPTION 'Governance membership identity reconciliation incomplete';
  END IF;
END $$;

-- User becomes access/authentication only. Keep email, credentials, lifecycle,
-- role, session, and optional personId.
ALTER TABLE "User"
  DROP COLUMN "fullName",
  DROP COLUMN "firstName",
  DROP COLUMN "firstSurname",
  DROP COLUMN "secondSurname",
  DROP COLUMN "identification",
  DROP COLUMN "identificationType",
  DROP COLUMN "phone",
  DROP COLUMN "phoneCountryCode",
  DROP COLUMN "phoneNationalNumber",
  DROP COLUMN "address";

-- Affiliate name is functionally dependent on Affiliate.personId -> Person.
-- Other Affiliate attributes need a separate approved semantic classification.
ALTER TABLE "Affiliate" DROP COLUMN "fullName";

-- Transitional convenience link. GovernanceMembership.personId remains source.
ALTER TABLE "BoardAppointment" DROP COLUMN "affiliateId";

-- Replace with COMMIT only during an approved cutover.
ROLLBACK;
