---
title: SGI-Curime Database Migration Roadmap v1.1
status: REVIEWED DRAFT
target_version: v1.1
baseline: ce4ff10aba8895042ee96d25d733d61c9343a821
---

# SGI-Curime Database Migration Roadmap v1.1

## 1. Purpose

This roadmap defines the safe implementation sequence from the refreshed
AS-IS baseline at main commit
ce4ff10aba8895042ee96d25d733d61c9343a821 to Frozen Target Relational Model
V1.1.

It preserves the accepted V1 migration logic and gates while adapting the plan
to current main, which now contains InstitutionalProfile, BoardTerm and
BoardAppointment, and adding the Frozen V1.1 Volunteering and Entrepreneurship
extensions.

This document:

- does not change Frozen Target V1.1;
- does not authorize Prisma or migration changes by itself;
- prefers small reviewable forward migrations;
- separates schema expansion from evidence-based data reconciliation;
- keeps destructive cleanup after gates and stabilization;
- permits parallel domain lanes only after shared foundations are stable.

Wave IDs are traceability labels. They are not a guarantee of strict numeric
execution order.

## 2. Refreshed planning baseline

~~~text
CURRENT_PRISMA_MODELS=30
CURRENT_PERSISTENT_MODELS=29
CURRENT_TRANSITIONAL_MODELS=1
CURRENT_VERSIONED_MIGRATIONS=25

TARGET_V1_1_PERSISTENT_ENTITIES=49
TARGET_V1_1_TRANSITIONAL_ENTITIES=1
TARGET_V1_1_MASTER_RELATIONSHIPS=77
~~~

The foundational V1 roadmap remains authoritative historical planning evidence.
This V1.1 roadmap supersedes its execution ordering only where current main or
the V1.1 extension changes implementation planning.

## 3. Canonical migration pattern

Historical/brownfield changes follow:

1. EXPAND
2. APPLICATION COMPATIBILITY
3. RECONCILE / BACKFILL
4. VERIFY / GATE
5. TARGET-FIRST APPLICATION
6. ENFORCE
7. CLEANUP

Rules:

- never perform destructive cleanup before its evidence gate;
- never impose NOT NULL/FK/UNIQUE against unresolved historical data;
- never fabricate historical identity, governance, attendance, finance or
  inventory facts;
- prefer checkpoint + forward-fix over destructive rollback after data
  transformation;
- preserve current external contracts through compatibility layers where a
  physical rename/reshape would otherwise break consumers.

Greenfield V1.1 modules do not require artificial legacy phases. Volunteering
and Entrepreneurship should be created with their Frozen keys, FKs, checks,
uniques and partial uniques from the start wherever safely enforceable.

## 4. Global dependency graph

~~~text
DB-1 Organization Authority Reconciliation
             |
             v
DB-2 Identity Completion
             |
             v
DB-3 Persisted RBAC
             |
             +--------------------+--------------------+--------------------+
             |                    |                    |                    |
             v                    v                    v                    v
DB-4 Governance          DB-6 Reservations       DB-10 Inventory      DB-13 Volunteering
     |                         |                                       
     v                         v
DB-5 Assemblies          DB-7 Treasury
                              |
                              v
                         DB-8 Financial Relations
                              |
                              v
                         DB-9 Expenses/Funding

             +---------------------------------------------------------> DB-14 Entrepreneurship

All required historical gates + applicable V1.1 module exit gates
             |
             v
DB-11 Historical Constraint Enforcement
             |
             v
DB-12 Legacy Cleanup
~~~

DB-13 and DB-14 may start after DB-3 because their Frozen contracts depend on
shared Person/User/RBAC/Audit foundations but not on Governance, Finance,
Reservations or Inventory.

Parallel implementation does not imply blind parallel merge. Branches that
touch schema.prisma, Person/User relations, capability seeds or AppModule must
be integrated serially with an update/rebase against the latest main between
merges.

## 5. Waves

### DB-0 — Historical Baseline Reconciliation

Status: COMPLETE historically.

Do not repeat DB-0. It remains evidence from the V1 foundation stage.

Current main has advanced beyond that baseline and now contains 25 migration
directories. The AS-IS refresh, not the old Current document, governs new work.

### DB-1 — Organization Authority Reconciliation

