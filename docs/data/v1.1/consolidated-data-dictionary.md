---
title: SGI-Curime Consolidated Target Data Dictionary
status: TARGET FROZEN
version: v1.1
---

# SGI-Curime Consolidated Data Dictionary v1.1

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

The Frozen V1 exclusions remain inherited by Target V1.1. Additional V1.1 deferred/excluded concepts are maintained in `deferred-excluded-registry.md`.

## ADD_STATUS_NOTE: Logical dictionary valid; nullable legacy compatibility fields clarification

This Consolidated Data Dictionary v1.1 preserves the logical Target v1.1 dictionary as designed. Field definitions, invariants, and classifications are correct as documented.

**V1.1 implementation status:** The structural contract is now merged and verified at main@71aa989 (PR #102). The V1.1 package `IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989` reflects the merged checkpoint. The logical dictionary remains valid as-designed.

**Nullable legacy compatibility fields:** The following fields remain TRANSITIONAL / nullable until their respective deferred gates are evidenced and enforced. Do not remove NOT NULL or retire LEGACY/TRANSITIONAL designations prematurely:

- `Person.legacyFullName?` — remains TRANSITIONAL until `ID-01` closes
- `User.personId` — nullable and unique at merge; final `NOT NULL` enforcement remains deferred under `ID-01`
- `Affiliate.personId` — nullable and unique at merge; final `NOT NULL` enforcement remains deferred under `ID-01`
- `Affiliate.roleId` — LEGACY; remains until `ID-01` closes and historical treatment is evidenced
- `DonorName?` / `DonorIdentification?` on `Donation` — TRANSITIONAL; remains until `FIN-DON-01` closes
- `FinancialMovement.source` / `sourceId` — LEGACY; remains until `FIN-ORIGIN-01` closes
- `InventoryMovement.quantity` — unsigned; remains until `INV-LEDGER-01` closes and signed-delta conversion is enforced
- `InventoryLoan.borrowerNameSnapshot` — remains; linked movements require evidence per `INV-LOAN-01`
- `Assembly.heldAt?` — nullable; remains until `ASM-DATE-01` closes and evidence-backed backfill
- `ReservationStatus.CONFIRMED` / `COMPLETED` — transitional legacy; remains until `RES-STATUS-01` closes and non-destructive removal

**Package distinction:** V1 dictionary (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`) preserves the frozen historical design. The V1.1 package (`IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989`) reflects the merged state, but deferred gates require evidence before field retirement or constraint enforcement.

**Do not treat structural implementation as completed historical reconciliation.** The dictionary defines target destination; migration gates define sequencing. Current model reflects 49 persistent + 1 transitional at main@71aa989; rule enforcement waits on each gate's evidence exit criterion.


## Volunteering

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `VolunteerOpportunity` | `id PK`; `title`; `description?`; `location?`; `capacity?`; `applicationDeadline?`; `status`; `createdByUserId FK`; lifecycle timestamps/reason; timestamps | `capacity IS NULL OR capacity > 0`; DRAFT may have zero Sessions; PUBLISHED requires qualifying Session; only PUBLISHED accepts new Applications. |
| `VolunteerSession` | `id PK`; `opportunityId FK`; `title?`; `description?`; `location?`; `startAt`; `endAt`; `status`; cancellation fields; timestamps | `startAt < endAt`; cancellation preserves history. |
| `VolunteerApplication` | `id PK`; `opportunityId FK`; `personId? FK`; explicit submitted identity/contact snapshot fields; `motivation?`; `status`; `requestedAt`; `reviewedByUserId? FK`; review/withdrawal fields; timestamps | Submitted snapshot is immutable from Person reconciliation; at most one active reconciled PENDING Application per Person/Opportunity through partial uniqueness; public unreconciled duplicates require workflow validation. |
| `VolunteerParticipation` | `id PK`; `opportunityId FK`; `personId FK`; `applicationId FK UQ`; `status`; `confirmedAt`; completion/cancellation fields; timestamps | UQ `(opportunityId, personId)`; every effective Participation requires Person and one source Application. |
| `VolunteerAttendance` | `id PK`; `participationId FK`; `sessionId FK`; `status`; `checkInAt?`; `checkOutAt?`; `creditedHours`; `notes?`; `recordedByUserId FK`; `recordedAt`; timestamps | UQ `(participationId, sessionId)`; `creditedHours >= 0`; check-in/out chronology; Participation and Session must belong to same Opportunity transactionally; totals are derived. |

### Volunteering enums

```text
VolunteerOpportunityStatus:
DRAFT, PUBLISHED, CLOSED, COMPLETED, CANCELLED

VolunteerSessionStatus:
SCHEDULED, COMPLETED, CANCELLED

VolunteerApplicationStatus:
PENDING, APPROVED, REJECTED, WITHDRAWN

VolunteerParticipationStatus:
CONFIRMED, COMPLETED, CANCELLED

VolunteerAttendanceStatus:
PRESENT, ABSENT, EXCUSED
```

## Entrepreneurship

| Entity | Target fields and keys | Frozen invariants |
| --- | --- | --- |
| `Venture` | `id PK`; `name`; `description?`; `offerDescription?`; business contact/link/location fields nullable; `status`; `publicationStatus`; `incorporatedAt`; timestamps | No UQ name. `PUBLISHED => ACTIVE`. SUSPENDED/CLOSED imply UNPUBLISHED through atomic lifecycle transition. |
| `VentureAssociation` | `id PK`; `personId FK`; `ventureId FK`; `startedAt`; `endedAt?`; timestamps | `endedAt IS NULL OR endedAt >= startedAt`; partial UQ `(personId, ventureId) WHERE endedAt IS NULL`; historical overlap forbidden transactionally. |
| `VentureRequest` | `id PK`; `purpose`; `status`; `reconciledPersonId? FK`; `ventureId? FK`; `resolvedAt?`; `decisionReason?`; timestamps | UPDATE requires Venture; approved REGISTRATION requires Venture; terminal state requires resolvedAt; requester reconciliation does not imply responsibility. |
| `VentureRequestRevision` | `id PK`; `requestId FK`; `revisionNumber`; `payloadVersion`; `submittedData jsonb`; `submittedAt`; `createdAt` | UQ `(requestId, revisionNumber)`; append-only; payload version mandatory and interpretable; JSON is historical proposal evidence only. |

### Entrepreneurship enums

```text
VentureStatus:
ACTIVE, SUSPENDED, CLOSED

VenturePublicationStatus:
UNPUBLISHED, PUBLISHED

VentureRequestPurpose:
REGISTRATION, UPDATE

VentureRequestStatus:
SUBMITTED, UNDER_REVIEW, CHANGES_REQUESTED,
APPROVED, REJECTED, WITHDRAWN
```

## V1.1 counts and transitional boundary

```text
TARGET_PERSISTENT_ENTITIES=49
TRANSITIONAL_ENTITIES=1
MASTER_RELATIONSHIPS=77
```

`IdentityReconciliationManifest` remains the sole transitional entity and stays outside the persistent count.

See also:

- `freeze-declaration.md`
- `target-model-decision-register.md`
- `modules/volunteering-relational-candidate.md`
- `modules/entrepreneurship-relational-candidate.md`
- `deferred-excluded-registry.md`
