---
title: SGI-Curime AS-IS to Frozen Target Matrix
status: TARGET FROZEN
version: v1
---

# SGI-Curime AS-IS to Target Relational Model v1 Matrix

## Reading state

AS-IS is current Prisma/migration evidence. TARGET FROZEN is approved design,
not implementation. TRANSITION and REMOVE_LATER rows describe legacy handling,
not authorization to change schema or data.

`AS_IS_DOMAIN_MODELS=26`
`TARGET_PERSISTENT_ENTITIES=40`
`TRANSITIONAL_ENTITIES=1`

## Persistent entity classification

| Classification | Count | Interpretation |
| --- | ---: | --- |
| KEEP | 7 | Current entity persists with no Target structural change. |
| EVOLVE | 19 | Current entity persists with Target field, relation, or invariant change. |
| CREATE | 14 | Target persistent entity absent from current Prisma. |
| RENAME | 4 | Consolidation aliases; not additional Target entities or tables. |
| TRANSITION | 1 | Identity reconciliation infrastructure outside final inventory. |

### KEEP

| AS-IS | TARGET FROZEN | Classification |
| --- | --- | --- |
| `Session` | `Session` | KEEP |
| `PasswordResetToken` | `PasswordResetToken` | KEEP |
| `AccountActivationToken` | `AccountActivationToken` | KEEP |
| `AffiliateRequest` | `AffiliateRequest` | KEEP |
| `AffiliateSanction` | `AffiliateSanction` | KEEP |
| `Event` | `Event` | KEEP |
| `InventoryCategory` | `InventoryCategory` | KEEP |

### EVOLVE

| AS-IS | TARGET FROZEN | Classification | Consolidated change |
| --- | --- | --- | --- |
| `Person` | `Person` | EVOLVE | Canonical structured identity and final link ownership. |
| `Role` | `Role` | EVOLVE | Authorization-only semantics. |
| `User` | `User` | EVOLVE | Required unique Person identity; retire duplicated personal fields later. |
| `AuditLog` | `AuditLog` | EVOLVE | Generic references explicitly descriptive only. |
| `UserRequest` | `UserRequest` | EVOLVE | Reviewer FK and preserved submitted snapshots. |
| `Affiliate` | `Affiliate` | EVOLVE | Required unique Person identity; legacy role retired later. |
| `Assembly` | `Assembly` | EVOLVE | Scheduled/held dates and aggregate-root responsibilities. |
| `AssemblyConvocation` | `AssemblyConvocation` | EVOLVE | Affiliate invitation plus optional governance membership, never Role. |
| `AssemblyAttendance` | `AssemblyAttendance` | EVOLVE | Unique `convocationId` replaces composite identity. |
| `AbsenceJustification` | `AbsenceJustification` | EVOLVE | Unique `attendanceId` replaces composite identity. |
| `ReservableResource` | `ReservableResource` | EVOLVE | FREE/FIXED price invariant. |
| `Reservation` | `Reservation` | EVOLVE | Final statuses and no-charge FREE behavior. |
| `FinancialCharge` | `FinancialCharge` | EVOLVE | Approved fixed-price snapshot invariant. |
| `Payment` | `Payment` | EVOLVE | Required unique explicit `movementId`. |
| `FinancialMovement` | `FinancialMovement` | EVOLVE | Account, immutable ledger state, reversal, explicit origins. |
| `Donation` | `Donation` | EVOLVE | Optional Person donor and required unique original movement. |
| `InventoryItem` | `InventoryItem` | EVOLVE | Available non-negative quantity semantics. |
| `InventoryMovement` | `InventoryMovement` | EVOLVE | Signed `quantityDelta` replaces unsigned quantity. |
| `InventoryLoan` | `InventoryLoan` | EVOLVE | Cancellation and explicit ledger-evidence FKs. |

### CREATE

| TARGET FROZEN entity | Classification | Purpose |
| --- | --- | --- |
| `OrganizationProfile` | CREATE | Singleton institutional/DINADECO profile. |
| `Permission` | CREATE | Persistent software capability. |
| `RolePermission` | CREATE | Role-to-capability grant. |
| `GovernancePosition` | CREATE | Institutional office catalog. |
| `GovernanceTerm` | CREATE | Formal governance period. |
| `GovernanceMembership` | CREATE | Historical office occupancy by Affiliate. |
| `AssemblyCall` | CREATE | Numbered assembly call and quorum. |
| `AssemblyMinute` | CREATE | One logical minute per assembly at most. |
| `AssemblyResolution` | CREATE | Formal assembly resolution. |
| `FinancialAccount` | CREATE | Ledger account/cash/fund. |
| `Expense` | CREATE | Formal expense authorization/registration. |
| `ExpenseDocument` | CREATE | Expense-specific documentary evidence. |
| `Disbursement` | CREATE | Material expense execution. |
| `FundingAllocation` | CREATE | Funding assignment to expense. |

