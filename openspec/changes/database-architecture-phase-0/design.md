## Context

This documentation-only change records the AS-IS architecture at baseline `3e24a9d47889274e6a12743e3e62428c632b7cd7`. Evidence includes `backend/prisma/schema.prisma`, identity services under `backend/src/identity/`, reservation and financial services, authorization guards, capability policies, frontend access policy, and DINADECO reporting.

No live database counts were executed. `IDENTITY_DATA_COMPLETENESS=PENDING`. Write-capable reconciliation scripts are not used in this phase.

## Goals / Non-Goals

**Goals:**

- Complete an evidence-based AS-IS baseline with explicit ownership, role, actor, lineage, integrity, snapshot, DINADECO, ADR, and migration governance documentation.
- Preserve the distinction between verified facts, proposed direction, approval-ready concepts, blocked alternatives, and business decisions required.
- Establish a roadmap for future changes without authorizing implementation.

**Non-Goals:**

- No Person canonicalization, Position, AffiliatePosition, Party, Organization, Customer, Supplier, Sale, Purchase, MembershipFee, or fiscal invoicing implementation.
- No UserRole N:M, multiple-position model, FinancialCharge generalization, Payment-to-FinancialMovement FK, double-entry accounting, chart of accounts, bank reconciliation, or partial payments.
- No Prisma, schema, migration, backfill, data, dependency, API, frontend, backend, infrastructure, or runtime changes.

## Evidence Labels

`VERIFIED` means supported by repository evidence. `INFERRED` means a bounded interpretation that requires confirmation. `PROPOSED` means a future direction not approved for implementation. `READY_FOR_APPROVAL` means a conceptual decision was sufficiently defined before approval. `ACCEPTED` means accepted only within its stated approval boundary. `BLOCKED` means implementation is not authorized. `BUSINESS_DECISION_REQUIRED` means institutional rules are not established. `PENDING` means live data or validation is unavailable. `OUT_OF_SCOPE` means excluded from Phase 0.

## Phase 0 Architecture Approval

`PHASE0_ARCHITECTURE_STATUS=APPROVED`.

Phase 0 is approved as the architectural and governance baseline for future data-model evolution. Approval confirms that the AS-IS model, identity ownership, Role classification, business actors, financial lineage, integrity matrix, historical snapshots, DINADECO limitations, conditional migration governance, scope boundaries, and pending decisions are sufficiently documented.

This approval is documentary only. It authorizes no Person canonical implementation, Position implementation, AffiliatePosition implementation, Party or Organization implementation, FinancialCharge generalization, Payment-Movement FK, schema change, migration, backfill, data change, production refactor, or dependency change.

## Identity Ownership Matrix

Current ownership is intentionally non-final for duplicated or ambiguous fields. `CURRENT_READERS` and `CURRENT_WRITERS` identify known repository consumers; unverified consumers remain `not established`.