Current state already contains InstitutionalProfile, BoardTerm and
BoardAppointment. Therefore DB-1 is no longer a simple create-OrganizationProfile
wave.

Goal:

~~~text
InstitutionalProfile
        ->
canonical OrganizationProfile authority
        ->
compatibility-preserving consumer cutover
        ->
Board FK preservation/cutover
        ->
canonical enforcement
~~~

Use the existing OpenSpec change
reconcile-institutional-profile-with-target-v1 as the implementation authority.

Subsequence:

- DB-1A: read-only reconciliation preflight.
- DB-1B: abort/safety behavior.
- DB-1C: database checkpoint/restore readiness.
- DB-1D: canonical schema preparation.
- DB-1E: authoritative data reconciliation.
- DB-1F: institutional profile compatibility-layer cutover.
- DB-1G: DINADECO and application consumer cutover.
- DB-1H: Board foreign-key cutover.
- DB-1I: canonical enforcement/audit continuity.
- DB-1J: verification and Exit Gate.

Immediate gate before any institutional mutation:

~~~text
OpenSpec task 1.4 PASS
OpenSpec task 1.5 PASS
OpenSpec task 1.6 PASS
~~~

Do not introduce GovernancePosition/GovernanceTerm/GovernanceMembership inside
DB-1. BoardTerm/BoardAppointment/BoardPosition remain transitional evidence
through this wave.

### DB-2 — Identity Completion

Depends on: DB-1 stable.

Primary scope:

- reconcile every User to canonical Person without invented matches;
- reconcile every Affiliate to canonical Person without invented matches;
- add/verify UserRequest reviewer FK semantics;
- retain submitted snapshots and legacy identity/contact fields during
  compatibility;
- switch readers/writers toward canonical Person;
- defer final NOT NULL and destructive identity cleanup.

Gate: ID-01.

ID-01 must prove coverage, duplicate resolution, approved quarantine and
rollback/forward-fix readiness.

Final User.personId/Affiliate.personId enforcement belongs to DB-11.
Legacy identity/contact removal belongs to DB-12.

### DB-3 — Persisted RBAC

Depends on: DB-2 application identity path stable.

Create:

- Permission
- RolePermission

Migration/application work:

- seed the approved capability codes currently represented in application
  policy;
- seed RolePermission assignments to preserve current access behavior;
- keep User -> exactly one Role;
- preserve default deny;
- do not encode governance offices as security permissions/roles.

Exit checks:

~~~text
CAPABILITY_PARITY=PASS
DEFAULT_DENY=PASS
ROLE_ASSIGNMENT_SEMANTICS=UNCHANGED
~~~

After DB-3, domain lanes may progress independently subject to their own
dependencies/gates.

### DB-4 — Governance Separation

Lane: Governance/Assemblies.

Depends on: DB-1, DB-2, DB-3.

Create/reconcile:

- GovernancePosition
- GovernanceTerm
- GovernanceMembership

Current precursor evidence:

- BoardPosition enum
- BoardTerm
- BoardAppointment

Critical mapping:

~~~text
BoardAppointment.personId
        ->
evidenced Affiliate
        ->
GovernanceMembership.affiliateId
~~~

Do not infer historical memberships from Role or Person alone.

Gate: GOV-HIST-01.

Only evidenced rows become memberships. Unresolved historical rows must remain
preserved through transition evidence/compatibility rather than fabricated.

Affiliate.roleId and AssemblyConvocation Role coupling remain until DB-12.

### DB-5 — Assemblies Normalization

Lane: Governance/Assemblies.

Depends on: DB-4.

Create:

- AssemblyCall
- AssemblyMinute
- AssemblyResolution

Evolve:

- Assembly
- AssemblyConvocation
- AssemblyAttendance
- AbsenceJustification

Parent-safe order:

~~~text
Assembly
 -> AssemblyCall
 -> AssemblyConvocation
 -> AssemblyAttendance
 -> AbsenceJustification
~~~

Primary changes:

- date -> scheduledAt, with heldAt only when explicit evidence supports it;
- quorum/call data -> AssemblyCall;
- convocation Role coupling -> optional GovernanceMembership + historical
  position snapshot;
- attendance -> unique convocationId;
- justification -> unique attendanceId;
- deprecate JUSTIFIED in favor of ABSENT + justification evidence.

Gates:

- ASM-DATE-01
- ASM-ATT-01
- GOV-HIST-01 where governance membership is involved

