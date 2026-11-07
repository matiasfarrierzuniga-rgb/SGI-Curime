-- PENDING_HUMAN_DATABASE_APPROVAL
-- TRANSFORMATIVE template. Do not execute as-is.
-- Populate reviewed mappings from institutional evidence; never split fullName
-- automatically and never match Person by email/name alone.

BEGIN;

CREATE TEMP TABLE reviewed_user_person_link (
  user_id INTEGER PRIMARY KEY,
  person_id INTEGER NOT NULL UNIQUE,
  evidence_reference TEXT NOT NULL
) ON COMMIT DROP;

-- Human-reviewed rows belong here before execution, for example:
-- INSERT INTO reviewed_user_person_link VALUES (123, 456, 'EXPEDIENTE-...');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM reviewed_user_person_link m
    LEFT JOIN "User" u ON u."id" = m.user_id
    LEFT JOIN "Person" p ON p."id" = m.person_id
    WHERE u."id" IS NULL OR p."id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Reviewed mapping references a missing User or Person';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM reviewed_user_person_link m
    JOIN "User" u ON u."id" = m.user_id
    WHERE u."personId" IS NOT NULL AND u."personId" <> m.person_id
  ) THEN
    RAISE EXCEPTION 'Reviewed mapping conflicts with an existing User.personId';
  END IF;
END $$;

UPDATE "User" u
SET "personId" = m.person_id,
    "updatedAt" = CURRENT_TIMESTAMP
FROM reviewed_user_person_link m
WHERE u."id" = m.user_id AND u."personId" IS NULL;

-- Human must inspect transaction-local counts and samples before COMMIT.
SELECT COUNT(*) AS reviewed_mapping_count FROM reviewed_user_person_link;
SELECT COUNT(*) AS remaining_non_pending_users_without_person
FROM "User"
WHERE "personId" IS NULL AND "status" <> 'PENDING_EMAIL_VERIFICATION';

-- Replace with COMMIT only after human review.
ROLLBACK;