| FIELD | CURRENT_OWNER | CURRENT_READERS | CURRENT_WRITERS | CATEGORY | TARGET_OWNER_CANDIDATE | SNAPSHOT_ALLOWED | MIGRATION_RISK | DECISION_STATUS |
|---|---|---|---|---|---|---|---|---|
| firstName / fullName | Person plus duplicated User/Affiliate representations | identity resolver, auth/profile and affiliate consumers | registration, User/Affiliate services | PERSONAL_IDENTITY | Person | Yes for submitted requests | conflicting edits and nullable links | PROPOSED |
| firstSurname | Person plus duplicated User/Affiliate representations | identity resolver and profile consumers | registration, User/Affiliate services | PERSONAL_IDENTITY | Person | Yes for submitted requests | conflicting edits and nullable links | PROPOSED |
| secondSurname | Person plus duplicated User/Affiliate representations | identity resolver and profile consumers | registration, User/Affiliate services | PERSONAL_IDENTITY | Person | Yes for submitted requests | conflicting edits and nullable links | PROPOSED |
| identification | Person, User, Affiliate, request snapshots | identity resolution and account/affiliate flows | registration and request approval flows | PERSONAL_IDENTITY | Person | Yes in submitted requests | duplicate or conflicting identity keys | PROPOSED |
| identificationType | Person and duplicated account/affiliate data | identity resolution and registration | registration and approval flows | PERSONAL_IDENTITY | Person | Yes in submitted requests | nullable legacy links | PROPOSED |
| normalizedIdentification | Person identity key | runtime Person resolver | Person resolver | PERSONAL_IDENTITY | Person | No | duplicate corruption | VERIFIED AS CURRENT KEY; TARGET PROPOSED |
| birthDate | User/Affiliate or request-specific data; canonical owner unresolved | profile and affiliation consumers where present | corresponding profile/request flows | UNRESOLVED | Not decided | Yes when submitted historically | semantic conflict | BUSINESS_DECISION_REQUIRED |
| gender | User/Affiliate or request-specific data; canonical owner unresolved | corresponding profile consumers | corresponding profile/request flows | UNRESOLVED | Not decided | Yes when submitted historically | semantic conflict | BUSINESS_DECISION_REQUIRED |
| email | User account and possible affiliation/request copies | auth, profile, admin and request consumers | User/request/account flows | ACCOUNT | Not decided between account and profile ownership | Yes for submitted requests | identity/contact divergence | BUSINESS_DECISION_REQUIRED |
| phone | Person phone fields plus duplicated legacy data | identity resolver and profile consumers | Person resolver and legacy profile flows | CONTACT | Person candidate; not approved | Yes for submitted requests | format and synchronization conflicts | BUSINESS_DECISION_REQUIRED |
| phoneCountryCode | Person | identity resolver and profile consumers | Person resolver | CONTACT | Person candidate; not approved | Yes for submitted requests | legacy phone representation | BUSINESS_DECISION_REQUIRED |
| phoneNationalNumber | Person | identity resolver and profile consumers | Person resolver | CONTACT | Person candidate; not approved | Yes for submitted requests | legacy phone representation | BUSINESS_DECISION_REQUIRED |
| address | Person plus duplicated User/Affiliate/request representations | identity, profile, affiliate and request consumers | identity and legacy profile flows | CONTACT | Not decided | Yes for submitted requests | historical and current-address conflict | BUSINESS_DECISION_REQUIRED |
| occupation | Affiliate or request snapshot where present | affiliate/request consumers | affiliate/request flows | AFFILIATION | Not decided | Yes | unclear semantic owner | BUSINESS_DECISION_REQUIRED |
| workplace | Affiliate or request snapshot where present | affiliate/request consumers | affiliate/request flows | AFFILIATION | Not decided | Yes | unclear semantic owner | BUSINESS_DECISION_REQUIRED |
| affiliateType | Affiliate | affiliate/admin consumers | affiliate creation/update flows | AFFILIATION | Affiliate | Yes in requests | affiliation-history loss | PROPOSED |

`User.personId` is currently nullable. `Affiliate.personId` is currently nullable. No quantities, duplicate counts, conflict counts, or completeness percentages are asserted. `IDENTITY_DATA_COMPLETENESS=PENDING`.

The governing rule is `canonical mutable identity != historical submitted snapshot`.

## Role Classification

| CURRENT ROLE | CLASSIFICATION | BASIS |
|---|---|---|
| Administrador | MIXED | account authorization and full capability policy |
| Tesorero | MIXED | financial authorization and donation capability policy |
| Gestor de Inventario | MIXED | account authorization and inventory capability policy |
| Vecino/Afiliado | MIXED | account role plus institutional/affiliate meaning and frontend access |
| Miembro de Junta Directiva | AMBIGUOUS | institutional position meaning is not separated from current role catalog |
| Subscription_L1 | SYSTEM_ROLE | account/subscription fallback role |
| Fiscal | fixture / expected office; not confirmed production catalog | test or fixture evidence only |
| Operador | fixture/display; not confirmed production catalog | fixture/display evidence only |

Concrete consumers:

- `User.roleId` and `Affiliate.roleId` are persisted role references in the Prisma model.
- `AssemblyConvocation.roleId` records the current role context for an assembly convocation.
- `backend/src/auth/presentation/guards/roles.guard.ts` consumes role metadata.
- `backend/src/auth/presentation/guards/capability.guard.ts` consumes capability metadata.
- `backend/src/auth/presentation/capabilities/capability-policy.ts` defines `ROLE_CAPABILITIES` and backend capabilities.
- `frontend/src/shared/security/access.ts` defines frontend role/capability access, including navigation and route consumers.
- Controllers under `backend/src/assemblies/`, `backend/src/modules/users/`, and `backend/src/modules/roles/` expose role-dependent behavior.

Current coupling is verified: changing `User.roleId` can update the active `Affiliate.roleId` when applicable; deactivating an `Affiliate` can change the associated `User.roleId` to `Subscription_L1`.

`SystemRole != Position` is an accepted conceptual separation under ADR-DATA-002. `AffiliatePosition N:M`, multiple simultaneous positions, `startDate/endDate`, formal Junta Directiva history, the final Position catalog, and `UserRole N:M` remain undecided and are not implemented.

## Position Open Questions

Status for each question is `BUSINESS_DECISION_REQUIRED`:

- Can an Affiliate hold multiple positions?
- Can an Affiliate hold simultaneous positions?
- Do positions require effective dates?
- Is formal Junta Directiva history required?
- What is the official Position catalog?

`AssemblyConvocation.roleNameSnapshot` is `VERIFIED` evidence that a historical role-name context must be preserved. It does not decide a Position model. `positionNameSnapshot` remains a future candidate only.

## Business Actor / Operator Matrix

| MODULE | CURRENT_ACTOR | SYSTEM_OPERATOR | EXTERNAL_ACTOR_SUPPORTED | IDENTITY_REQUIRED | ORGANIZATION_REQUIRED | GENERAL_PARTY_JUSTIFIED |
|---|---|---|---|---|---|---|
| Reservation | User requester | User | NO | YES | NO | NO |
| Donation | donorName/donorIdentification or anonymous | User recorder/canceller | YES | NO | NO | NOT YET |
| InventoryLoan | borrowerName plus optional Affiliate | optional User creator/receiver | YES | NO | NO | NOT YET |
| AffiliateRequest | Person/User-linked applicant context | authenticated administrative User | current account context required | YES | NO | NO |
| UserRequest | textual submitted identity snapshot | authenticated reviewer/User | not a global actor contract | snapshot textual | NO | NO |
| Assembly | Affiliate participant | authenticated administrative User | NO | YES for participant | NO | NO |
| Payment | financial charge/payment record | User recorder | NO | YES for operator | NO | NO |

`PARTY_DECISION=BLOCKED`. Party, Organization, Customer, and Supplier remain future alternatives only. No module is required to use Party in this phase.

## Financial Lineage

### Reservation Charge

```text
Reservation PENDING
    |
    | approve / Serializable transaction
    v
Reservation APPROVED
    |
    v
FinancialCharge PENDING
```

Only Reservation is a verified producer of FinancialCharge. One charge per Reservation is protected by the current schema/service behavior. Cancellation is:

```text
FinancialCharge PENDING -> CANCELLED
Reservation -> CANCELLED
```

A PAID charge prevents direct reservation cancellation and requires financial reconciliation.

### Payment Movement

```text
FinancialCharge PENDING
    |
    | exact settlement / Serializable transaction
    v
Payment CONFIRMED
    |
    v
FinancialCharge PAID
    |
    v
FinancialMovement INCOME
```

Current convention:

```text
FinancialMovement.source = RESERVATION_PAYMENT
FinancialMovement.sourceId = Payment.id
Payment -> FinancialMovement physical FK = NO
```

`PAYMENT_MOVEMENT_EXPLICIT_LINEAGE` has `STATUS=PROPOSED_FOLLOW_UP`. It authorizes no FK, reconciliation, or historical backfill in Phase 0.

### Donation Lineage

```text
Donation CONFIRMED
   -> original FinancialMovement INCOME
   -> Donation.originalMovementId FK
```