Do not fabricate calls, minutes, resolutions or held dates.

### DB-6 — Reservations Hardening

Lane: Reservations/Finance.

Depends on: DB-3. It does not structurally depend on DB-5.

Scope:

- close FREE/FIXED application semantics;
- ensure FREE resource behavior does not create a payable charge;
- ensure FIXED pricing is positive and compatible with charge snapshot rules;
- move application behavior toward the Frozen reservation lifecycle;
- retain legacy CONFIRMED/COMPLETED values during compatibility.

Gate: RES-STATUS-01 for destructive enum cleanup in DB-12.

### DB-7 — Treasury Foundation

Lane: Reservations/Finance.

Depends on: DB-6.

Create:

- FinancialAccount

Expand FinancialMovement additively toward:

- accountId
- status / posting semantics
- reversalOfId
- originType
- void metadata

Backfill/classification must deliberately assign accounts/origins. Generic
source/sourceId remains during transition.

Do not remove generic origin columns in this wave.

### DB-8 — Financial Relations

Lane: Reservations/Finance.

Depends on: DB-7.

Evolve:

- Payment.movementId
- Donation.originalMovementId
- FinancialMovement reversal semantics
- shared/compatible financial method representation as required by the Frozen
  contract

Gates:

- FIN-ORIGIN-01
- FIN-DON-01

Origin matching must be evidence-based. Unresolved rows remain quarantined/
transitional; no financial movement may be invented simply to satisfy a FK.

### DB-9 — Funding and Expenses

Lane: Reservations/Finance.

Depends on: DB-8.

Create:

- Expense
- ExpenseDocument
- Disbursement
- FundingAllocation

Precondition:

- NB-05 equivalent planning issue for FundingAllocation availability/aggregation
  enforcement must be closed before its final DDL/behavior is accepted.

Expense represents authorization/registration. Disbursement represents
execution. Ledger movement evidence remains explicit.

### DB-10 — Inventory Ledger

Lane: Inventory.

Depends on: DB-3 shared foundations. It does not require DB-9.

Evolve:

- InventoryMovement.quantity -> signed quantityDelta
- introduce opening-balance/reconciliation strategy
- formalize InventoryItem.currentQuantity as non-negative available quantity
- link InventoryLoan checkout/return/cancellation movement evidence where
  supported

Gates:

- INV-LEDGER-01
- INV-LOAN-01

Do not reinterpret unsigned historical movement rows by sign without an
approved conversion algorithm.

### DB-13 — Volunteering V1.1

Lane: V1.1 extension.

Depends on: DB-2 and DB-3 stable Person/User/RBAC foundations.

Create greenfield:

- VolunteerOpportunity
- VolunteerSession
- VolunteerApplication
- VolunteerParticipation
- VolunteerAttendance

Create with the Frozen 11 FK policies and relevant row constraints from the
start.

Required physical/application invariants include:

- capacity null or positive;
- Session startAt < endAt;
- unique Participation applicationId;
- unique Participation opportunityId/personId;
- unique Attendance participationId/sessionId;
- creditedHours >= 0;
- partial unique for reconciled PENDING applications;
- PUBLISHED Opportunity requires qualifying Session;
- only PUBLISHED Opportunity accepts applications;
- approval validates capacity, Person reconciliation and duplicate
  participation atomically;
- Attendance Participation and Session belong to same Opportunity;
- historical submitted Application snapshot is never rewritten from Person.

Implementation exit gate: VOL-IMPL-01.

VOL-IMPL-01 requires:

~~~text
VOL_ENTITIES=5
VOL_FKS=11
PARTIAL_PENDING_APPLICATION_UQ=PASS
PARTICIPATION_PROVENANCE=PASS
CAPACITY_CONCURRENCY=PASS
ATTENDANCE_SAME_OPPORTUNITY=PASS
STATE_TRANSITIONS=PASS
CAPABILITY_POLICY=PASS
TRANSACTIONAL_TEST_EVIDENCE=PASS
~~~

VOL-IMPL-01 is an implementation/planning gate derived from Frozen V1.1
invariants; it does not alter the Target model.

### DB-14 — Entrepreneurship V1.1

Lane: V1.1 extension.

Depends on: DB-2 and DB-3 stable Person/User/RBAC foundations.

Create greenfield:

