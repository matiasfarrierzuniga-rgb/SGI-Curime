---
title: SGI-Curime AS-IS to Frozen Target Matrix
status: REVIEWED DRAFT
version: v1.1
baseline: ce4ff10aba8895042ee96d25d733d61c9343a821
target_status: TARGET FROZEN
---

# SGI-Curime AS-IS to Target Relational Model v1.1 Matrix

## 1. Purpose and authority

This document is the refreshed execution matrix between the repository state at
main commit ce4ff10aba8895042ee96d25d733d61c9343a821 and the Frozen Target
Relational Model V1.1.

It does not alter the Frozen Target. It records implementation distance,
migration/data risk, consumers, dependencies, gates and intended migration
waves.

Primary evidence:

- backend/prisma/schema.prisma
- backend/prisma/migrations/
- backend/src/
- docs/data/v1.1/consolidated-relational-model.md
- docs/data/v1.1/consolidated-data-dictionary.md
- docs/data/v1.1/integrity-rules.md
- docs/data/evolution/migration-roadmap-v1.md
- openspec/changes/reconcile-institutional-profile-with-target-v1/

Reading rule:

- AS-IS means observed implementation at the baseline above.
- TARGET FROZEN means approved V1.1 destination.
- A row marked MISSING is absent physically; it is not an instruction to create
  it outside the roadmap.
- TRANSITIONAL_MAPPING means Current already contains a precursor or differently
  shaped representation that must be reconciled rather than duplicated.
- IdentityReconciliationManifest remains transitional and outside the 49
  persistent Target entities.

## 2. Refreshed baseline

The refreshed repository baseline contains:

~~~text
CURRENT_PRISMA_MODELS=30
CURRENT_PERSISTENT_MODELS=29
CURRENT_TRANSITIONAL_MODELS=1
CURRENT_PRISMA_ENUMS=27
VERSIONED_MIGRATION_DIRECTORIES=25

TARGET_V1_1_PERSISTENT_ENTITIES=49
TARGET_V1_1_TRANSITIONAL_ENTITIES=1
TARGET_V1_1_MASTER_RELATIONSHIPS=77
~~~

The recovered docs/data/current-model.md remains historical evidence for its
older baseline and is not treated as the current main inventory.

## 3. Classification summary

| Classification | Count | Meaning |
| --- | ---: | --- |
| KEEP | 7 | Current entity exists and no Target structural delta is currently identified. |
| EVOLVE | 19 | Current entity persists but needs field, relation, invariant or lifecycle change. |
| TRANSITIONAL_MAPPING | 3 | Current physical representation maps to a differently shaped/named Target entity. |
| MISSING | 20 | Target persistent entity has no current persistent equivalent. |
| TRANSITIONAL_INFRASTRUCTURE | 1 | IdentityReconciliationManifest remains outside the 49 persistent Target entities. |

Reconciliation check:

~~~text
7 KEEP
+ 19 EVOLVE
+ 3 TRANSITIONAL_MAPPING
= 29 current persistent models

29 mapped/current
+ 20 missing Target entities
= 49 Target persistent entities
~~~

## 4. Execution matrix

Risk scale:

- LOW: additive/greenfield structure with no historical row transformation.
- MED: compatibility, cross-module contract, invariant or moderate backfill risk.
- HIGH: historical identity, institutional authority, ledger, parent remapping or
  destructive-cleanup risk.

