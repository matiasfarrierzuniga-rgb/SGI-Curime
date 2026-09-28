---
title: SGI-Curime Consolidated Target Data Dictionary
status: TARGET FROZEN
version: v1
---

# SGI-Curime Consolidated Data Dictionary v1

## Reading rule

This dictionary defines TARGET FROZEN logical fields and constraints. It does
not describe implemented Prisma shape. `?` means nullable. `UQ` means unique.
`LEGACY` and `TRANSITIONAL` fields are not final Target semantics.

## Organization

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `OrganizationProfile` | `id PK` fixed singleton key; `legalName`; `legalIdentification`; `dinadecoRegistrationCode`; `organizationType`; `region`; `province`; `canton`; `district`; `physicalAddress`; `notificationPhone`; `notificationFax?`; `notificationEmail`; timestamps | Exactly one row. Institutional fields are organization data, never copied from Person/User/Affiliate. Reporting templates justify fields, not more entities. |

## Identity, access, and affiliation

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `Person` | `id PK`; `firstName`; `firstSurname`; `secondSurname?`; `legacyFullName? TRANSITIONAL`; `identification?`; `identificationType?`; `normalizedIdentification?`; birth/contact fields; timestamps | UQ `(identificationType, normalizedIdentification)`; physical identity only. |
| `Role` | `id PK`; `name UQ`; `description?`; `isActive`; timestamps | Authorization only; never governance office. |
| `Permission` | `id PK`; `code UQ`; `name`; `description?`; timestamps | Stable capability code. |
| `RolePermission` | `roleId PK/FK`; `permissionId PK/FK` | Composite UQ/PK prevents duplicate grants. |
| `User` | `id PK`; `email UQ`; authentication/status fields; `roleId FK`; `personId FK UQ`; timestamps | Final `personId NOT NULL`; exactly one Role. |
| `Session` | `id PK`; `refreshTokenHash UQ`; expiry/revocation fields; `userId FK` | Raw refresh token is never persisted. |
| `AuditLog` | `id PK`; `action`; `module`; `entityType?`; `entityId?`; `details?`; client context; `userId? FK`; timestamp | Generic entity metadata is descriptive, not a domain FK. |
| `PasswordResetToken` | `id PK`; `tokenHash UQ`; expiry/use fields; `userId FK` | Hash, expiry, and one-use semantics. |
| `AccountActivationToken` | `id PK`; `tokenHash UQ`; expiry/use fields; `userId FK` | Hash, expiry, and one-use semantics. |
| `UserRequest` | `id PK`; submitted identity/contact snapshots; review fields; `reviewedById? FK`; `personId? FK`; timestamps | Submitted snapshot is retained after reconciliation. |
| `Affiliate` | `id PK`; `personId FK UQ`; `affiliateType?`; `affiliationDate`; `status`; timestamps | Final `personId NOT NULL`; no final `roleId`. |
| `AffiliateRequest` | `id PK`; submitted identity/contact snapshots; affiliation reason; review fields; `reviewedById? FK`; `personId? FK`; timestamps | Submitted snapshot is retained after reconciliation. |
| `AffiliateSanction` | `id PK`; reason/detail/date/status; `affiliateId FK`; `createdById FK`; timestamps | Durable institutional evidence. |

