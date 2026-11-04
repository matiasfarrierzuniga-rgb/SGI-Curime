# Spec Delta

## Purpose

Defines SGI-Curime's versioned RBAC V2 authorization contract across persisted roles, ERP admission, community identity, and protected operations.

## ADDED Requirements

### Requirement: Canonical RBAC capability catalog
The system SHALL maintain one versioned canonical catalog for every permission code accepted by runtime authorization, persisted seed policy, and frontend access contract. A persisted code absent from that approved catalog SHALL be denied without granting access.

#### Scenario: Approved persisted capability is evaluated
- **WHEN** an active ERP-admitted user holds an approved persisted capability
- **THEN** the system evaluates that capability consistently at protected frontend and backend boundaries

#### Scenario: Persisted capability is not approved
- **WHEN** a user holds a database permission code absent from the canonical catalog
- **THEN** the system denies the protected operation and records no implied capability mapping

### Requirement: ERP admission is separate from affiliation
The system SHALL determine ERP admission from active account state, active software-role assignment, and the role's approved ERP classification. It SHALL NOT require an active Affiliate for technical or institutional software roles and SHALL NOT derive access from governance titles.

#### Scenario: Active technical administrator lacks affiliate
- **WHEN** an active user assigned `ROLE_SYSTEM_ADMIN` has no Affiliate record
- **THEN** the user is ERP-admitted and can access only persisted approved technical capabilities

#### Scenario: Community user signs in
- **WHEN** an active user is assigned `ROLE_COMMUNITY_USER`
- **THEN** the user can access authenticated community behavior but is not ERP-admitted

#### Scenario: Ineligible account requests ERP
- **WHEN** a user is inactive, blocked, locked, expired, has an inactive role, or has no ERP-admitted role classification
- **THEN** the system denies ERP admission regardless of persisted permissions

### Requirement: Canonical community role transition
The system SHALL use `ROLE_COMMUNITY_USER` as the canonical software role for community accounts. Transition from `Cuenta comunitaria` SHALL be forward-only, idempotent, preserve users and zero-permission assignments, and never grant ERP access.

#### Scenario: Legacy community account is transitioned
- **WHEN** a user is assigned legacy `Cuenta comunitaria` during the approved transition
- **THEN** the user is reassigned to `ROLE_COMMUNITY_USER` without changing account state, Person linkage, tokens, sessions, or permissions

#### Scenario: Duplicate community role records exist
- **WHEN** both community-role records exist before transition completion
- **THEN** the system preserves the canonical role and prevents new legacy-role assignment without deleting historical records automatically

### Requirement: Capability-first protected operations
The system SHALL authorize sensitive operations from server-resolved persisted capabilities, not software-role names. A role-name guard may remain only for an endpoint whose required capability is explicitly pending approval and documented as a transition exception.

#### Scenario: Equivalent capability exists
- **WHEN** a role-name-protected operation has an approved canonical capability with equivalent or narrower access
- **THEN** the operation uses the persisted capability and returns `403` to authenticated users missing it

#### Scenario: Capability is not approved for an operation
- **WHEN** no approved capability represents a sensitive operation
- **THEN** the system retains its explicit transition policy and does not infer or grant a capability

#### Scenario: Client claims privilege
- **WHEN** a caller sends role names or permission codes not resolved from current persistence
- **THEN** the system ignores those claims and authorizes only server-resolved permissions

### Requirement: Legacy RBAC compatibility transition
The system SHALL preserve legacy capabilities and legacy software roles during the approved RBAC V2 transition. It SHALL not automatically grant V2 role permissions to legacy roles or assign V2 roles to existing users.

#### Scenario: Legacy actor resolves access
- **WHEN** a user remains assigned to a legacy role with legacy persisted permissions
- **THEN** existing approved legacy capability checks continue to use those persisted permissions

#### Scenario: New V2 catalog is deployed
- **WHEN** canonical V2 capability definitions are deployed before role-assignment migration
- **THEN** no user gains access solely because a capability or role definition exists
