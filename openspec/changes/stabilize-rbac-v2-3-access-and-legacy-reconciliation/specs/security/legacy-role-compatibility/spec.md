# Spec Delta

## Purpose

Defines safe retirement of legacy affiliate-role coupling while preserving historical records, assembly snapshots and compatible reads until replacement behavior is certified.

## ADDED Requirements

### Requirement: Legacy metadata does not grant effective access
Effective authorization SHALL derive from current persisted user role permissions and MUST NOT derive from `Affiliate.legacyRoleId`, historical role snapshots or governance membership data.

#### Scenario: Legacy affiliate role differs from user role
- **WHEN** an affiliate's retained legacy role differs from the linked user's current persisted role
- **THEN** authorization follows the user's current server-resolved permissions

#### Scenario: Governance title resembles a software role
- **WHEN** a person holds an institutional office whose title resembles a canonical software role
- **THEN** the office grants no ERP capability by itself

### Requirement: Role change preserves security behavior and audit
A supported software-role change SHALL atomically update the authoritative user role, invalidate affected sessions according to the existing security contract and record sanitized actor, target, previous-role and new-role evidence.

#### Scenario: Role change succeeds
- **WHEN** an authorized actor assigns an active canonical role to an eligible user
- **THEN** the authoritative role changes, affected sessions are protected and one role-change audit outcome is recorded

#### Scenario: Compatibility write fails
- **WHEN** a still-required compatibility projection cannot be updated in the same authorized transaction
- **THEN** the operation fails without committing a partial authoritative role change

### Requirement: Compatibility readers remain until certified replacement
Each legacy reader or writer SHALL remain available until an identified replacement is implemented and evidence proves no required runtime, API, frontend, test or historical consumer depends on the legacy behavior.

#### Scenario: Consumer still exists
- **WHEN** inventory finds an active consumer of affiliate legacy role data
- **THEN** the compatibility field and required projection remain in place and physical retirement is blocked

#### Scenario: Replacement is certified
- **WHEN** a consumer uses an approved canonical source and positive, negative and compatibility tests pass
- **THEN** its legacy authorization dependency may be removed without deleting historical data

### Requirement: Assembly history remains interpretable
Assembly convocations and other durable records SHALL preserve recorded legacy role identifiers and name snapshots as historical evidence. Current authorization or current identity data MUST NOT rewrite those snapshots.

#### Scenario: Current role later changes
- **WHEN** a user's software role changes after an assembly convocation was recorded
- **THEN** the historical convocation retains its original role snapshot

#### Scenario: Legacy role cannot be resolved
- **WHEN** a historical legacy role identifier no longer resolves to an active role
- **THEN** the historical record remains readable without fabricating a replacement role or governance membership

### Requirement: Logical retirement precedes physical removal
Removing legacy authorization logic SHALL be separate from dropping columns, constraints or historical values. Physical removal MUST require a separately approved migration with data inventory, backup, rollback or forward-repair plan and safe-environment evidence.

#### Scenario: Logic no longer reads legacy field
- **WHEN** zero productive authorization readers and writers are certified
- **THEN** the field becomes a physical-removal candidate but remains stored until a separate migration is approved

#### Scenario: Physical removal lacks approval
- **WHEN** no explicit destructive migration authorization or recoverable data procedure exists
- **THEN** schema and historical values remain unchanged