### RENAME and TRANSITION

| Prior/review name | Final Target name | Classification | Rule |
| --- | --- | --- | --- |
| `InstitutionalProfile` | `OrganizationProfile` | RENAME | Do not create both tables. Current Prisma has no institutional profile. |
| `BoardTerm` | `GovernanceTerm` | RENAME | Do not create both concepts. |
| `BoardAppointment` | `GovernanceMembership` | RENAME | Do not create both concepts. |
| `BoardPosition` enum | `GovernancePosition` catalog | RENAME | Enum is not a persistent Target entity. |
| `IdentityReconciliationManifest` | `IdentityReconciliationManifest` | TRANSITION | Sole reconciliation infrastructure; excluded from 40. |

## REMOVE_LATER

| AS-IS field, enum, or relation | Target disposition |
| --- | --- |
| Duplicated identity/contact fields in `User` and `Affiliate` | REMOVE_LATER after Person reconciliation. |
| `Affiliate.roleId` | REMOVE_LATER; security Role is not governance office. |
| `AssemblyConvocation.roleId` and role snapshot semantics | REMOVE_LATER after evidenced governance/snapshot transition. |
| Composite attendance/justification assembly-affiliate links | REMOVE_LATER after parent mapping to convocation/attendance. |
| `AttendanceStatus.JUSTIFIED` | REMOVE_LATER; use ABSENT plus `AbsenceJustification`. |
| `ReservationStatus.CONFIRMED` and `COMPLETED` | REMOVE_LATER after compatibility evidence. |
| `FinancialMovement.source` and `sourceId` | REMOVE_LATER after explicit-origin reconciliation. |
| `Donation.reversalMovementId` | REMOVE_LATER; reversal is ledger self-reference. |
| `InventoryMovement.quantity` | REMOVE_LATER after signed-ledger conversion. |
| Textual `LOAN-{id}` reference convention | REMOVE_LATER as relational evidence; explicit FKs replace it. |

## DEFER

| Excluded concept | Classification | Reason |
| --- | --- | --- |
| `Project` | DEFER | No approved Target v1 scope. |
| `PlanWork` | DEFER | Reporting template does not authorize a table mechanically. |
| `Provider` | DEFER | Expense document/reference is not provider master data. |
| `AffiliateSignature` | DEFER | Signatures remain manual/private evidence. |
| `Warehouse` | DEFER | Quantity inventory needs no warehouse model in v1. |
| `StockLocation` | DEFER | Textual item location remains sufficient in v1. |
| `InventoryAsset` | DEFER | No serialized-asset scope. |
| `InventoryLoanLine` | DEFER | One item per loan in v1. |
| `UnitOfMeasure` | DEFER | Textual item unit remains sufficient in v1. |
| `UserPermission` | DEFER | Direct grants are forbidden; use RolePermission. |
| `UserRole` | DEFER | Each user has one role. |

## Consolidation checks

- `InstitutionalProfile` and `OrganizationProfile` do not coexist in Target.
- `BoardTerm` and `GovernanceTerm` do not coexist in Target.
- `BoardAppointment` and `GovernanceMembership` do not coexist in Target.
- `BoardPosition` enum is not counted as a persistent entity.
- Reports, balances, and template output are derived artifacts, not Target
  entities.
- Official templates influence fields and invariants only; they do not add
  tables beyond the frozen 40.

## ADD_STATUS_NOTE: Baseline historical; point to refreshed evidence

This AS-IS to Target v1 matrix is preserved as historical baseline documentation.
It records the v1 design transition from 26 current models to 40 Target persistent
entities, with 1 transitional entity (`IdentityReconciliationManifest`).

**V1.1 implementation status:** The structural contract is now merged at main@71aa989
(PR #102) with 49 persistent entities, 1 transitional entity, and 77 persistent
Target relationships. This matrix no longer describes the current implementation
boundary.

**Current model reference:** For the AS-IS state at merge, refer to
`current-model.md` (49 persistent + 1 transitional, verified at main@71aa989).

**V1.1 implementation status note:** The V1.1 package records `IMPLEMENTATION_STATUS=IMPLEMENTED`
at the merged checkpoint, but evidence-dependent cutover remains deferred per
gates ID-01, ASM-ATT-01, FIN-ORIGIN-01, FIN-DON-01, INV-LEDGER-01, INV-LOAN-01,
ASM-DATE-01, RES-STATUS-01. Structural implementation does not imply completed
historical reconciliation of AS-IS → Target v1.1 gaps.

**Do not use this matrix for V1.1 gap analysis.** Use the V1.1 evolution matrix
(`docs/data/v1.1/evolution/v1-to-v1.1-matrix.md`) and the refreshed current-model
for implementation boundary assessment.