- Venture
- VentureAssociation
- VentureRequest
- VentureRequestRevision

Required physical/application invariants include:

- PUBLISHED => ACTIVE;
- SUSPENDED/CLOSED atomically imply UNPUBLISHED;
- association end is null or not before start;
- partial unique permits only one open Person/Venture association episode;
- historical association episodes do not overlap;
- UPDATE request requires ventureId;
- approved REGISTRATION requires ventureId;
- terminal request iff resolvedAt is present under the Frozen no-reopen model;
- revision number unique per request;
- payloadVersion required;
- submittedData append-only historical proposal evidence;
- UPDATE uses explicit patch semantics against current canonical Venture;
- association alone never grants authorization.

Implementation exit gate: ENT-IMPL-01.

ENT-IMPL-01 requires:

~~~text
ENT_ENTITIES=4
ENT_FKS=5
OPEN_ASSOCIATION_PARTIAL_UQ=PASS
ASSOCIATION_INTERVAL_VALIDATION=PASS
APPEND_ONLY_REVISIONS=PASS
PAYLOAD_VERSION=PASS
PATCH_SEMANTICS=PASS
VENTURE_LIFECYCLE_ATOMICITY=PASS
CAPABILITY_POLICY=PASS
TRANSACTIONAL_TEST_EVIDENCE=PASS
~~~

Explicitly out of scope:

- VentureCategory/classification physical model
- Media
- Fair
- Product/Service
- Event integration

These remain deferred by Frozen V1.1.

### DB-11 — Historical Constraint Enforcement

This wave is not a dumping ground for greenfield DB-13/DB-14 constraints.
Those modules should be created correctly from the start.

DB-11 enforces constraints that were intentionally delayed because historical
data first required reconciliation/backfill.

Potential enforcement scope includes:

- User.personId NOT NULL/Target uniqueness after ID-01;
- Affiliate.personId NOT NULL/Target uniqueness after ID-01;
- governance constraints after GOV-HIST-01;
- attendance/justification parent FKs after ASM-ATT-01;
- pricing/lifecycle checks after reservation compatibility;
- financial account/origin/movement constraints after FIN gates;
- inventory ledger checks/FKs after INV gates;
- TM-D09 relation-specific delete actions and onUpdate CASCADE alignment.

Historical gate prerequisites, where applicable:

- ID-01
- GOV-HIST-01
- ASM-DATE-01
- ASM-ATT-01
- FIN-ORIGIN-01
- FIN-DON-01
- INV-LEDGER-01
- INV-LOAN-01

To declare the full V1.1 implementation complete, VOL-IMPL-01 and ENT-IMPL-01
must also pass, even though their greenfield constraints are not deferred to
DB-11.

### DB-12 — Legacy Cleanup

Final destructive/retirement wave.

Depends on stabilization and the relevant gates.

Eligible cleanup may include:

- duplicated User/Affiliate identity/contact representation;
- Affiliate.roleId and governance meaning attached to security Role;
- AssemblyConvocation legacy Role relation/snapshot representation;
- old Assembly/Attendance/Justification composite structures;
- AttendanceStatus.JUSTIFIED after verified conversion;
- FinancialMovement.source/sourceId generic origin representation;
- Donation.reversalMovementId;
- InventoryMovement.quantity legacy representation;
- ReservationStatus.CONFIRMED/COMPLETED after RES-STATUS-01;
- obsolete compatibility code/columns/types;
- IdentityReconciliationManifest only after reconciliation lifecycle,
  retention and operational-dependency requirements are formally complete.

Cleanup rule:

~~~text
REMOVE_ALLOWED =
  ZERO_READERS
  AND ZERO_WRITERS
  AND REQUIRED_GATE_PASS
  AND STABILIZATION_PASS
  AND CHECKPOINT/RECOVERY_READY
~~~

No item is removed merely because the Target marks it legacy.

## 6. Gate registry

