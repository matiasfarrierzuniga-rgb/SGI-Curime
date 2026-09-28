---
title: SGI-Curime Consolidated Relational Model
status: TARGET FROZEN
version: v1.1
---

# SGI-Curime Target Relational Model v1.1

## 1. Authority and reading state

This is the canonical consolidated relational reference for Frozen Target V1.1.

It defines the intended destination before Prisma, migration or application changes.

| Label | Meaning |
| --- | --- |
| AS-IS | Implemented Prisma/migration/database state. |
| TARGET FROZEN | Accepted final V1.1 shape; not implemented merely by appearing here. |
| TRANSITIONAL | Temporary reconciliation/migration structure outside persistent inventory. |
| LEGACY | Current representation to retire only after evidence-based transition. |
| DEFERRED | Explicitly outside Target V1.1. |

Canonical V1.1 precedence:

1. `consolidated-relational-model.md`
2. `consolidated-data-dictionary.md`
3. `erd/consolidated-master-erd.md`
4. `target-model-decision-register.md`
5. `integrity-rules.md`
6. `target-model.md`
7. module checkpoints and earlier design evidence

The historical Frozen V1 package remains authoritative evidence for inherited decisions.

```text
TARGET_PERSISTENT_ENTITIES=49
TRANSITIONAL_ENTITIES=1
MASTER_RELATIONSHIPS=77
```

## 2. Frozen boundary

Target V1.1 remains single-organization. `OrganizationProfile` is the singleton root and `organizationId` is not distributed through domain tables.

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
| Volunteering | `VolunteerOpportunity`, `VolunteerSession`, `VolunteerApplication`, `VolunteerParticipation`, `VolunteerAttendance` |
| Entrepreneurship | `Venture`, `VentureAssociation`, `VentureRequest`, `VentureRequestRevision` |

`IdentityReconciliationManifest` remains the sole TRANSITIONAL entity outside the 49.

## 3. Inherited Frozen V1 contract

The first 40 persistent entities preserve Frozen V1 semantics and relationship policy.

V1.1 does not reopen:

- Person/User/Affiliate separation;
- one Role per User;
- governance office vs security Role separation;
- assembly cardinalities;
- reservation/event/financial boundaries;
- immutable ledger principles;
- donation/financial evidence rules;
- inventory ledger semantics;
- singleton organization scope;
- TM-D09 relation-specific referential actions.

The detailed inherited field-level contract is retained in `consolidated-data-dictionary.md`.

## 4. Volunteering aggregate structure

```text
VolunteerOpportunity
 ├─ 0..N VolunteerSession
 ├─ 0..N VolunteerApplication
 └─ 0..N VolunteerParticipation

Person
 ├─ 0..N VolunteerApplication
 └─ 0..N VolunteerParticipation

VolunteerApplication
 └─ 0..1 VolunteerParticipation

VolunteerParticipation
 └─ 0..N VolunteerAttendance

VolunteerSession
 └─ 0..N VolunteerAttendance
```

### Core invariants

- DRAFT Opportunity may have zero Sessions.
- PUBLISHED Opportunity requires at least one qualifying Session.
- Only PUBLISHED Opportunity accepts new Applications.
- Public Application may exist without canonical Person and without User.
- Submitted Application snapshot is historical and is never rewritten from Person.
- Effective Participation requires canonical Person.
- Every Participation has one source Application through `applicationId NOT NULL UNIQUE`.
- `UNIQUE(opportunityId, personId)` prevents duplicate effective participation.
- Attendance is unique by `(participationId, sessionId)`.
- Participation and Session referenced by Attendance must belong to the same Opportunity.
- `creditedHours >= 0`.
- Total hours are derived from Attendance.
- Capacity approval is transactional.

## 5. Entrepreneurship structure

```text
Person
 └─ 0..N VentureAssociation

Venture
 ├─ 0..N VentureAssociation
 └─ 0..N VentureRequest

Person
 └─ 0..N VentureRequest (optional reconciliation)

VentureRequest
 └─ 1..N VentureRequestRevision
```

### Core invariants

- Venture identity is independent from Person/User/requester.
- `VentureAssociation` represents one temporal Person↔Venture episode.
- `endedAt IS NULL OR endedAt >= startedAt`.
- Only one open Person/Venture episode is allowed through partial uniqueness.
- Historical re-entry remains valid.
- `VentureRequest` is administrative process, not canonical Venture state.
- UPDATE requires target Venture.
- approved REGISTRATION requires resolved Venture.
- terminal Request requires `resolvedAt`; non-terminal Request keeps it null.
- revisions are append-only and unique by `(requestId, revisionNumber)`.
- `submittedData` is versioned historical evidence, not canonical Venture truth.
- `PUBLISHED => ACTIVE`.
- SUSPENDED/CLOSED atomically imply UNPUBLISHED.
- closing/reopening does not hard-delete history.

## 6. New V1.1 relationship inventory

### Volunteering — 11