```text
Donation CONFIRMED
   -> reversal FinancialMovement EXPENSE
   -> Donation.reversalMovementId FK
   -> Donation CANCELLED
```

The explicit original/reversal FKs provide stronger physical integrity than relying only on polymorphic `source/sourceId`. This is an observation, not a Phase 0 finance redesign requirement.

`ADR-DATA-004=PROPOSED`: `FinancialCharge remains Reservation-specific for now.` General obligation support is a future candidate only; no second real producer is verified.

## Integrity Matrix

| INVARIANT | POSTGRESQL | PRISMA | NESTJS | FRONTEND | CONVENTION_ONLY | NOTES |
|---|---|---|---|---|---|---|
| logical identity uniqueness | partial physical unique identity key | model/query support | resolver detects duplicate corruption | no authority | identity semantics | completeness PENDING |
| `User.personId` UNIQUE | current nullable unique relation | relation metadata | reconciliation/resolver flows | no authority | no | nullable currently |
| `Affiliate.personId` UNIQUE | current nullable unique relation | relation metadata | affiliate flows | no authority | no | nullable currently |
| one FinancialCharge per Reservation | unique relation/index | relation metadata | approve catches conflict | no authority | no | Reservation-only producer |
| exact settlement | no global check established | decimal fields | FinancialService compares exact amount | input UX only | no | payment service rule |
| positive financial amounts | no global check established | decimal fields | DTO/service validation | input UX only | no | not a DB-wide invariant |
| positive inventory movement quantity | no global check established | numeric fields | inventory service validation | input UX only | no | service-owned |
| non-negative inventory stock | no global check established | numeric fields | inventory operations enforce | display only | no | service-owned |
| reservation date validity | no global check established | datetime fields | reservation service validates range | date input UX | no | service-owned |
| quorum validity | no global check established | assembly fields | assembly service rules | display/validation | no | service-owned |
| reservation status rules | no global transition constraint | enum/model | transition policy and service | action visibility | no | NestJS-owned |
| Payment -> FinancialMovement relation | NO physical FK | source/sourceId only | same transaction creates movement | no authority | convention | proposed follow-up |
| `sourceId` validity by source | no source-specific FK | polymorphic scalar | producer convention | no authority | YES | weak provenance |
| CRC currency policy | no complete global constraint | currency fields | current services use CRC and reject unsupported charge currency | display | YES | not complete DB-wide |

## DINADECO Limitations

- `backend/src/financial/dinadeco-reports.service.ts` queries and aggregates `FinancialMovement` directly.
- It does not reconstruct figures from Reservation, Payment, or Donation.
- The current report does not need `sourceId` for its aggregates or displayed lines.
- `sourceId` remains weak for provenance integrity because it is polymorphic and lacks source-specific FKs.
- No formal bank reconciliation exists.
- The report is operational DINADECO output, not official accounting.
- CRC is controlled primarily by current services and is not enforced by one complete global database constraint.
- Incomplete historical movements or missing provenance can affect report interpretation.
- Formal accounting, chart of accounts, double-entry accounting, and bank reconciliation are OUT_OF_SCOPE.

## ADR Decisions and Boundaries

### ADR-DATA-001: Person canonical identity

- **STATUS:** PROPOSED
- **EVIDENCE:** Person is used by runtime identity resolution; User and Affiliate still store/update identity/contact; both person links are nullable.
- **DECISION / PROPOSED DIRECTION:** Person may become canonical mutable identity after approval and data assessment.
- **NOT DECIDED:** Immediate canonical enforcement, field ownership for email/phone/address/birthDate/gender, backfill completeness.
- **RISKS:** duplicate identity, conflicting edits, nullable legacy links, unknown live completeness.
- **ALTERNATIVES:** retain bounded duplication; resolve by module; quarantine conflicts.
- **APPROVAL BOUNDARY:** no canonicalization, constraint, or backfill in Phase 0.

### ADR-DATA-002: SystemRole versus Position

