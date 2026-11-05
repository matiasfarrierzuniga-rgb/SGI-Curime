-- Forward-only RBAC V2 community-role reconciliation. Apply only through an
-- approved deployment or disposable PostgreSQL validation environment.
INSERT INTO "Role" ("name", "description", "isActive", "createdAt", "updatedAt")
VALUES (
  'ROLE_COMMUNITY_USER',
  'Acceso mínimo para una cuenta comunitaria verificada.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;

DO $$
DECLARE
  canonical_role_id integer;
  legacy_role_id integer;
  canonical_grant_count integer;
BEGIN
  SELECT id INTO canonical_role_id
  FROM "Role"
  WHERE "name" = 'ROLE_COMMUNITY_USER';

  SELECT id INTO legacy_role_id
  FROM "Role"
  WHERE "name" = 'Cuenta comunitaria';

  SELECT count(*) INTO canonical_grant_count
  FROM "RolePermission"
  WHERE "roleId" = canonical_role_id;

  IF canonical_grant_count <> 0 THEN
    RAISE EXCEPTION 'ROLE_COMMUNITY_USER must have zero permissions before transition';
  END IF;

  IF legacy_role_id IS NOT NULL THEN
    UPDATE "User"
    SET "roleId" = canonical_role_id,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "roleId" = legacy_role_id;

    UPDATE "Role"
    SET "isActive" = false,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = legacy_role_id;
  END IF;
END $$;
