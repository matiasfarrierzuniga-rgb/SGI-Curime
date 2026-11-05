-- Preserve structured name fields for new community registrations; existing rows remain unchanged.
ALTER TABLE "User"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "firstSurname" TEXT,
  ADD COLUMN "secondSurname" TEXT;