- **STATUS:** ACCEPTED
- **EVIDENCE:** Role is consumed by account authorization, Affiliate semantics, assembly context, backend guards, capability policy, frontend access, navigation, and routes.
- **DECISION / PROPOSED DIRECTION:** `ERP authorization and institutional Position are distinct concepts.`
- **NOT DECIDED:** AffiliatePosition cardinality, simultaneous positions, effective dates, formal history, final Position catalog, UserRole N:M.
- **RISKS:** current mixed role catalog and User/Affiliate synchronization.
- **ALTERNATIVES:** preserve current Role temporarily; introduce bounded Position only after business decisions.
- **APPROVAL BOUNDARY:** accepted only for conceptual separation; it does not approve AffiliatePosition N:M, multiple positions, effective dates, full office history, UserRole N:M, catalog changes, or schema implementation.

### ADR-DATA-003: Business actors and Party

- **STATUS:** BLOCKED
- **EVIDENCE:** modules use User, Affiliate, textual snapshots, anonymous donors, and optional Affiliate differently.
- **DECISION / PROPOSED DIRECTION:** Keep module-specific actor semantics; Party remains a future alternative.
- **NOT DECIDED:** global Party, Organization, external actor persistence, customer/supplier abstraction.
- **RISKS:** premature abstraction and loss of module-specific historical semantics.
- **ALTERNATIVES:** module-specific actors; bounded shared contracts later.
- **APPROVAL BOUNDARY:** no Party or Organization implementation.

### ADR-DATA-004: FinancialCharge scope

- **STATUS:** PROPOSED
- **EVIDENCE:** Reservation approval creates the only verified FinancialCharge producer; payment settles the charge and creates an income movement.
- **DECISION / PROPOSED DIRECTION:** FinancialCharge remains Reservation-specific for now.
- **NOT DECIDED:** general economic obligation, new producers, partial payments, accounting semantics, explicit Payment-Movement FK.
- **RISKS:** future obligations may require a different abstraction; polymorphic movement provenance is weak.
- **ALTERNATIVES:** retain Reservation-specific charge; introduce a general obligation only after a second real producer and approved requirements.
- **APPROVAL BOUNDARY:** no generalization or financial schema change in Phase 0.

## Migration Governance

Future changes may use this conditional pattern:

```text
EXPAND
-> BACKFILL / RECONCILE when required
-> DUAL READ / COMPATIBILITY when required
-> MIGRATE APPLICATION
-> VALIDATE
-> CONTRACT
```

Not every evolution requires backfill or dual-read compatibility. Any future backfill requires explicit change approval, data inventory, conflict classification, reconciliation strategy, quarantine/manual-review path when needed, validation criteria, and rollback strategy. Phase 0 authorizes none of these actions.

## Risks / Trade-offs

- [Risk] Legacy UserRequest approval can create User without Person. -> Keep completeness PENDING and inventory before contract changes.
- [Risk] Role changes synchronize User and active Affiliate. -> Do not migrate catalogs without business approval.
- [Risk] Payment movement provenance is polymorphic. -> Keep explicit follow-up separate and forbid fabricated historical links.
- [Risk] DINADECO depends on movement history. -> Report data limitations and exclude formal accounting.
- [Risk] Duplicated contact fields diverge. -> Keep unresolved ownership explicit and preserve valid snapshots.

## Open Questions

- What are live counts of users and affiliates without Person?
- Which system owns email, phone, address, birthDate, and gender?
- Can Affiliates hold multiple or simultaneous positions?
- Do positions require effective dates and formal Junta history?
- What is the official Position catalog?
- Should external donors become persistent actors?
- Can reservations be requested by organizations or unauthenticated third parties?
- What cardinality and integrity model should connect Payment and FinancialMovement?
- Which future obligations, if any, justify FinancialCharge generalization?

These business decisions do not block approval of Phase 0 as a baseline. They block their respective future implementation changes.

## Future Change Candidates

- `canonicalize-person-identity`
- `separate-system-roles-and-positions`
- `strengthen-payment-movement-lineage`

`introduce-party-model` remains blocked. `generalize-financial-charge` remains proposed and future. No candidate is created or implemented by this change.