| CURRENT | TARGET V1.1 | CLASSIFICATION | EXACT GAP | DATA RISK | MIGRATION NEED | CODE CONSUMERS | DEPENDENCIES | GATE | IMPLEMENTATION WAVE |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| InstitutionalProfile | OrganizationProfile | TRANSITIONAL_MAPPING | Current singleton exists under legacy name/field vocabulary and nullable contract; canonical authority, field mapping and compatibility cutover remain pending. | HIGH | Reconcile, compatible forward migration, consumer cutover, final enforcement. | institutional-profile, institutional-board, DINADECO reporting, frontend profile/board/financial consumers. | Existing institutional reconciliation OpenSpec. | OpenSpec 1.4-1.6 before mutation; DB-1 exit gate. | DB-1 |
| Person | Person | EVOLVE | Canonical identity exists but remains transitional/nullable and legacy sources still duplicate personal data. | HIGH | Reconcile/backfill first; final enforcement later. | identity, users, affiliates, requests, board and future V1.1 modules. | Organization foundation stable. | ID-01 | DB-2, DB-11, DB-12 |
| Role | Role | EVOLVE | Role is persisted but current semantics still intersect legacy governance and capabilities remain code-defined. | HIGH | Preserve security role, separate governance, add persisted grants. | auth, users, roles, affiliates, assemblies. | Person reconciliation and persisted RBAC. | GOV-HIST-01 for governance retirement. | DB-3, DB-4, DB-12 |
| — | Permission | MISSING | Stable capabilities are defined in application code but not persisted. | LOW | Create table and seed approved capability codes. | auth capability policy, role administration. | Role. | Capability parity exit check. | DB-3 |
| — | RolePermission | MISSING | Role-to-capability grants are application constants rather than relational data. | LOW | Create join table and seed grants without changing default-deny behavior. | auth, roles. | Role, Permission. | Capability parity exit check. | DB-3 |
| User | User | EVOLVE | personId is nullable and legacy identity/contact fields remain duplicated. | HIGH | Reconcile Person link; enforce NOT NULL only after gate; cleanup later. | auth, users and many actor FKs. | Person. | ID-01 | DB-2, DB-11, DB-12 |
| Session | Session | KEEP | No material structural Target delta identified. | LOW | None. | auth. | User. | — | — |
| AuditLog | AuditLog | EVOLVE | Generic entity metadata remains descriptive; referential/retention policy must stay aligned without becoming domain history. | LOW | Policy/constraint alignment only where required. | cross-cutting audit. | User and domain consumers. | — | DB-11 |
| PasswordResetToken | PasswordResetToken | KEEP | Target shape materially matches current responsibility. | LOW | None. | auth. | User. | — | — |
| AccountActivationToken | AccountActivationToken | KEEP | Target shape materially matches current responsibility. | LOW | None. | auth/user requests. | User. | — | — |
| UserRequest | UserRequest | EVOLVE | submitted snapshot exists but reviewedById has no Prisma relation/FK in current schema. | MED | Add nullable reviewer relation after referential preflight; preserve snapshot. | user-requests. | User, Person. | ID-01 for identity enforcement. | DB-2 |
| Affiliate | Affiliate | EVOLVE | personId nullable; duplicated identity remains; roleId is legacy security/governance coupling. | HIGH | Reconcile Person, defer NOT NULL and legacy role cleanup. | affiliates, assemblies, sanctions, inventory loans. | Person, Governance. | ID-01, GOV-HIST-01 | DB-2, DB-4, DB-11, DB-12 |
| AffiliateRequest | AffiliateRequest | KEEP | Core Target request/snapshot responsibility already exists. | LOW | None beyond shared identity policy. | affiliate-requests. | Person/User. | — | — |
| AffiliateSanction | AffiliateSanction | KEEP | Durable sanction evidence already exists with required actors. | LOW | None beyond referential policy verification. | sanctions. | Affiliate/User. | — | — |
| BoardPosition enum | GovernancePosition | MISSING | Current office representation is an enum; Target requires persistent office catalog. | MED | Create catalog, seed valid positions, maintain compatibility during cutover. | institutional-board. | DB-1, DB-3. | GOV-HIST-01 | DB-4 |
| BoardTerm | GovernanceTerm | TRANSITIONAL_MAPPING | Current term lacks Target lifecycle/status and remains tied to InstitutionalProfile. | HIGH | Reconcile/reshape after institutional authority cutover; preserve rows. | institutional-board. | OrganizationProfile, GovernancePosition. | GOV-HIST-01 | DB-4 |
| BoardAppointment | GovernanceMembership | TRANSITIONAL_MAPPING | Current relation is Person + BoardPosition enum; Target is Affiliate + GovernancePosition FK + GovernanceTerm. | HIGH | Evidence-based mapping/backfill; never infer unsupported historical membership. | institutional-board. | Affiliate, GovernancePosition, GovernanceTerm. | GOV-HIST-01 | DB-4 |
| Assembly | Assembly | EVOLVE | Current date/quorum representation must become scheduled/held semantics with AssemblyCall separation. | HIGH | Additive reshape and historical verification. | assemblies. | Governance. | ASM-DATE-01 | DB-5 |
| — | AssemblyCall | MISSING | Current quorum/call data is embedded in Assembly; Target models numbered calls explicitly. | HIGH | Create and map only evidenced history. | assemblies. | Assembly. | ASM-DATE-01 | DB-5 |
| AssemblyConvocation | AssemblyConvocation | EVOLVE | Current roleId/security Role coupling must move to optional GovernanceMembership plus Target snapshot semantics. | HIGH | Add relation, preserve snapshot evidence, retire role coupling later. | assemblies. | GovernanceMembership. | GOV-HIST-01 | DB-5, DB-12 |
| AssemblyAttendance | AssemblyAttendance | EVOLVE | Current composite assembly/affiliate relation must become unique convocationId relation. | HIGH | Parent remapping/backfill then enforce. | assemblies. | AssemblyConvocation. | ASM-ATT-01 | DB-5, DB-11, DB-12 |
| AbsenceJustification | AbsenceJustification | EVOLVE | Current composite assembly/affiliate relation must become unique attendanceId relation. | HIGH | Parent remapping/backfill then enforce. | absence-justifications, assemblies. | AssemblyAttendance. | ASM-ATT-01 | DB-5, DB-11, DB-12 |
| — | AssemblyMinute | MISSING | Formal minute entity absent. | MED | Create; do not fabricate historical minutes. | assemblies. | Assembly. | Explicit-evidence rule. | DB-5 |
| — | AssemblyResolution | MISSING | Formal assembly resolution entity absent. | MED | Create; historical data only where evidenced. | assemblies. | Assembly. | Explicit-evidence rule. | DB-5 |
| Event | Event | KEEP | Target core entity and publicId pattern already exist. | LOW | None beyond referential policy verification. | events, reservations. | — | — | — |
| ReservableResource | ReservableResource | EVOLVE | Target pricing/currency/invariant semantics are not fully enforced physically. | MED | Add/align constraints and compatibility behavior. | reservations. | — | — | DB-6, DB-11 |
| Reservation | Reservation | EVOLVE | Current enum still includes CONFIRMED/COMPLETED and final FREE/FIXED workflow is not fully normalized. | MED | Application compatibility first; enum cleanup last. | reservations, financial charge creation. | ReservableResource/Finance. | RES-STATUS-01 | DB-6, DB-12 |
| — | FinancialAccount | MISSING | Ledger movements currently have no persistent account parent. | MED | Create and deliberately assign/backfill accounts. | financial. | — | — | DB-7 |
| FinancialCharge | FinancialCharge | EVOLVE | Core charge exists; final pricing/exact-settlement and integrity constraints need enforcement alignment. | MED | Constraint/application hardening. | financial, reservations. | DB-6. | — | DB-7, DB-11 |
| Payment | Payment | EVOLVE | Current payment has no required unique movementId relation. | HIGH | Add nullable relation, reconcile origin, enforce after gate. | financial. | FinancialMovement. | FIN-ORIGIN-01 | DB-8, DB-11 |
| FinancialMovement | FinancialMovement | EVOLVE | Missing accountId, posting/void semantics, reversalOfId and explicit origin model; generic source/sourceId remains legacy. | HIGH | Expand, backfill/classify, switch consumers, enforce, cleanup later. | financial, donations, future disbursements. | FinancialAccount. | FIN-ORIGIN-01 | DB-7, DB-8, DB-11, DB-12 |
| Donation | Donation | EVOLVE | Current original movement remains nullable, donor Person relation is absent and reversalMovementId is redundant in Target. | HIGH | Reconcile movement evidence and donor identity; cleanup only after gate. | donations, financial. | FinancialMovement, Person. | FIN-DON-01 | DB-8, DB-11, DB-12 |
| — | Expense | MISSING | Formal expense authorization/registration entity absent. | MED | Create greenfield after treasury origin semantics stabilize. | future financial module. | FinancialMovement, AssemblyResolution optional. | Funding planning preconditions. | DB-9 |
| — | ExpenseDocument | MISSING | Expense-specific documentary evidence absent. | LOW | Create. | future financial module. | Expense. | — | DB-9 |
| — | Disbursement | MISSING | Explicit expense execution linked to unique ledger movement absent. | MED | Create with movement relation. | future financial module. | Expense, FinancialMovement. | FIN-ORIGIN-01 semantics established. | DB-9 |
| — | FundingAllocation | MISSING | Expense funding allocation model absent. | MED | Create only after aggregation/availability enforcement is closed. | future financial module. | Expense, FinancialMovement. | NB-05 resolved before DDL. | DB-9 |
| InventoryCategory | InventoryCategory | KEEP | Core Target classification already exists. | LOW | None. | inventory. | — | — | — |
| InventoryItem | InventoryItem | EVOLVE | currentQuantity semantics need formal non-negative/available enforcement. | MED | Verify ledger compatibility and add checks after backfill. | inventory. | InventoryMovement. | INV-LEDGER-01 | DB-10, DB-11 |
| InventoryMovement | InventoryMovement | EVOLVE | Current quantity representation is not the final signed quantityDelta ledger. | HIGH | Introduce signed delta/opening-balance strategy and backfill without reinterpreting history blindly. | inventory-movements, inventory reports. | InventoryItem. | INV-LEDGER-01 | DB-10, DB-11, DB-12 |
| InventoryLoan | InventoryLoan | EVOLVE | Target requires explicit checkout/return/cancellation movement evidence FKs. | HIGH | Link only evidenced historical movements; unsupported rows remain unresolved/null as allowed. | inventory-loans. | InventoryMovement. | INV-LOAN-01 | DB-10, DB-11 |
| — | VolunteerOpportunity | MISSING | Volunteering persistence does not exist. | LOW data / MED logic | Create greenfield with Frozen lifecycle/invariants. | No current module. | Person/User/RBAC/Audit foundation. | VOL-IMPL-01 | DB-13 |
| — | VolunteerSession | MISSING | Volunteering sessions do not exist. | LOW | Create with temporal checks. | No current module. | VolunteerOpportunity. | VOL-IMPL-01 | DB-13 |
| — | VolunteerApplication | MISSING | Public/canonical application with immutable explicit submitted snapshot does not exist. | LOW data / MED workflow | Create plus PostgreSQL partial unique for reconciled pending applications. | No current module. | VolunteerOpportunity, Person, User. | VOL-IMPL-01 | DB-13 |
| — | VolunteerParticipation | MISSING | Effective participation/provenance model absent. | LOW data / MED concurrency | Create with unique applicationId and opportunity/person pair. | No current module. | VolunteerApplication, Person. | VOL-IMPL-01 | DB-13 |
| — | VolunteerAttendance | MISSING | Session attendance and credited hours model absent. | LOW data / MED transaction | Create with uniqueness/checks and same-Opportunity transactional validation. | No current module. | Participation, Session, User. | VOL-IMPL-01 | DB-13 |
| — | Venture | MISSING | Entrepreneurship canonical venture model absent. | LOW data / MED workflow | Create greenfield with lifecycle/publication invariants. | No current module. | RBAC/Audit foundation. | ENT-IMPL-01 | DB-14 |
| — | VentureAssociation | MISSING | Temporal Person-Venture association episodes absent. | LOW data / MED temporal | Create plus open-association partial unique and transactional overlap protection. | No current module. | Person, Venture. | ENT-IMPL-01 | DB-14 |
| — | VentureRequest | MISSING | Registration/update administrative workflow absent. | LOW data / MED transaction | Create with conditional Target checks and terminal semantics. | No current module. | Person optional, Venture conditional. | ENT-IMPL-01 | DB-14 |
| — | VentureRequestRevision | MISSING | Append-only versioned request proposal evidence absent. | LOW data / MED integrity | Create with unique revision number, payloadVersion and immutable submittedData. | No current module. | VentureRequest. | ENT-IMPL-01 | DB-14 |

