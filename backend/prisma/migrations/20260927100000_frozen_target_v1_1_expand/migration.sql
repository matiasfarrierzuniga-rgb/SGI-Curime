-- Frozen Target V1.1 expand wave.
-- Additive only: legacy columns, enum labels, tables, and relationships remain.
-- Evidence-dependent links stay nullable; no historical facts are fabricated.

CREATE TYPE "GovernanceTermStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "AssemblyType" AS ENUM ('ORDINARY', 'EXTRAORDINARY');
CREATE TYPE "FinancialMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'SINPE_MOVIL', 'CHECK', 'OTHER');
CREATE TYPE "FinancialMovementOriginType" AS ENUM ('MANUAL', 'PAYMENT', 'DONATION', 'DISBURSEMENT');
CREATE TYPE "FinancialMovementStatus" AS ENUM ('POSTED', 'VOIDED');
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE "FundingSourceType" AS ENUM ('FONDO_POR_GIRAR', 'IMPUESTO_CEMENTO', 'OWN_FUNDS', 'OTHER');
CREATE TYPE "VolunteerOpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VolunteerSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VolunteerApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "VolunteerParticipationStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "VolunteerAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');
CREATE TYPE "VentureStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "VenturePublicationStatus" AS ENUM ('UNPUBLISHED', 'PUBLISHED');
CREATE TYPE "VentureRequestPurpose" AS ENUM ('REGISTRATION', 'UPDATE');
CREATE TYPE "VentureRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

ALTER TYPE "InventoryMovementType" ADD VALUE IF NOT EXISTS 'OPENING_BALANCE' BEFORE 'ENTRY';

CREATE TABLE "Permission" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

