---
title: SGI-Curime Consolidated Relational Model
status: TARGET FROZEN
version: v1
---

# SGI-Curime Target Relational Model v1

## Authority and reading state

This is canonical consolidated Target documentation. It freezes Target
Relational Model v1 before Prisma, migration, or application changes.
Where a prior accepted Target document or ERD differs on AssemblyMinute,
GovernanceMembership seat nullability, or FundingAllocation enforcement, this
consolidated documentation takes precedence.

| Label | Meaning |
| --- | --- |
| AS-IS | Implemented Prisma/migration state. |
| TARGET FROZEN | Accepted final v1 shape; not implemented merely by appearing here. |
| TRANSITIONAL | Temporary migration/reconciliation structure outside final inventory. |
| LEGACY | Current field, enum, or relation to retire only after evidence-based transition. |
| DEFERRED | Explicitly outside Target v1. |

Sources: [Current model](./current-model.md), [Target model](./target-model.md),
[integrity rules](./integrity-rules.md), [decision register](./target-model-decision-register.md),
[accepted ERD pack](./erd/README.md), and [ADI/DINADECO source mapping](../requirements/adi-dinadeco-source-mapping.md).

## Canonical precedence

Data-model decisions use this precedence:

1. `consolidated-relational-model.md`
2. `consolidated-data-dictionary.md`
3. `as-is-to-target-matrix.md`
4. `erd/consolidated-master-erd.md`
5. `target-model-decision-register.md`
6. `integrity-rules.md`
7. `logical-model.md`
8. `conceptual-model.md`
9. Earlier Target working documents

The first four artifacts are canonical Target v1 relational-model package.
Earlier documents remain engineering history and rationale; they are not
deleted. When they contradict this consolidated package, the consolidated
decision wins.

`TARGET_PERSISTENT_ENTITIES=40`
`TRANSITIONAL_ENTITIES=1`
`MASTER_RELATIONSHIPS=61`

## Frozen boundary

Target v1 is single-organization. `OrganizationProfile` is its
database-enforced singleton root; `organizationId` is not distributed through
domain tables. The inventory contains exactly these 40 persistent entities:

| Domain | Persistent Target entities |
| --- | --- |
| Organization | `OrganizationProfile` |
| Identity and access | `Person`, `Role`, `Permission`, `RolePermission`, `User`, `Session`, `AuditLog`, `PasswordResetToken`, `AccountActivationToken`, `UserRequest` |
| Affiliation | `Affiliate`, `AffiliateRequest`, `AffiliateSanction` |
| Governance | `GovernancePosition`, `GovernanceTerm`, `GovernanceMembership` |
| Assemblies | `Assembly`, `AssemblyCall`, `AssemblyConvocation`, `AssemblyAttendance`, `AbsenceJustification`, `AssemblyMinute`, `AssemblyResolution` |
| Reservations and events | `Event`, `ReservableResource`, `Reservation` |
| Finance and donations | `FinancialAccount`, `FinancialCharge`, `Payment`, `FinancialMovement`, `Donation`, `Expense`, `ExpenseDocument`, `Disbursement`, `FundingAllocation` |
| Inventory | `InventoryCategory`, `InventoryItem`, `InventoryMovement`, `InventoryLoan` |

`IdentityReconciliationManifest` is the sole TRANSITIONAL entity. It remains
outside the 40 persistent entities and is not expanded into a permanent domain
concept.

## Current and Target boundary

`OrganizationProfile=TARGET_FROZEN`.

`InstitutionalProfile` is not currently implemented in the AS-IS Prisma
baseline represented by this freeze. Current implementation gaps are
implementation work; they do not invalidate the canonical Target model. AS-IS
evidence is not rewritten to make Current appear closer to Target.

## Identity and RBAC

- `Person` is canonical physical identity. Its structured names are
  `firstName`, `firstSurname`, nullable `secondSurname`, and nullable
  transitional `legacyFullName`.
- Identity key is `(identificationType, normalizedIdentification)`.
- Final `User.personId` and `Affiliate.personId` are required unique FKs to
  `Person`. Existing nullable links and duplicated personal fields are LEGACY
  until reconciliation permits retirement.