## 5. Transitional infrastructure

| Current | Classification | Disposition |
| --- | --- | --- |
| IdentityReconciliationManifest | TRANSITIONAL_INFRASTRUCTURE | Retain through Person/User/Affiliate reconciliation. Retirement is eligible only after ID-01, stabilization, retention review and zero operational dependency. |

## 6. Current migration-history delta since the recovered Current document

The recovered Current document described 23 migrations. Current main contains 25
versioned migration directories. The later physical additions are:

- 20260920120000_add_institutional_profile
- 20260922120000_add_institutional_board

Consequently InstitutionalProfile, BoardTerm and BoardAppointment are AS-IS
evidence now and cannot be treated as merely hypothetical Target aliases.

## 7. Execution rules derived from the matrix

1. Do not redesign Frozen V1.1 while implementing a gap.
2. Use expand -> compatibility -> backfill/reconcile -> verify -> enforce ->
   cleanup for historical structures.
3. Do not use that legacy transition pattern unnecessarily for greenfield
   Volunteering/Entrepreneurship; their tables should be born with Frozen
   constraints wherever PostgreSQL/Prisma can enforce them safely.
4. No historical identity, governance, attendance, financial origin or inventory
   evidence may be fabricated to satisfy a new FK or NOT NULL.
5. DB-11 is the global historical-data enforcement wave.
6. DB-12 is the destructive legacy cleanup wave.
7. DB-13 and DB-14 are V1.1 extension labels and may execute after DB-3 even
   though their numeric labels are greater than DB-12; wave IDs preserve
   traceability, not chronological order.
8. Parallel development is allowed only where dependencies permit it; merges
   that touch shared Prisma/Person/User/RBAC surfaces are serialized and rebased.
9. Target Frozen documents are not edited as part of implementation planning.

## 8. Readiness

~~~text
AS_IS_REFRESH_BASELINE=ce4ff10aba8895042ee96d25d733d61c9343a821
GAP_MATRIX_V1_1=REVIEWED_DRAFT
TARGET_V1_1_CHANGED=NO
PRISMA_CHANGED=NO
MIGRATION_CREATED=NO
IMPLEMENTATION_AUTHORIZED_BY_THIS_FILE=NO
~~~
