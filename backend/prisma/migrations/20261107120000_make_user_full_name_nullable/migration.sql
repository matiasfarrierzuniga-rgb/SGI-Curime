-- PENDING_HUMAN_DATABASE_APPROVAL
-- Required by C3-AUTH-US01: a community account created from email only has no
-- asserted personal name. Existing values remain unchanged; this is reversible
-- only after every NULL row has an institutionally sourced name.
ALTER TABLE "User" ALTER COLUMN "fullName" DROP NOT NULL;