- `User` is an access account; `Affiliate` is institutional affiliation. They
  remain separate from each other and from `Person`.
- `Role` is software authorization only. `Permission` and `RolePermission`
  persist capability grants. Default deny applies when a grant is absent.
- Each user has exactly one `Role`. Target v1 has no `UserPermission`,
  `UserRole`, `PersonRole`, or `AffiliateRole`.
- Requests retain submitted snapshots. A reconciliation link never rewrites a
  historical request snapshot.
- `Affiliate.roleId` is LEGACY. It does not describe a governance office and
  must be retired only after its historical treatment is evidenced.

## Organization and governance

- `OrganizationProfile` is final canonical name. `InstitutionalProfile` is a
  legacy naming alias, not another Target table.
- The singleton profile carries legal identity, DINADECO registration,
  organization classification, institutional contact, and geographic fields
  listed in the consolidated dictionary. These fields support reporting
  requirements; they do not claim the data is already present AS-IS.
- `GovernanceTerm` is final canonical name for the legacy review name
  `BoardTerm`. Lifecycle is `PLANNED -> ACTIVE -> CLOSED` and
  `PLANNED/ACTIVE -> CANCELLED`; `CLOSED` and `CANCELLED` are terminal.
- `GovernancePosition` is a persistent catalog replacing the `BoardPosition`
  enum concept. It is not a security role.
- `GovernanceMembership` is final canonical name for `BoardAppointment`. It
  references `Affiliate`, `GovernanceTerm`, and `GovernancePosition`; optional
  `seatNumber` distinguishes seats only when required by a position.
- A membership can optionally reference its appointing `Assembly`. Historic
  membership must never be inferred from security-role names alone.
- Active seat uniqueness applies only when `seatNumber` is present:
  `(termId, positionId, seatNumber)` where `endedAt IS NULL` and
  `seatNumber IS NOT NULL`.

## Assemblies

- `Assembly` remains aggregate root. `AssemblyCall` persists numbered calls,
  including first and second call, and owns schedule/quorum data.
- `AssemblyConvocation` identifies one invited `Affiliate` per assembly and
  can snapshot an optional `GovernanceMembership`. Its current `Role` relation
  is LEGACY.
- `AssemblyAttendance.convocationId` is a required unique FK. One convocation
  has zero or one attendance record.
- `AbsenceJustification.attendanceId` is a required unique FK. It is separate
  from attendance status and only supports an absence.
- Assembly-minute cardinality is frozen: `Assembly 1 -> 0..1 AssemblyMinute`.
  `AssemblyMinute.assemblyId` is required and unique. Drafts or files do not
  create additional logical minute rows.
- `AssemblyResolution` belongs to an `Assembly`; one assembly can adopt zero
  or many resolutions. A resolution can authorize zero or many expenses.

## Reservations and finance

- `Reservation`, `FinancialCharge`, `Payment`, and `FinancialMovement` are
  distinct concepts.
- A `FREE` reservation creates no `FinancialCharge`. An approved `FIXED`
  reservation can create at most one charge, via unique
  `FinancialCharge.reservationId`. Exact settlement remains v1 behavior.
- `Payment.movementId` is a required unique FK in final Target. The payment
  movement is an `INCOME`, has `PAYMENT` origin, and matches amount/currency.
- Every `FinancialMovement` belongs to one `FinancialAccount`. It is immutable
  ledger evidence after posting, is never hard-deleted, and uses controlled
  void metadata or a separate reversal through `reversalOfId`.
- Generic `FinancialMovement.source` and `sourceId` are LEGACY. `originType`
  classifies an origin; it is not a polymorphic relation substitute.
- `Expense` is authorization/formal registration. `Disbursement` is material
  execution. A disbursement has required unique `movementId` ledger evidence.
- `ExpenseDocument` belongs only to an expense; no generic attachment is
  introduced.
- `FundingAllocation` assigns funding to an expense; it is not payment
  execution. Its amount is positive. An expense may receive many allocations;
  an income movement may fund many allocations.