## Governance and assemblies

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `GovernancePosition` | `id PK`; `code UQ`; `name`; `description?`; `isActive`; timestamps | Persistent office catalog; not security Role. |
| `GovernanceTerm` | `id PK`; `startDate`; `endDate`; `status`; timestamps | `startDate < endDate`; states: PLANNED, ACTIVE, CLOSED, CANCELLED; only documented transitions permitted. |
| `GovernanceMembership` | `id PK`; `termId FK`; `positionId FK`; `affiliateId FK`; `seatNumber?`; `startedAt`; `endedAt?`; `appointedByAssemblyId? FK`; timestamps | `endedAt` follows `startedAt`; `seatNumber > 0` when present; active seat UQ applies only when seat exists; no UQ `(termId, affiliateId)`. |
| `Assembly` | `id PK`; title/type; `scheduledAt`; `heldAt?`; place/description; status; `convocationsLockedAt?`; timestamps | Aggregate root; held date requires explicit evidence. |
| `AssemblyCall` | `id PK`; `assemblyId FK`; `callNumber`; `scheduledAt`; quorum fields; `startedAt?`; timestamps | UQ `(assemblyId, callNumber)`; positive call number; quorum conditional checks. |
| `AssemblyConvocation` | `id PK`; `assemblyId FK`; `affiliateId FK`; `governanceMembershipId? FK`; `positionNameSnapshot?`; `convenedAt`; timestamps | UQ `(assemblyId, affiliateId)`; no security Role relation. |
| `AssemblyAttendance` | `id PK`; `convocationId FK UQ`; `status`; `registeredAt`; `observations?`; timestamps | One attendance at most per convocation; status is PRESENT or ABSENT. |
| `AbsenceJustification` | `id PK`; `attendanceId FK UQ`; reason/status/review fields; attachment metadata; timestamps | One justification at most per attendance; only applies to ABSENT. |
| `AssemblyMinute` | `id PK`; `assemblyId FK UQ`; `content`; timestamps | One logical minute at most per assembly. Drafts/files are not rows. |
| `AssemblyResolution` | `id PK`; `assemblyId FK`; title/content; `resolvedAt?`; timestamps | An assembly can have many resolutions; no claim that every governance decision is one. |

## Reservations, finance, and donations

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `Event` | `id PK`; `publicId UQ`; title/summary/detail; dates/location; status/publication; timestamps | Distinct from Reservation. |
| `ReservableResource` | `id PK`; name/detail/location/capacity; status; `price?`; `currency`; `pricingType`; timestamps | FREE => price null and no payable charge; FIXED => positive CRC price. |
| `Reservation` | `id PK`; time window/purpose/status; approval/cancellation fields; `resourceId FK`; `requesterUserId FK`; `approvedById? FK`; `eventId? FK`; timestamps | No price snapshot; blocking overlap checks are transactional. |
| `FinancialAccount` | `id PK`; `code UQ`; name/detail/currency; `isActive`; timestamps | Every ledger movement belongs to one account. |
| `FinancialCharge` | `id PK`; `reservationId FK UQ`; amount/currency/status/due date; timestamps | Positive amount; at most one charge per reservation. |
| `Payment` | `id PK`; `chargeId FK`; `movementId FK UQ`; amount/status/method/reference/date; `recordedById? FK`; timestamps | Final `movementId NOT NULL`; explicit income evidence; exact settlement retained. |
| `FinancialMovement` | `id PK`; `accountId FK`; type/amount/currency/description/reference/date; `recordedById FK`; status; `reversalOfId? FK UQ`; void metadata; `originType`; timestamps | Positive amount; type supplies direction; posted fields immutable; no hard delete; no self-reversal; no generic source FK. |
| `Donation` | `id PK`; `donorPersonId? FK`; `donorName? TRANSITIONAL`; `donorIdentification? TRANSITIONAL`; amount/currency/method/reference/detail/date/status; actor/cancellation fields; `originalMovementId FK UQ`; timestamps | Final original movement required and unique; no final reversalMovementId; cancellation preserves ledger history. |
| `Expense` | `id PK`; description/amount/currency/incurred date/status; `authorizationResolutionId? FK`; timestamps | Positive amount; authorization/formal record, not execution. |
| `ExpenseDocument` | `id PK`; `expenseId FK`; originalName/mimeType/size/url; timestamp | Positive size; expense-specific evidence. |
| `Disbursement` | `id PK`; `expenseId FK`; `movementId FK UQ`; amount/currency/method/reference/date; timestamps | Positive amount; explicit unique EXPENSE movement evidence. |
| `FundingAllocation` | `id PK`; `expenseId FK`; `sourceType`; `amount`; `incomeMovementId? FK`; timestamps | Positive amount; income FK non-unique; expense total and income availability caps apply; voided/reversed income cannot accept new allocation. Nullable income only preserves legacy/unreconciled origin. |

