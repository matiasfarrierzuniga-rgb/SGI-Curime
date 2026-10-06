## Purpose

Defines safe, observable Person-first identity ownership while preserving account access boundaries and immutable submitted or historical evidence across all Person-linked workflows.

## ADDED Requirements

### Requirement: Canonical Person and access-account ownership
The system SHALL treat Person structured name, identification/type/normalized identification, birth date, personal phone, address, and retained independent personal-contact email as canonical personal data. The system SHALL treat User email, authentication, authorization, sessions, lock state, password state, and access lifecycle as User-owned data. `User.email` SHALL be the sole authoritative login/access email. The system MUST NOT auto-synchronize `User.email` and `Person.email` in either direction, including during registration; only an explicit personal-contact/profile workflow MAY write retained `Person.email`. If no productive independent personal-contact use case is certified, `Person.email` SHALL be a removal candidate.

#### Scenario: Account email differs from personal contact email
- **WHEN** an approved Person has a personal-contact email and linked User has a different access email
- **THEN** identity/contact views preserve both meanings and authentication continues to use only User email

### Requirement: Submitted and historical snapshot preservation
The system SHALL preserve UserRequest, AffiliateRequest, Donation donor, VolunteerApplication, VentureRequestRevision, IdentityReconciliationManifest, and InventoryLoan snapshot values as submitted or historical evidence. A snapshot MUST NOT become an alternate current-person source merely because a Person later changes.

#### Scenario: Current Person details change after a request
- **WHEN** a linked Person’s current contact detail changes after request submission
- **THEN** request review/history retains submitted evidence and does not rewrite it from Person

### Requirement: Explicit request snapshot names without arbitrary name parsing
The system SHALL transition generic request identity/contact fields to explicit submitted-field names through a compatible API/schema migration. The system MUST preserve original submitted values by direct copy and MUST NOT arbitrarily parse generic `fullName` into Person structured-name fields.

#### Scenario: Generic submitted full name is migrated
- **WHEN** a request containing legacy `fullName` is migrated to an explicit submitted field
- **THEN** its submitted value remains unchanged and no Person structured-name field is inferred solely from that value

### Requirement: Canonical live read and write contract
After a resource completes its approved cutover, current personal identity/contact reads SHALL use the Person-backed projection and current personal writes SHALL use the canonical Person write contract. User and Affiliate compatibility fields MAY remain readable only during their announced migration window; User email remains separately writable as access-account data.

#### Scenario: Migrated affiliate profile update
- **WHEN** an authorized actor updates a migrated personal contact value through the Affiliate-facing contract
- **THEN** the canonical Person value changes through the Person write contract and the affiliation-specific state remains on Affiliate

### Requirement: Identity reconciliation safety
The system SHALL use identification type plus normalized identification as the reconciliation key. Before linking, enforcing, or removing duplicate identity data, the system SHALL classify null links, duplicate candidates, conflicts, incomplete records, and records lacking trustworthy evidence. Ambiguous matches or conflicts MUST remain reviewable exceptions and MUST NOT be silently merged or overwritten.

#### Scenario: Conflicting identity candidate
- **WHEN** a submitted record matches more than one possible Person or conflicts with canonical personal data
- **THEN** the system creates/retains reconciliation evidence, prevents automatic destructive linking, and returns a reviewable conflict outcome

### Requirement: Transactional Person-linked mutation
The system SHALL execute Person resolution/creation and its linked User, Affiliate, or approval state changes atomically. Retried operations MUST be idempotent or return a documented conflict without creating duplicate canonical identities.

#### Scenario: Concurrent approval attempts
- **WHEN** two approval attempts process the same unresolved identity concurrently
- **THEN** at most one canonical outcome commits and the other receives a documented conflict or idempotent result

### Requirement: Compatibility, constraints, and retirement certification
The system MUST NOT make Person links required, remove a duplicate field, or remove a compatibility API alias until recorded certification proves data population classification, zero productive legacy writers, zero productive legacy readers, Person-derived mapping, no frontend legacy semantics, API/frontend consumer migration, conflict handling, reconciliation independence, rollback readiness, snapshot preservation, focused backend/frontend tests, build, and E2E certification. Database compatibility and API compatibility SHALL be staged separately. A temporary API shape MAY project values from Person only inside this staged change; a V1.1 compatibility window SHALL exist only for an actual documented external consumer.

#### Scenario: Legacy duplicate lacks certification
- **WHEN** a User or Affiliate duplicate still has a reader, writer, unclassified record, or unmigrated API consumer
- **THEN** the system retains the compatibility field and does not apply destructive schema enforcement

### Requirement: Person gender and Affiliate gender transition
If gender is retained, the target canonical owner SHALL be `Person.gender`; its schema addition is permitted only in later approved work. `Affiliate.gender` SHALL be a legacy or transitional duplicate. The system SHALL inventory all gender readers and writers, backfill/reconcile safely, migrate reads and writes, and remove the Affiliate duplicate only after retirement certification. Conflicting gender values MUST retain reconciliation evidence and MUST NOT be silently selected or overwritten.

#### Scenario: Conflicting gender evidence
- **WHEN** Affiliate gender and the target Person gender conflict during reconciliation
- **THEN** the system preserves conflict evidence, prevents automatic overwrite or removal, and requires a reviewable reconciliation outcome

### Requirement: Required and intentionally nullable Person links
The system MUST NOT make final `User.personId` or `Affiliate.personId` required until certification proves 100% safe linking, zero nulls, zero unresolved conflicts, normalized uniqueness, preflight evidence, and rollback evidence. The system SHALL keep `UserRequest.personId` and `AffiliateRequest.personId` intentionally nullable pending reconciliation; approval or final domain creation SHALL resolve Person without guessing.

#### Scenario: Request remains unresolved before approval
- **WHEN** a UserRequest or AffiliateRequest has not been safely reconciled
- **THEN** its nullable Person link remains valid and approval/final domain creation performs evidence-led Person resolution

### Requirement: Institutional-access work reconciliation checkpoint
The system SHALL treat `reconcile-institutional-access-contract-v1` Phase B WIP/stash as preserved non-canonical work while this ownership contract is incomplete. After Stage B preflight/compatibility completion, implementation SHALL reapply and reconcile that WIP against the approved Person-first contract before resuming it.

#### Scenario: Access-contract Phase B resumes
- **WHEN** ownership Stage B completes and the team resumes institutional-access Phase B
- **THEN** preserved WIP is reviewed against canonical snapshot, Person-link, and User-email rules before it is extended or committed
