## Purpose

Defines observable architectural governance for incremental frontend vertical-slice migration, preserving runtime behavior while making ownership, dependencies, and verification expectations explicit.

## ADDED Requirements

### Requirement: Frontend ownership boundaries
The frontend SHALL assign bootstrap, providers, router composition, layouts, and global configuration to `app`; domain behavior and screens to `features`; and domain-neutral transport, UI primitives, utilities, testing helpers, and security policy to `shared`.

#### Scenario: New domain code is classified
- **WHEN** a developer adds or moves frontend code
- **THEN** the code has one declared owner among `app`, one domain feature, or `shared`, with no duplicate ownership claim

#### Scenario: Shared extraction is reviewed
- **WHEN** feature code is proposed for `shared`
- **THEN** the change identifies at least two concrete consumers and demonstrates that the extracted behavior is domain-neutral

### Requirement: Dependency direction
The frontend SHALL enforce dependencies from `app` to feature public APIs and shared modules, from features to shared modules, and SHALL reject imports from `shared` into `app` or features and from features into `app` internals.

#### Scenario: Feature imports application internals
- **WHEN** a feature imports an `app` implementation module
- **THEN** architecture validation fails and identifies the violating import

#### Scenario: Cross-feature dependency is required
- **WHEN** one feature needs another feature's contract
- **THEN** it imports only the depended-on feature's documented public API or declared contract, never an internal module

### Requirement: Feature public APIs
Each migrated feature SHALL expose a minimal documented public API for consumers such as route composition, guards, providers, or cross-feature contracts; internal implementation modules SHALL remain private to the feature.

#### Scenario: Router composes migrated feature
- **WHEN** application routing consumes a migrated feature
- **THEN** routing imports its route contribution or public exports rather than page, service, or model internals

#### Scenario: Internal module is imported externally
- **WHEN** code outside a feature imports an internal feature path
- **THEN** architecture validation reports a boundary violation

### Requirement: Behavior-preserving migration gates
Each migration phase SHALL preserve existing URLs, authorization outcomes, HTTP contracts, persisted session semantics unless explicitly approved by a requirement, and user-visible behavior; the phase SHALL pass applicable lint, type/build, automated tests, and relevant smoke checks before merge.

#### Scenario: Structural migration is complete
- **WHEN** a phase changes file ownership or import paths without an approved behavior change
- **THEN** existing route, auth, HTTP, and UI verification remains passing before the phase is merged

#### Scenario: Verification gate fails
- **WHEN** required validation fails or cannot execute
- **THEN** the phase remains unmergeable and records the failure or environmental blocker instead of claiming completion

### Requirement: Incremental tooling adoption
New frontend libraries SHALL be introduced only in a named pilot consumer with documented evidence of benefit, and existing routing, transport, styling, and state mechanisms SHALL remain supported until a separate approved migration replaces them.

#### Scenario: Server-state pilot is introduced
- **WHEN** a migrated feature demonstrates repeated fetch, cache, or invalidation pain
- **THEN** a server-state tool may be piloted in that feature without requiring simultaneous migration of unrelated features

#### Scenario: Broad stack replacement is proposed
- **WHEN** a proposal would replace the router, styling system, or global state approach across the application
- **THEN** it is treated as a separate decision and does not enter this incremental migration by implication

### Requirement: Small reversible delivery units
Architecture migration SHALL be delivered as phase-sized changes with move/boundary commits separated from behavior changes where practical, and each phase SHALL define a rollback point that leaves the application buildable.

#### Scenario: A phase is reviewed
- **WHEN** a migration pull request is opened
- **THEN** its scope, verification evidence, affected feature, and rollback point are identifiable without reconstructing a multi-phase change

## MODIFIED Requirements

### Requirement: Phase 0 scope boundary
The Phase 0 implementation MUST limit changes to the two required architecture documents and any directories needed to contain them. It MUST NOT change application code, dependencies, generated files, migrations, database state, authentication, infrastructure, CI, ADRs, or runtime configuration, and it MUST stop after reporting the Phase 0 Definition of Done. Subsequent frontend consolidation SHALL be planned and delivered as separately approved phases governed by the architecture requirements in this change, rather than being treated as part of the Phase 0 implementation.

#### Scenario: Audit discovers a defect
- **WHEN** inspection or validation reveals a defect, security gap, incompatibility, or missing capability
- **THEN** the issue is documented with its evidence and risk but is not corrected as part of Phase 0

#### Scenario: Phase 0 documentation is complete
- **WHEN** both required documents exist and all applicable Phase 0 checks have been reported
- **THEN** the result includes a checked Definition of Done, lists unresolved observations and pending decisions, and requires explicit approval before Phase 1 begins

#### Scenario: Later consolidation phase begins
- **WHEN** Phase 1 or a later frontend migration is approved
- **THEN** it uses its own implementation scope, verification gates, and rollback point without retroactively expanding Phase 0
