-- PENDING_HUMAN_DATABASE_APPROVAL
-- READ-ONLY diagnostics for CORE DATA MODEL REENGINEERING V1.
-- Execute only in a human-authorized environment. Results intentionally avoid
-- returning names, email addresses, or identification values.

-- 1. User -> Person integrity and legacy snapshot coverage.
SELECT
  COUNT(*) FILTER (WHERE "personId" IS NULL) AS users_without_person,
  COUNT(*) FILTER (WHERE "personId" IS NOT NULL) AS users_with_person,
  COUNT(*) FILTER (
    WHERE "personId" IS NULL
      AND "status" <> 'PENDING_EMAIL_VERIFICATION'
  ) AS non_pending_users_without_person
FROM "User";

SELECT u."id" AS "userId", u."personId"
FROM "User" u
LEFT JOIN "Person" p ON p."id" = u."personId"
WHERE u."personId" IS NOT NULL AND p."id" IS NULL
ORDER BY u."id";

SELECT u."id" AS "userId", u."personId"
FROM "User" u
JOIN "Person" p ON p."id" = u."personId"
WHERE u."fullName" IS NOT NULL
  AND NULLIF(BTRIM(CONCAT_WS(' ', p."firstName", p."firstSurname", p."secondSurname")), '') IS NOT NULL
  AND LOWER(REGEXP_REPLACE(BTRIM(u."fullName"), '\s+', ' ', 'g'))
      <> LOWER(REGEXP_REPLACE(BTRIM(CONCAT_WS(' ', p."firstName", p."firstSurname", p."secondSurname")), '\s+', ' ', 'g'))
ORDER BY u."id";

-- 2. Canonical Person completeness. No automatic splitting of legacyFullName.
SELECT p."id" AS "personId",
  (p."firstName" IS NULL) AS "missingFirstName",
  (p."firstSurname" IS NULL) AS "missingFirstSurname",
  (p."identificationType" IS NULL) AS "missingIdentificationType",
  (p."normalizedIdentification" IS NULL) AS "missingNormalizedIdentification",
  (p."legacyFullName" IS NOT NULL) AS "hasLegacyFullName"
FROM "Person" p
WHERE p."firstName" IS NULL
   OR p."firstSurname" IS NULL
   OR p."identificationType" IS NULL
   OR p."normalizedIdentification" IS NULL
ORDER BY p."id";

SELECT "identificationType", "normalizedIdentification", COUNT(*) AS duplicate_count,
  ARRAY_AGG("id" ORDER BY "id") AS person_ids
FROM "Person"
WHERE "identificationType" IS NOT NULL
  AND "normalizedIdentification" IS NOT NULL
GROUP BY "identificationType", "normalizedIdentification"
HAVING COUNT(*) > 1;

-- 3. Affiliate -> Person transition.
SELECT
  COUNT(*) FILTER (WHERE "personId" IS NULL) AS affiliates_without_person,
  COUNT(*) FILTER (WHERE "personId" IS NOT NULL) AS affiliates_with_person
FROM "Affiliate";

SELECT a."id" AS "affiliateId", a."personId"
FROM "Affiliate" a
LEFT JOIN "Person" p ON p."id" = a."personId"
WHERE a."personId" IS NOT NULL AND p."id" IS NULL
ORDER BY a."id";

SELECT a."id" AS "affiliateId", a."personId"
FROM "Affiliate" a
JOIN "Person" p ON p."id" = a."personId"
WHERE LOWER(REGEXP_REPLACE(BTRIM(a."fullName"), '\s+', ' ', 'g'))
      IS DISTINCT FROM
      LOWER(REGEXP_REPLACE(BTRIM(CONCAT_WS(' ', p."firstName", p."firstSurname", p."secondSurname")), '\s+', ' ', 'g'))
ORDER BY a."id";

SELECT "personId", COUNT(*) AS pending_request_count,
  ARRAY_AGG("id" ORDER BY "id") AS request_ids
FROM "AffiliateRequest"
WHERE "status" = 'PENDING' AND "personId" IS NOT NULL
GROUP BY "personId"
HAVING COUNT(*) > 1;

-- 4. Governance canonical links and temporal/history conflicts.
SELECT gm."id" AS "membershipId", gm."personId", gm."affiliateId"
FROM "BoardAppointment" gm
JOIN "Affiliate" a ON a."id" = gm."affiliateId"
WHERE gm."affiliateId" IS NOT NULL
  AND (a."personId" IS NULL OR a."personId" <> gm."personId")
ORDER BY gm."id";

SELECT gm."id" AS "membershipId"
FROM "BoardAppointment" gm
LEFT JOIN "Person" p ON p."id" = gm."personId"
WHERE p."id" IS NULL
ORDER BY gm."id";

SELECT gm."id" AS "membershipId", gm."boardTermId"
FROM "BoardAppointment" gm
JOIN "BoardTerm" gt ON gt."id" = gm."boardTermId"
WHERE (gm."startsOn" IS NOT NULL AND gm."startsOn" < gt."startsOn")
   OR (gm."endsOn" IS NOT NULL AND gm."endsOn" > gt."endsOn")
   OR (gm."startsOn" IS NOT NULL AND gm."endsOn" IS NOT NULL AND gm."startsOn" > gm."endsOn")
ORDER BY gm."id";

SELECT "boardTermId", "positionId", "seatNumber", COUNT(*) AS active_count,
  ARRAY_AGG("id" ORDER BY "id") AS membership_ids
FROM "BoardAppointment"
WHERE "endsOn" IS NULL AND "positionId" IS NOT NULL AND "seatNumber" IS NOT NULL
GROUP BY "boardTermId", "positionId", "seatNumber"
HAVING COUNT(*) > 1;

SELECT
  COUNT(*) FILTER (WHERE "positionId" IS NULL) AS memberships_without_target_position,
  COUNT(*) FILTER (WHERE "positionId" IS NOT NULL) AS memberships_with_target_position,
  COUNT(*) FILTER (WHERE "affiliateId" IS NOT NULL) AS memberships_with_transitional_affiliate
FROM "BoardAppointment";

-- 5. RBAC join integrity (expected zero rows under current PK/FKs).
SELECT rp."roleId", rp."permissionId"
FROM "RolePermission" rp
LEFT JOIN "Role" r ON r."id" = rp."roleId"
LEFT JOIN "Permission" p ON p."id" = rp."permissionId"
WHERE r."id" IS NULL OR p."id" IS NULL;
