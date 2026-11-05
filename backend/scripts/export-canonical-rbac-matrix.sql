-- Read-only RBAC V2 evidence export. Run only against the reviewed target database.
-- Does not modify Role, Permission, or RolePermission.
BEGIN TRANSACTION READ ONLY;

SELECT
  r.name AS role_code,
  r.isActive AS role_active,
  p.code AS capability_code,
  p.description AS capability_description
FROM "Role" AS r
LEFT JOIN "RolePermission" AS rp ON rp."roleId" = r.id
LEFT JOIN "Permission" AS p ON p.id = rp."permissionId"
WHERE r.name IN (
  'ROLE_SYSTEM_ADMIN',
  'ROLE_INSTITUTIONAL_PRESIDENT',
  'ROLE_INSTITUTIONAL_SECRETARY',
  'ROLE_INSTITUTIONAL_TREASURER',
  'ROLE_INSTITUTIONAL_OPERATOR',
  'ROLE_COMMUNITY_USER'
)
ORDER BY r.name, p.code NULLS FIRST;

COMMIT;