## Inventory

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `InventoryCategory` | `id PK`; `name UQ`; description/status; timestamps | Classification only. |
| `InventoryItem` | `id PK`; `code UQ`; name/detail; `currentQuantity`; `minimumQuantity`; textual `unit`; `location?`; status/condition; `categoryId FK`; timestamps | Current quantity means available quantity and is non-negative. Textual unit/location do not create catalogs. |
| `InventoryMovement` | `id PK`; type; `quantityDelta`; reason/reference/notes; `itemId FK`; `createdById? FK`; timestamp | Append-oriented ledger; non-zero signed delta. |
| `InventoryLoan` | `id PK`; quantity; `borrowerNameSnapshot`; dates/status/notes; return/cancellation fields; `itemId FK`; `borrowerAffiliateId? FK`; actor FKs; checkout/return/cancellation movement FKs UQ; timestamps | Positive quantity; one item; linked movements match item, role, sign, and quantity. |

## Transitional and excluded concepts

`IdentityReconciliationManifest` remains TRANSITIONAL and outside the count.

LEGACY fields/relations include duplicated account/affiliate identity fields,
`Affiliate.roleId`, convocation Role fields, generic financial source fields,
`Donation.reversalMovementId`, unsigned inventory movement quantity, textual
loan references, legacy reservation statuses, and composite
assembly/attendance identifiers.

No `Project`, `PlanWork`, `Provider`, `AffiliateSignature`, `Warehouse`,
`StockLocation`, `InventoryAsset`, `InventoryLoanLine`, `UnitOfMeasure`,
`UserPermission`, or `UserRole` entity belongs to Target v1.

## ADD_STATUS_NOTE: Logical dictionary preserved; implementation status note

This Consolidated Data Dictionary preserves the logical Target v1 dictionary as
historical design authority. Field definitions, invariants, and classifications
are unchanged.

**V1.1 implementation status:** The structural contract is now merged at main@71aa989
(PR #102) with 49 persistent entities, 1 transitional entity, and 77 persistent
Target relationships. The logical dictionary remains valid as-designed; however,
the following deferred gates represent evidence-dependent cutover points that
affect which fields become NOT NULL, which LEGACY/TRANSITIONAL fields are
retired, and which invariants are enforced:

- `ID-01`: Person canonical mapping affects `Person.legacyFullName?`, `User.personId NOT NULL`, `Affiliate.personId NOT NULL`
- `ASM-ATT-01`: Attendance/justification FKs affect `AssemblyAttendance.convocationId`, `AbsenceJustification.attendanceId`, `AttendanceStatus`
- `FIN-ORIGIN-01`: Explicit origins affect `FinancialMovement.originType`, `FinancialMovement.source/sourceId`, `Payment.movementId`, `Donation.originalMovementId`
- `FIN-DON-01`: Donation original/reversal affects `Donation.originalMovementId NOT NULL`, `Donation.reversalMovementId` retirement
- `INV-LEDGER-01`: Signed ledger affects `InventoryMovement.quantityDelta`, `InventoryItem.currentQuantity NOT NULL`, `INV-R04`
- `INV-LOAN-01`: Loan movement FKs affect `InventoryLoan.checkoutMovementId/returnMovementId/cancellationMovementId`
- `ASM-DATE-01`: Date mapping affects `Assembly.scheduledAt`, `Assembly.heldAt`, `ASM-R02A`
- `RES-STATUS-01`: Enum cleanup affects `ReservationStatus`, `RES-09`, `RES-10`

**Package distinction:** V1 dictionary (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`) preserves the frozen historical design. The V1.1 package (`IMPLEMENTATION_STATUS=IMPLEMENTED`) reflects the merged state at main@71aa989, but deferred gates require evidence before field retirement or constraint enforcement.

**Current model:** 49 persistent + 1 transitional at main@71aa989. The gap between the V1 dictionary and the current physical shape is documented in the migration roadmap and gap matrix, not in this frozen baseline.

Do not treat structural implementation as completed historical reconciliation.
