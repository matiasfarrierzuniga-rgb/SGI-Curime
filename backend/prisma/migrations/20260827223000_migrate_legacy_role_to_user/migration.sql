BEGIN;

-- Create or reactivate the canonical base role without assuming a fixed id.
INSERT INTO "Role" ("name", "description", "isActive", "createdAt", "updatedAt")
VALUES (
  'Usuario',
  'Cuenta autenticada sin permisos administrativos.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO UPDATE
SET
  "description" = EXCLUDED."description",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- Reassign every legacy account to Usuario, regardless of either role id.
UPDATE "User"
SET
  "roleId" = (SELECT "id" FROM "Role" WHERE "name" = 'Usuario'),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "roleId" IN (
  SELECT "id" FROM "Role" WHERE "name" = 'Vecino/Afiliado'
);

-- Abort instead of leaving an orphaned legacy assignment.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User" AS users
    INNER JOIN "Role" AS roles ON roles."id" = users."roleId"
    WHERE roles."name" = 'Vecino/Afiliado'
  ) THEN
    RAISE EXCEPTION 'Legacy Vecino/Afiliado users remain after reassignment';
  END IF;
END $$;

-- Keep the legacy row for transitional compatibility, but make it unassignable.
UPDATE "Role"
SET
  "isActive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Vecino/Afiliado';

COMMIT;
