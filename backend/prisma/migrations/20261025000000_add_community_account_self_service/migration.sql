-- Additive community-account lifecycle. Do not apply outside an approved deployment.
ALTER TABLE "User" ALTER COLUMN "identification" DROP NOT NULL;

ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'PENDING_EMAIL_VERIFICATION';

CREATE TYPE "AccountActivationTokenPurpose" AS ENUM (
  'LEGACY_ACCOUNT_ACTIVATION',
  'COMMUNITY_EMAIL_VERIFICATION'
);

ALTER TABLE "AccountActivationToken"
  ADD COLUMN "purpose" "AccountActivationTokenPurpose" NOT NULL DEFAULT 'LEGACY_ACCOUNT_ACTIVATION';

INSERT INTO "Role" ("name", "description", "isActive", "createdAt", "updatedAt")
VALUES (
  'Cuenta comunitaria',
  'Acceso mínimo para una cuenta comunitaria verificada.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;
