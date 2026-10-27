-- Add internal, recipient-scoped notification inbox.
CREATE TYPE "NotificationType" AS ENUM (
  'USER_REQUEST_SUBMITTED',
  'AFFILIATE_REQUEST_SUBMITTED',
  'RESERVATION_SUBMITTED',
  'RESERVATION_APPROVED',
  'RESERVATION_REJECTED'
);

CREATE TYPE "NotificationCategory" AS ENUM ('OPERATIONAL', 'INFORMATIONAL');
CREATE TYPE "NotificationPriority" AS ENUM ('NORMAL');
CREATE TYPE "NotificationResourceType" AS ENUM ('USER_REQUEST', 'AFFILIATE_REQUEST', 'RESERVATION');

CREATE TABLE "Notification" (
  "id" SERIAL NOT NULL,
  "recipientUserId" INTEGER NOT NULL,
  "type" "NotificationType" NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "title" VARCHAR(180) NOT NULL,
  "body" VARCHAR(500) NOT NULL,
  "resourceType" "NotificationResourceType" NOT NULL,
  "resourceId" VARCHAR(80) NOT NULL,
  "deduplicationKey" VARCHAR(255) NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_deduplicationKey_key" ON "Notification"("deduplicationKey");
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");
CREATE INDEX "Notification_recipientUserId_expiresAt_idx" ON "Notification"("recipientUserId", "expiresAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey"
  FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
