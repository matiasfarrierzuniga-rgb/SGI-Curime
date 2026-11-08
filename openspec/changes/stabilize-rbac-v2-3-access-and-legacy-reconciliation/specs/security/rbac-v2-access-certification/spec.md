# Spec Delta

## Purpose

Defines the canonical RBAC V2.3 functional contract and evidence required to certify effective access consistently across persistence, APIs and user-facing ERP surfaces.

## ADDED Requirements

### Requirement: Six-role functional contract remains canonical
The system SHALL preserve the six approved canonical roles and derive their effective assignments from the approved functional contract and executable canonical catalog. A stale document, report, count or test expectation MUST NOT remove a current grant, restore retired access or redesign a role.

#### Scenario: Historical assignment count is evaluated
- **WHEN** certification compares current evidence with an older 24-grant, 26-grant, 105-assignment or other numeric reference
- **THEN** it records the reference as historical evidence and evaluates current capability identities against approved functional responsibilities

#### Scenario: Persisted catalog differs
- **WHEN** current persisted assignments differ materially from the executable catalog or approved functional responsibilities
- **THEN** certification stops with `NO-GO` and no automatic grant synchronization is performed

### Requirement: Effective access is operation exact
The system SHALL authorize an institutional operation only from current server-resolved persisted capabilities, applicable domain rules and an equivalent implemented API operation. Role labels, governance offices, browser claims and similarly named capabilities MUST NOT substitute for the required capability.

#### Scenario: Exact capability is present
- **WHEN** an eligible session has the required persisted capability and satisfies domain scope
- **THEN** the backend permits the implemented operation independently of role label

#### Scenario: Related capability is present
- **WHEN** a session has a related read, create, review, approve, update, manage or publish capability but lacks the exact required capability
- **THEN** the backend denies the operation with `403`

#### Scenario: Request is unauthenticated
- **WHEN** a protected operation is requested without valid authentication
- **THEN** the backend rejects it with `401`

### Requirement: Secretariat workflows remain available
Secretariat SHALL retain its approved appointment, affiliate-request and affiliate-management operations at the exact levels represented by current effective capabilities. Stabilization MUST NOT remove these working functions to match superseded specifications.

#### Scenario: Secretariat manages appointments
- **WHEN** Secretariat has `adm.institutional-board.manage`
- **THEN** create, edit, replace and revoke appointment operations remain available and capability-protected

#### Scenario: Secretariat reviews affiliation requests
- **WHEN** Secretariat has the approved affiliation-review capability
- **THEN** it can list, inspect, approve and reject requests according to backend lifecycle rules

#### Scenario: Actor lacks the operation capability
- **WHEN** an authenticated actor lacks the capability required by an appointment, request or affiliate operation
- **THEN** navigation, direct route, action and API access deny consistently

### Requirement: Unsupported grants create no fictional operation
A persisted capability without an equivalent implemented business operation SHALL remain non-routable and MUST NOT be mapped to a broader endpoint, placeholder screen or unrelated action merely to make certification pass.

#### Scenario: Capability has no implementation
- **WHEN** traceability finds no equivalent API operation and domain behavior
- **THEN** the matrix records the capability as `UNSUPPORTED` or `NOT_VERIFIED` and exposes no new access

### Requirement: Cross-layer certification is required
Certification SHALL trace each reviewed operation through persisted `RolePermission`, backend guard, route, navigation, dashboard and action visibility, with positive and negative evidence. Missing or failing applicable evidence produces `NO-GO`.

#### Scenario: Operation is certified
- **WHEN** persistence evidence, positive access, negative access, direct API behavior, deep-link behavior and action visibility agree
- **THEN** the operation may be classified `ALIGNED`

#### Scenario: Layer disagrees
- **WHEN** any layer grants, hides or denies access inconsistently
- **THEN** the operation is `MISALIGNED` and the branch remains `NO-GO`

#### Scenario: Check cannot run safely
- **WHEN** an applicable check would mutate current development data without an approved procedure
- **THEN** it is recorded `NOT_EXECUTED` and cannot support a production-ready claim

### Requirement: Main integration requires controlled evidence
The change SHALL be eligible for a PR toward `main` only when scope review, relevant tests, builds, architecture checks, OpenSpec validation, diff review and role-based functional certification pass without accidental files, secrets, historical-data loss or privilege expansion.

#### Scenario: All gates pass
- **WHEN** every required gate is `PASSED` and residual risks are accepted
- **THEN** the result may be declared `GO` for reviewed PR preparation

#### Scenario: Gate fails or remains required but unexecuted
- **WHEN** a required gate is `FAILED` or `NOT_EXECUTED`
- **THEN** the result remains `NO-GO` with the blocker identified