| Gate | Primary wave | What it blocks |
| --- | --- | --- |
| DB-1 OpenSpec preflight/abort/checkpoint gate | DB-1 | Any institutional reconciliation mutation before tasks 1.4-1.6 pass. |
| ID-01 | DB-2 / DB-11 / DB-12 | Required Person links and identity cleanup. |
| GOV-HIST-01 | DB-4 / DB-5 / DB-12 | Fabricated governance history and retirement of Role coupling. |
| ASM-DATE-01 | DB-5 | Unsupported held-date history/enforcement. |
| ASM-ATT-01 | DB-5 / DB-11 / DB-12 | New attendance/justification parent FKs and composite cleanup. |
| RES-STATUS-01 | DB-6 / DB-12 | Destructive removal of reservation legacy states. |
| FIN-ORIGIN-01 | DB-8 / DB-11 / DB-12 | Required explicit movement origins and generic origin cleanup. |
| FIN-DON-01 | DB-8 / DB-11 / DB-12 | Donation movement enforcement/cleanup. |
| INV-LEDGER-01 | DB-10 / DB-11 / DB-12 | Signed-ledger enforcement and legacy quantity cleanup. |
| INV-LOAN-01 | DB-10 / DB-11 | InventoryLoan movement evidence FKs. |
| VOL-IMPL-01 | DB-13 | Completion of Frozen Volunteering implementation. |
| ENT-IMPL-01 | DB-14 | Completion of Frozen Entrepreneurship implementation. |

VOL-IMPL-01 and ENT-IMPL-01 are implementation exit gates, not new Target
design decisions.

## 7. Parallel lane rules

After DB-3, the following lanes may be developed in parallel:

- Governance/Assemblies: DB-4 -> DB-5
- Reservations/Finance: DB-6 -> DB-7 -> DB-8 -> DB-9
- Inventory: DB-10
- Volunteering: DB-13
- Entrepreneurship: DB-14

Parallelism rules:

1. Respect each lane's own dependency chain.
2. Do not parallel-merge conflicting schema.prisma edits.
3. The first branch merged becomes the next baseline.
4. Subsequent branches update/rebase and reconcile generated Prisma/shared
   relation changes before merge.
5. Shared capability seeds and AppModule wiring are treated as integration
   surfaces, not duplicated truth.
6. User performs final test commands/gates unless explicitly delegated.

## 8. Agent handoff boundary

Architecture, Target interpretation, gap classification, gates and wave scope
must be fixed before an implementation agent receives a task.

Recommended Terra task packet:

~~~text
OBJECTIVE
BASELINE
FROZEN TARGET CONTRACT
CURRENT GAP
FILES IN SCOPE
ALLOWED CHANGES
FORBIDDEN CHANGES
DATA/MIGRATION SAFETY
DEPENDENCIES
GATES
STOP CONDITIONS
EXPECTED REPORT
USER-RUN TEST COMMANDS
~~~

Immediate recommended implementation task:

~~~text
TERRA / DB-1A
Implement OpenSpec task 1.4:
read-only institutional reconciliation preflight.

NO DATA MUTATION
NO MIGRATION
NO PRISMA REDESIGN
NO TARGET CHANGE
~~~

OpenSpec 1.5 is the next technical task after DB-1A.
OpenSpec 1.6 is documentation/operational readiness and does not need to consume
an implementation-agent cycle unless code/tooling is required.

## 9. Verification philosophy

Each wave should provide evidence for:

- migration-history preservation;
- before/after row counts where historical data is touched;
- deterministic/idempotent reconciliation where applicable;
- zero fabricated facts;
- consumer compatibility during transitions;
- constraint behavior;
- authorization behavior;
- focused backend/frontend/integration tests;
- final diff scope.

Do not make test execution an implicit agent side effect when the agreed
workflow reserves final test execution for the user.

## 10. Readiness statements

~~~text
ROADMAP_V1_1_STATUS=REVIEWED_DRAFT
TARGET_V1_1_CHANGED=NO
AS_IS_BASELINE=ce4ff10aba8895042ee96d25d733d61c9343a821

SERIAL_FOUNDATION=DB-1 -> DB-2 -> DB-3

PARALLEL_LANES_AFTER_DB3=
  DB-4 -> DB-5
  DB-6 -> DB-7 -> DB-8 -> DB-9
  DB-10
  DB-13
  DB-14

GLOBAL_HISTORICAL_ENFORCEMENT=DB-11
FINAL_LEGACY_CLEANUP=DB-12

PRISMA_CHANGED_BY_THIS_DOCUMENT=NO
MIGRATION_CREATED_BY_THIS_DOCUMENT=NO
IMPLEMENTATION_AUTHORIZED_BY_THIS_DOCUMENT=NO
~~~
