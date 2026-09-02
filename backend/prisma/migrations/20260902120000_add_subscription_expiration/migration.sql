-- Subscription accounts expire one calendar year after their original creation.
ALTER TABLE "User"
ADD COLUMN "subscriptionExpirationDate" TIMESTAMP(3);

UPDATE "User"
SET "subscriptionExpirationDate" = "User"."createdAt" + INTERVAL '1 year'
FROM "Role"
WHERE "User"."roleId" = "Role"."id"
  AND "Role"."name" = 'Subscription_L1'
  AND "User"."subscriptionExpirationDate" IS NULL;