| ID | Child FK | Parent | Required | onDelete | onUpdate |
| --- | --- | --- | --- | --- | --- |
| VOL-R01 | `VolunteerOpportunity.createdByUserId` | `User` | yes | RESTRICT | CASCADE |
| VOL-R02 | `VolunteerSession.opportunityId` | `VolunteerOpportunity` | yes | RESTRICT | CASCADE |
| VOL-R03 | `VolunteerApplication.opportunityId` | `VolunteerOpportunity` | yes | RESTRICT | CASCADE |
| VOL-R04 | `VolunteerApplication.personId` | `Person` | no | SET NULL | CASCADE |
| VOL-R05 | `VolunteerApplication.reviewedByUserId` | `User` | no | SET NULL | CASCADE |
| VOL-R06 | `VolunteerParticipation.opportunityId` | `VolunteerOpportunity` | yes | RESTRICT | CASCADE |
| VOL-R07 | `VolunteerParticipation.personId` | `Person` | yes | RESTRICT | CASCADE |
| VOL-R08 | `VolunteerParticipation.applicationId` | `VolunteerApplication` | yes, UQ | RESTRICT | CASCADE |
| VOL-R09 | `VolunteerAttendance.participationId` | `VolunteerParticipation` | yes | RESTRICT | CASCADE |
| VOL-R10 | `VolunteerAttendance.sessionId` | `VolunteerSession` | yes | RESTRICT | CASCADE |
| VOL-R11 | `VolunteerAttendance.recordedByUserId` | `User` | yes | RESTRICT | CASCADE |

### Entrepreneurship — 5

| ID | Child FK | Parent | Required | onDelete | onUpdate |
| --- | --- | --- | --- | --- | --- |
| ENT-R01 | `VentureAssociation.personId` | `Person` | yes | RESTRICT | CASCADE |
| ENT-R02 | `VentureAssociation.ventureId` | `Venture` | yes | RESTRICT | CASCADE |
| ENT-R03 | `VentureRequest.reconciledPersonId` | `Person` | no | SET NULL | CASCADE |
| ENT-R04 | `VentureRequest.ventureId` | `Venture` | conditional | RESTRICT | CASCADE |
| ENT-R05 | `VentureRequestRevision.requestId` | `VentureRequest` | yes | RESTRICT | CASCADE |

Thus:

```text
61 inherited Frozen relations
+ 11 Volunteering
+ 5 Entrepreneurship
= 77 Master relationships
```

## 7. Partial uniqueness

V1.1 requires SQL-level partial uniqueness where ordinary global uniqueness would destroy valid history.

### VentureAssociation

```sql
UNIQUE (personId, ventureId)
WHERE endedAt IS NULL
```

### VolunteerApplication

For reconciled applicants:

```sql
UNIQUE (opportunityId, personId)
WHERE status = 'PENDING'
  AND personId IS NOT NULL
```

Public unreconciled duplicate detection remains workflow validation.

## 8. Cross-row/transactional invariants

Not every invariant belongs in a row CHECK.

Transactional enforcement is required for at least:

- Opportunity publication requires qualifying Session.
- Opportunity cannot remain PUBLISHED after mutation leaves no qualifying Session.
- Application approval validates capacity, canonical identity and duplicate Participation.
- Attendance Participation and Session belong to the same Opportunity.
- Attendance is recorded only against semantically valid Session/Participation state.
- VentureAssociation historical episodes do not overlap.
- REGISTRATION approval creates/identifies Venture and resolves Request atomically.
- UPDATE approval re-reads current Venture and latest Revision, preventing stale overwrite.
- suspension/closure and unpublication are atomic.

## 9. Snapshot/history strategy

Historical submitted evidence is domain-specific:

- VolunteerApplication uses explicit submitted identity/contact snapshot fields.
- VentureRequest uses immutable VentureRequestRevision rows with versioned `submittedData`.

No generic Request, generic Revision or generic History entity is introduced.

Audit complements but does not replace these facts.

## 10. Deferred boundaries

V1.1 does not add:

- VolunteerProfile/VolunteerSkill/VolunteerHistory;
- Entrepreneur/EntrepreneurProfile;
- Product/Service;
- generic Publication;
- Fair;
- Venture category table without a closed physical classification decision;
- cross-cutting Media entity without ownership decision;
- direct Volunteering↔Event or Venture↔Event relation.

See `deferred-excluded-registry.md`.

## 11. Implementation boundary

This document is Target, not Current.

No Prisma schema, migration, seed, backend or frontend change is authorized solely by the relational freeze.

## ADD_STATUS_NOTE: Counts/design correct; current implementation boundary note

Frozen Target v1.1 relational design (49 persistent + 1 transitional + 77 master relationships) is preserved as the authoritative Target v1.1 contract. The design and counts are correct as documented.

**Merged implementation status:** The structural contract is now merged and verified at main@71aa989 (PR #102). The V1.1 package `IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989` reflects this merged checkpoint. The 49 persistent entities, 1 transitional entity, and 77 persistent Target relationships represent the implemented boundary.

**Deferred cutover gates:** The following evidence-dependent gates remain open and are not yet enforced as DB constraints. Structural implementation does not imply completed historical reconciliation:

- `ID-01`: Person canonical mapping + duplicate-data removal
- `ASM-ATT-01`: Complete parent mapping before new attendance/justification FKs
- `FIN-ORIGIN-01`: Explicit-origin reconciliation before generic `sourceId` removal
- `FIN-DON-01`: Donation original/reversal evidence before redundant-field removal
- `INV-LEDGER-01`: Signed ledger enforcement before opening-balance backfill
- `INV-LOAN-01`: Evidence-backed loan-movement links
- `ASM-DATE-01`: Date evidence mapping before `heldAt` backfill/enforcement
- `RES-STATUS-01`: Non-destructive `CONFIRMED`/`COMPLETED` removal

**Current model boundary:** The CURRENT model at main@71aa989 reflects 49 persistent + 1 transitional entities as the physical implementation. The gap between the V1.1 Target design and the current physical shape is documented in the migration roadmap and gap matrix, not in this frozen baseline.

**Do not treat structural implementation as completed historical reconciliation.** The V1.1 package distinguishes `IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989` from the V1 package's `IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`. The V1 design remains the historical authority for inherited decisions; V1.1 adds structure that is now merged, and final cutover requires evidence per each gate.
