## Purpose

Defines the evidence-based data-architecture governance baseline required before future SGI-Curime schema evolution is proposed or implemented.

## ADDED Requirements

### Requirement: Phase 0 evidence baseline
Phase 0 SHALL document the verified AS-IS architecture at baseline `3e24a9d47889274e6a12743e3e62428c632b7cd7`, distinguish verified facts from proposed, approval-ready, blocked, pending, and business-required decisions, and include repository evidence references.

#### Scenario: Evidence is available
- **WHEN** a statement is supported by schema, migration, service, guard, capability policy, frontend consumer, test, documentation, or command output
- **THEN** the statement is recorded with a repository path or command reference

#### Scenario: Evidence is unavailable
- **WHEN** live database contents or institutional rules are unavailable
- **THEN** the statement is marked PENDING or BUSINESS_DECISION_REQUIRED without invented quantities or rules

### Requirement: Identity ownership documentation
Phase 0 SHALL document an identity ownership matrix for Person, User, Affiliate, UserRequest, and AffiliateRequest covering identity, contact, account, affiliation, unresolved fields, current readers/writers, target candidates, snapshots, migration risks, and decision status.

#### Scenario: Duplicated identity fields exist
- **WHEN** a field is stored or represented in more than one identity-related entity
- **THEN** the matrix distinguishes canonical mutable identity candidates from legitimate historical snapshots and does not assert unapproved ownership

#### Scenario: Identity completeness is unknown
- **WHEN** User.personId or Affiliate.personId completeness has not been measured safely
- **THEN** the baseline records both links as nullable currently and marks IDENTITY_DATA_COMPLETENESS=PENDING

### Requirement: Role and position governance
Phase 0 SHALL document the exact current Role classification, concrete backend/frontend consumers, role synchronization behavior, and conceptual separation `SystemRole != Position` while preserving ADR-DATA-002=ACCEPTED only for the conceptual distinction `ERP authorization and institutional Position are distinct concepts.`

#### Scenario: Role has mixed semantics
- **WHEN** a role is consumed by account authorization and institutional or assembly behavior
- **THEN** the baseline classifies the role as MIXED or AMBIGUOUS with evidence references

#### Scenario: Position rules are unresolved
- **WHEN** position multiplicity, simultaneity, effective dates, history, or official catalog are not approved
- **THEN** the baseline marks them BUSINESS_DECISION_REQUIRED and does not authorize AffiliatePosition N:M or UserRole N:M

### Requirement: Business actor governance
Phase 0 SHALL document a module-level business actor/operator matrix for Reservation, Donation, InventoryLoan, AffiliateRequest, UserRequest, Assembly, and Payment, and SHALL preserve PARTY_DECISION=BLOCKED.

#### Scenario: Actor differs from operator
- **WHEN** a module stores a donor, borrower, requester, participant, or affiliate distinct from the authenticated account performing an operation
- **THEN** the matrix records both roles, external support, identity requirement, organization requirement, and whether Party is justified

#### Scenario: Party is not justified
- **WHEN** current module-specific semantics do not require a global actor abstraction
- **THEN** Party remains a future alternative and no module is required to use Party

### Requirement: Financial lineage documentation
Phase 0 SHALL document Reservation-to-FinancialCharge-to-Payment-to-FinancialMovement transitions, cancellation rules, exact settlement, current source/sourceId convention, Donation original/reversal FKs, and the absence of a physical Payment-to-FinancialMovement FK.

#### Scenario: Reservation is approved
- **WHEN** a pending Reservation is approved in the current serializable service flow
- **THEN** the baseline records Reservation APPROVED and FinancialCharge PENDING

#### Scenario: Payment settles a charge
- **WHEN** a pending charge is settled exactly
- **THEN** the baseline records Payment CONFIRMED, FinancialCharge PAID, FinancialMovement INCOME, source RESERVATION_PAYMENT, and sourceId Payment.id

#### Scenario: Explicit payment lineage is proposed
- **WHEN** future design considers a Payment-to-FinancialMovement FK
- **THEN** it is recorded as `PAYMENT_MOVEMENT_EXPLICIT_LINEAGE=PROPOSED_FOLLOW_UP` without implementation or historical backfill authorization

### Requirement: Integrity and reporting governance
Phase 0 SHALL document an integrity matrix identifying whether each invariant is protected by PostgreSQL, Prisma, NestJS, frontend, convention only, or not established, and SHALL document DINADECO's FinancialMovement source and limitations.

#### Scenario: Service validation exists without database constraint
- **WHEN** an invariant is enforced by NestJS but no global PostgreSQL constraint is established
- **THEN** the matrix labels it NestJS-owned and does not present it as a database constraint

#### Scenario: DINADECO report is reviewed
- **WHEN** the report is analyzed
- **THEN** the baseline records that it queries FinancialMovement directly, does not reconstruct from Reservation/Payment/Donation, does not require sourceId for current reporting, is not formal accounting, has no bank reconciliation, and may be affected by incomplete history

### Requirement: Historical snapshot governance
Phase 0 SHALL document that `canonical mutable identity != historical submitted snapshot` and identify valid snapshots such as UserRequest, AffiliateRequest, AssemblyConvocation.roleNameSnapshot, future positionNameSnapshot candidates, and historically required textual Donation donor data.

#### Scenario: Historical submission is preserved
- **WHEN** a request or institutional event records submitted context
- **THEN** the baseline treats the snapshot as historical evidence rather than accidental duplicate mutable identity

### Requirement: ADR and migration governance
Phase 0 SHALL record exact statuses ADR-DATA-001=PROPOSED, ADR-DATA-002=ACCEPTED, ADR-DATA-003=BLOCKED, and ADR-DATA-004=PROPOSED, with ADR-DATA-002 accepted only for the conceptual distinction `ERP authorization and institutional Position are distinct concepts.` Phase 0 SHALL also record an explicitly conditional future migration pattern and required approval gates.

#### Scenario: Future data evolution is planned
- **WHEN** a future change requires schema or data evolution
- **THEN** the plan may conditionally use expand, backfill/reconcile, dual-read/compatibility, application migration, validation, and contract removal, with explicit approval, inventory, conflict handling, validation, and rollback criteria

#### Scenario: Phase 0 closes
- **WHEN** the required matrices, lineage, snapshots, DINADECO limitations, ADR states, open decisions, and scope boundaries are documented
- **THEN** Phase 0 may be marked as an approved baseline while stopping with no Party, Position, FinancialCharge, Payment-Movement, Prisma, migration, backfill, data, dependency, or production implementation