- Allocation invariants are frozen: sum allocated to an expense cannot exceed
  `Expense.amount`; sum allocated against an income movement cannot exceed its
  available amount; reversed or voided income cannot fund new allocations.
  `incomeMovementId` is nullable only for legacy or unreconciled funding
  origin.

## Donations and inventory

- `Donation` is a business record, not a `FinancialMovement`. Its optional
  `donorPersonId` does not require a `User` or `Affiliate`.
- `Donation.originalMovementId` is final required unique ledger evidence.
  `Donation.reversalMovementId` is LEGACY; reversal uses
  `FinancialMovement.reversalOfId`. Cancellation never deletes financial
  history. `donorName` and `donorIdentification` snapshots are TRANSITIONAL
  until final cleanup policy closes.
- `InventoryMovement` is stock ledger evidence. `quantityDelta` is signed and
  non-zero: ENTRY positive, EXIT negative, ADJUSTMENT signed, and
  OPENING_BALANCE is controlled migration evidence.
- `InventoryItem.currentQuantity` means available quantity and cannot be
  negative.
- `InventoryLoan` has explicit optional unique `checkoutMovementId`,
  `returnMovementId`, and `cancellationMovementId`, plus `cancelledById`.
  Text such as `LOAN-{id}` is LEGACY evidence, never a relational FK.

## Frozen cleanup and deferral

REMOVE_LATER inventory:

- Duplicated User/Affiliate identity fields
- Affiliate.roleId
- Convocation Role relation/snapshot semantics
- Composite attendance/justification keys
- AttendanceStatus.JUSTIFIED
- Legacy reservation statuses
- FinancialMovement.source / sourceId
- Donation.reversalMovementId
- Unsigned inventory movement quantity
- Textual LOAN-{id} references

REMOVE_LATER does not authorize immediate deletion. Removal requires
replacement implemented, backfill completed, verification passed, reads
switched, writes switched, and migration gate passed.

DEFERRED from Target v1: `Project`, `PlanWork`, `Provider`,
`AffiliateSignature`, `Warehouse`, `StockLocation`, `InventoryAsset`,
`InventoryLoanLine`, `UnitOfMeasure`, `UserPermission`, and `UserRole`.

DEFER means not part of current Target v1 implementation scope. It does not
mean permanently rejected.

## Reporting evidence and exclusions

Official ADI/DINADECO templates influence institutional fields, governance
representation, expense/funding traceability, and invariants. They do not
mechanically generate tables. Reports and derived balances remain derived
outputs, not persistent Target entities unless already in the 40-entity
inventory.

No Prisma schema, migration, seed, backend, or frontend change is authorized
by this document.

## ADD_STATUS_NOTE: V1.1 post-merge status

Frozen Target v1 (40 persistent + 1 transitional + 61 relationships) remains
the historical design baseline. Frozen Target v1.1 (49 persistent + 1
transitional + 77 persistent Target relationships) is now merged at main@71aa989
(PR #102). Structural implementation is verified and integrated.

**V1 baseline preserved:** 40 persistent entities, 1 transitional entity
(`IdentityReconciliationManifest`), 61 master relationships. These counts and
design decisions are frozen as historical engineering evidence.

**V1.1 structural implementation:** 49 persistent entities, 1 transitional
entity, 77 persistent Target relationships. The merged implementation provides
the V1.1 structural contract. Evidence-dependent cutover remains deferred per
the documented gates (ID-01, ASM-ATT-01, FIN-ORIGIN-01, FIN-DON-01, INV-LEDGER-01,
INV-LOAN-01, ASM-DATE-01, RES-STATUS-01). Do not treat structural
implementation as completed historical reconciliation.

**Package distinction:** V1 package (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`)
distinguishes the frozen historical design from the actual merged V1.1
implementation. The V1.1 package `IMPLEMENTATION_STATUS=IMPLEMENTED` reflects
the merged state at main@71aa989.

**Current model:** Reflects physical implementation at main@71aa989 with 49
persistent entities and 1 transitional entity. The gap between current
physical shape and V1.1 Target shape is documented in the migration roadmap
and gap matrix, not in this frozen baseline.