CREATE TABLE "RolePermission" (
  "roleId" INTEGER NOT NULL,
  "permissionId" INTEGER NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId"),
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

CREATE TABLE "GovernancePosition" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GovernancePosition_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GovernancePosition_code_key" ON "GovernancePosition"("code");

ALTER TABLE "BoardTerm" ADD COLUMN "status" "GovernanceTermStatus";
ALTER TABLE "BoardAppointment"
  ADD COLUMN "positionId" INTEGER,
  ADD COLUMN "affiliateId" INTEGER,
  ADD COLUMN "appointedByAssemblyId" INTEGER;
CREATE INDEX "BoardAppointment_positionId_idx" ON "BoardAppointment"("positionId");
CREATE INDEX "BoardAppointment_affiliateId_idx" ON "BoardAppointment"("affiliateId");
CREATE INDEX "BoardAppointment_appointedByAssemblyId_idx" ON "BoardAppointment"("appointedByAssemblyId");

ALTER TABLE "Assembly"
  ADD COLUMN "assemblyType" "AssemblyType",
  ADD COLUMN "scheduledAt" TIMESTAMP(3),
  ADD COLUMN "heldAt" TIMESTAMP(3);
-- Exact legacy date -> scheduled date mapping is frozen and does not infer heldAt.
UPDATE "Assembly" SET "scheduledAt" = "date" WHERE "scheduledAt" IS NULL;
CREATE INDEX "Assembly_scheduledAt_idx" ON "Assembly"("scheduledAt");

CREATE TABLE "AssemblyCall" (
  "id" SERIAL NOT NULL,
  "assemblyId" INTEGER NOT NULL,
  "callNumber" INTEGER NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "quorumType" "AssemblyQuorumType" NOT NULL,
  "quorumValue" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssemblyCall_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssemblyCall_callNumber_check" CHECK ("callNumber" > 0),
  CONSTRAINT "AssemblyCall_quorum_check" CHECK (
    ("quorumType" = 'FIXED' AND "quorumValue" > 0)
    OR ("quorumType" = 'PERCENTAGE' AND "quorumValue" BETWEEN 1 AND 100)
  ),
  CONSTRAINT "AssemblyCall_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AssemblyCall_assemblyId_callNumber_key" ON "AssemblyCall"("assemblyId", "callNumber");
CREATE INDEX "AssemblyCall_scheduledAt_idx" ON "AssemblyCall"("scheduledAt");

ALTER TABLE "AssemblyConvocation"
  ADD COLUMN "governanceMembershipId" INTEGER,
  ADD COLUMN "positionNameSnapshot" TEXT;
CREATE INDEX "AssemblyConvocation_governanceMembershipId_idx" ON "AssemblyConvocation"("governanceMembershipId");

ALTER TABLE "AssemblyAttendance" ADD COLUMN "convocationId" INTEGER;
ALTER TABLE "AbsenceJustification" ADD COLUMN "attendanceId" INTEGER;
CREATE UNIQUE INDEX "AssemblyAttendance_convocationId_key" ON "AssemblyAttendance"("convocationId");
CREATE UNIQUE INDEX "AbsenceJustification_attendanceId_key" ON "AbsenceJustification"("attendanceId");

CREATE TABLE "AssemblyMinute" (
  "id" SERIAL NOT NULL,
  "assemblyId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssemblyMinute_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssemblyMinute_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AssemblyMinute_assemblyId_key" ON "AssemblyMinute"("assemblyId");

CREATE TABLE "AssemblyResolution" (
  "id" SERIAL NOT NULL,
  "assemblyId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssemblyResolution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssemblyResolution_assemblyId_fkey" FOREIGN KEY ("assemblyId") REFERENCES "Assembly"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AssemblyResolution_assemblyId_idx" ON "AssemblyResolution"("assemblyId");

ALTER TABLE "ReservableResource" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'CRC';

CREATE TABLE "FinancialAccount" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'CRC',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FinancialAccount_code_key" ON "FinancialAccount"("code");

ALTER TABLE "Payment" ADD COLUMN "movementId" INTEGER, ADD COLUMN "financialMethod" "FinancialMethod";
CREATE UNIQUE INDEX "Payment_movementId_key" ON "Payment"("movementId");

ALTER TABLE "FinancialMovement"
  ADD COLUMN "accountId" INTEGER,
  ADD COLUMN "originType" "FinancialMovementOriginType",
  ADD COLUMN "status" "FinancialMovementStatus",
  ADD COLUMN "reversalOfId" INTEGER,
  ADD COLUMN "voidedAt" TIMESTAMP(3),
  ADD COLUMN "voidedById" INTEGER,
  ADD COLUMN "voidReason" TEXT;
CREATE INDEX "FinancialMovement_accountId_idx" ON "FinancialMovement"("accountId");
CREATE INDEX "FinancialMovement_status_occurredAt_idx" ON "FinancialMovement"("status", "occurredAt");
CREATE UNIQUE INDEX "FinancialMovement_reversalOfId_key" ON "FinancialMovement"("reversalOfId");

ALTER TABLE "Donation" ADD COLUMN "donorPersonId" INTEGER, ADD COLUMN "financialMethod" "FinancialMethod";
CREATE INDEX "Donation_donorPersonId_idx" ON "Donation"("donorPersonId");

CREATE TABLE "Expense" (
  "id" SERIAL NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CRC',
  "incurredAt" TIMESTAMP(3) NOT NULL,
  "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
  "authorizationResolutionId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Expense_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "Expense_authorizationResolutionId_fkey" FOREIGN KEY ("authorizationResolutionId") REFERENCES "AssemblyResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Expense_authorizationResolutionId_idx" ON "Expense"("authorizationResolutionId");
CREATE INDEX "Expense_status_incurredAt_idx" ON "Expense"("status", "incurredAt");

CREATE TABLE "ExpenseDocument" (
  "id" SERIAL NOT NULL,
  "expenseId" INTEGER NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpenseDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExpenseDocument_size_check" CHECK ("size" > 0),
  CONSTRAINT "ExpenseDocument_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ExpenseDocument_expenseId_idx" ON "ExpenseDocument"("expenseId");

CREATE TABLE "Disbursement" (
  "id" SERIAL NOT NULL,
  "expenseId" INTEGER NOT NULL,
  "movementId" INTEGER NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CRC',
  "method" "FinancialMethod" NOT NULL,
  "reference" TEXT,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Disbursement_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "Disbursement_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Disbursement_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Disbursement_movementId_key" ON "Disbursement"("movementId");
CREATE INDEX "Disbursement_expenseId_idx" ON "Disbursement"("expenseId");

CREATE TABLE "FundingAllocation" (
  "id" SERIAL NOT NULL,
  "expenseId" INTEGER NOT NULL,
  "sourceType" "FundingSourceType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "incomeMovementId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundingAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FundingAllocation_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "FundingAllocation_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "FundingAllocation_incomeMovementId_fkey" FOREIGN KEY ("incomeMovementId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "FundingAllocation_expenseId_idx" ON "FundingAllocation"("expenseId");
CREATE INDEX "FundingAllocation_incomeMovementId_idx" ON "FundingAllocation"("incomeMovementId");

ALTER TABLE "InventoryMovement" ADD COLUMN "quantityDelta" INTEGER;
ALTER TABLE "InventoryLoan"
  ADD COLUMN "cancelledById" INTEGER,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "checkoutMovementId" INTEGER,
  ADD COLUMN "returnMovementId" INTEGER,
  ADD COLUMN "cancellationMovementId" INTEGER;
CREATE UNIQUE INDEX "InventoryLoan_checkoutMovementId_key" ON "InventoryLoan"("checkoutMovementId");
CREATE UNIQUE INDEX "InventoryLoan_returnMovementId_key" ON "InventoryLoan"("returnMovementId");
CREATE UNIQUE INDEX "InventoryLoan_cancellationMovementId_key" ON "InventoryLoan"("cancellationMovementId");
CREATE INDEX "InventoryLoan_cancelledById_idx" ON "InventoryLoan"("cancelledById");

CREATE TABLE "VolunteerOpportunity" (
  "id" SERIAL NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "location" TEXT,
  "capacity" INTEGER, "applicationDeadline" TIMESTAMP(3),
  "status" "VolunteerOpportunityStatus" NOT NULL DEFAULT 'DRAFT', "createdByUserId" INTEGER NOT NULL,
  "publishedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3), "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VolunteerOpportunity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolunteerOpportunity_capacity_check" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "VolunteerOpportunity_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "VolunteerOpportunity_createdByUserId_idx" ON "VolunteerOpportunity"("createdByUserId");
CREATE INDEX "VolunteerOpportunity_status_applicationDeadline_idx" ON "VolunteerOpportunity"("status", "applicationDeadline");

CREATE TABLE "VolunteerSession" (
  "id" SERIAL NOT NULL, "opportunityId" INTEGER NOT NULL, "title" TEXT, "description" TEXT,
  "location" TEXT, "startAt" TIMESTAMP(3) NOT NULL, "endAt" TIMESTAMP(3) NOT NULL,
  "status" "VolunteerSessionStatus" NOT NULL DEFAULT 'SCHEDULED', "cancelledAt" TIMESTAMP(3),
  "cancellationReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VolunteerSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolunteerSession_dates_check" CHECK ("startAt" < "endAt"),
  CONSTRAINT "VolunteerSession_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "VolunteerSession_opportunityId_startAt_idx" ON "VolunteerSession"("opportunityId", "startAt");

CREATE TABLE "VolunteerApplication" (
  "id" SERIAL NOT NULL, "opportunityId" INTEGER NOT NULL, "personId" INTEGER,
  "submittedFullName" TEXT NOT NULL, "submittedIdentificationType" "IdentificationType",
  "submittedIdentification" TEXT, "submittedNormalizedIdentification" TEXT, "submittedEmail" TEXT,
  "submittedPhone" TEXT, "motivation" TEXT, "status" "VolunteerApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedByUserId" INTEGER,
  "reviewedAt" TIMESTAMP(3), "rejectionReason" TEXT, "withdrawnAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolunteerApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VolunteerApplication_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "VolunteerApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "VolunteerApplication_opportunityId_status_idx" ON "VolunteerApplication"("opportunityId", "status");
CREATE INDEX "VolunteerApplication_personId_status_idx" ON "VolunteerApplication"("personId", "status");
CREATE INDEX "VolunteerApplication_submittedNormalizedIdentification_idx" ON "VolunteerApplication"("submittedNormalizedIdentification");
CREATE INDEX "VolunteerApplication_reviewedByUserId_idx" ON "VolunteerApplication"("reviewedByUserId");
CREATE UNIQUE INDEX "VolunteerApplication_pending_person_key" ON "VolunteerApplication"("opportunityId", "personId") WHERE "status" = 'PENDING' AND "personId" IS NOT NULL;

CREATE TABLE "VolunteerParticipation" (
  "id" SERIAL NOT NULL, "opportunityId" INTEGER NOT NULL, "personId" INTEGER NOT NULL,
  "applicationId" INTEGER NOT NULL, "status" "VolunteerParticipationStatus" NOT NULL DEFAULT 'CONFIRMED',
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3), "cancellationReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VolunteerParticipation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolunteerParticipation_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "VolunteerOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VolunteerParticipation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VolunteerParticipation_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "VolunteerApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VolunteerParticipation_applicationId_key" ON "VolunteerParticipation"("applicationId");
CREATE UNIQUE INDEX "VolunteerParticipation_opportunityId_personId_key" ON "VolunteerParticipation"("opportunityId", "personId");
CREATE INDEX "VolunteerParticipation_personId_status_idx" ON "VolunteerParticipation"("personId", "status");
CREATE INDEX "VolunteerParticipation_opportunityId_status_idx" ON "VolunteerParticipation"("opportunityId", "status");

CREATE TABLE "VolunteerAttendance" (
  "id" SERIAL NOT NULL, "participationId" INTEGER NOT NULL, "sessionId" INTEGER NOT NULL,
  "status" "VolunteerAttendanceStatus" NOT NULL, "checkInAt" TIMESTAMP(3), "checkOutAt" TIMESTAMP(3),
  "creditedHours" DECIMAL(8,2) NOT NULL DEFAULT 0, "notes" TEXT, "recordedByUserId" INTEGER NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VolunteerAttendance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VolunteerAttendance_hours_check" CHECK ("creditedHours" >= 0),
  CONSTRAINT "VolunteerAttendance_times_check" CHECK ("checkInAt" IS NULL OR "checkOutAt" IS NULL OR "checkInAt" <= "checkOutAt"),
  CONSTRAINT "VolunteerAttendance_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "VolunteerParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VolunteerAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VolunteerSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VolunteerAttendance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VolunteerAttendance_participationId_sessionId_key" ON "VolunteerAttendance"("participationId", "sessionId");
CREATE INDEX "VolunteerAttendance_sessionId_status_idx" ON "VolunteerAttendance"("sessionId", "status");
CREATE INDEX "VolunteerAttendance_recordedByUserId_idx" ON "VolunteerAttendance"("recordedByUserId");

CREATE TABLE "Venture" (
  "id" SERIAL NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "offerDescription" TEXT,
  "businessPhone" TEXT, "businessEmail" TEXT, "websiteUrl" TEXT, "socialUrl" TEXT, "locationText" TEXT,
  "status" "VentureStatus" NOT NULL DEFAULT 'ACTIVE',
  "publicationStatus" "VenturePublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
  "incorporatedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Venture_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Venture_publication_check" CHECK ("publicationStatus" <> 'PUBLISHED' OR "status" = 'ACTIVE')
);
CREATE INDEX "Venture_status_publicationStatus_idx" ON "Venture"("status", "publicationStatus");

CREATE TABLE "VentureAssociation" (
  "id" SERIAL NOT NULL, "personId" INTEGER NOT NULL, "ventureId" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL, "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VentureAssociation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VentureAssociation_dates_check" CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt"),
  CONSTRAINT "VentureAssociation_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VentureAssociation_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "VentureAssociation_personId_idx" ON "VentureAssociation"("personId");
CREATE INDEX "VentureAssociation_ventureId_idx" ON "VentureAssociation"("ventureId");
CREATE UNIQUE INDEX "VentureAssociation_open_person_venture_key" ON "VentureAssociation"("personId", "ventureId") WHERE "endedAt" IS NULL;

CREATE TABLE "VentureRequest" (
  "id" SERIAL NOT NULL, "purpose" "VentureRequestPurpose" NOT NULL,
  "status" "VentureRequestStatus" NOT NULL DEFAULT 'SUBMITTED', "reconciledPersonId" INTEGER,
  "ventureId" INTEGER, "resolvedAt" TIMESTAMP(3), "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VentureRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VentureRequest_target_check" CHECK (
    ("purpose" <> 'UPDATE' OR "ventureId" IS NOT NULL)
    AND ("purpose" <> 'REGISTRATION' OR "status" <> 'APPROVED' OR "ventureId" IS NOT NULL)
  ),
  CONSTRAINT "VentureRequest_resolution_check" CHECK (
    (("status" IN ('APPROVED', 'REJECTED', 'WITHDRAWN')) AND "resolvedAt" IS NOT NULL)
    OR (("status" NOT IN ('APPROVED', 'REJECTED', 'WITHDRAWN')) AND "resolvedAt" IS NULL)
  ),
  CONSTRAINT "VentureRequest_reconciledPersonId_fkey" FOREIGN KEY ("reconciledPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "VentureRequest_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "VentureRequest_reconciledPersonId_idx" ON "VentureRequest"("reconciledPersonId");
CREATE INDEX "VentureRequest_ventureId_idx" ON "VentureRequest"("ventureId");
CREATE INDEX "VentureRequest_status_createdAt_idx" ON "VentureRequest"("status", "createdAt");

CREATE TABLE "VentureRequestRevision" (
  "id" SERIAL NOT NULL, "requestId" INTEGER NOT NULL, "revisionNumber" INTEGER NOT NULL,
  "payloadVersion" INTEGER NOT NULL, "submittedData" JSONB NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VentureRequestRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VentureRequestRevision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VentureRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VentureRequestRevision_requestId_revisionNumber_key" ON "VentureRequestRevision"("requestId", "revisionNumber");

-- Nullable Target relationships. NOT VALID avoids claiming historical coverage;
-- PostgreSQL still enforces each constraint for new/changed rows.
ALTER TABLE "UserRequest" ADD CONSTRAINT "UserRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "BoardAppointment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "GovernancePosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "BoardAppointment_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "BoardAppointment" ADD CONSTRAINT "BoardAppointment_appointedByAssemblyId_fkey" FOREIGN KEY ("appointedByAssemblyId") REFERENCES "Assembly"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "AssemblyConvocation" ADD CONSTRAINT "AssemblyConvocation_governanceMembershipId_fkey" FOREIGN KEY ("governanceMembershipId") REFERENCES "BoardAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "AssemblyAttendance" ADD CONSTRAINT "AssemblyAttendance_convocationId_fkey" FOREIGN KEY ("convocationId") REFERENCES "AssemblyConvocation"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "AbsenceJustification" ADD CONSTRAINT "AbsenceJustification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "AssemblyAttendance"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "FinancialMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorPersonId_fkey" FOREIGN KEY ("donorPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_checkoutMovementId_fkey" FOREIGN KEY ("checkoutMovementId") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_returnMovementId_fkey" FOREIGN KEY ("returnMovementId") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE "InventoryLoan" ADD CONSTRAINT "InventoryLoan_cancellationMovementId_fkey" FOREIGN KEY ("cancellationMovementId") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- Recorder becomes durable ledger evidence. Existing nulls remain pending
-- FIN-ORIGIN-01; changed/new rows get RESTRICT semantics immediately.
ALTER TABLE "FinancialMovement" DROP CONSTRAINT "FinancialMovement_recordedById_fkey";
ALTER TABLE "FinancialMovement" ADD CONSTRAINT "FinancialMovement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
