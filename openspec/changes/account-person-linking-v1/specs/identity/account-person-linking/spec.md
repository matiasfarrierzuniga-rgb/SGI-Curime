# Spec Delta

> **VIGENTE PARCIAL.** Applies to explicit administrative linking only. It does not govern public community registration and does not require `UserRequest` approval for that registration.

## Purpose

Define consulta y vinculación administrativa segura entre cuentas SGI y Personas canónicas, sin confundir identidad, afiliación, gobierno institucional ni autorización de software.

## ADDED Requirements

### Requirement: Person-first administrative account status
The system SHALL present an authorized administrator with a Person-rooted account status that distinguishes canonical identity, affiliation status, institutional appointment, individual account, activation state, and software role.

#### Scenario: Person has linked account
- **WHEN** an authorized administrator consults a Person with a linked User
- **THEN** the result identifies the Person, exposes the account activation state and software role, and keeps account email distinct from Person contact data

#### Scenario: Affiliate board member has no account
- **WHEN** an authorized administrator consults an affiliated Person with a BoardAppointment and no User
- **THEN** the result reports no linked account and does not infer a role, credential, or account from affiliation or appointment

### Requirement: Explicit account-to-Person linking
The system SHALL allow a specifically authorized administrator to link a selected unlinked User to a selected canonical Person only after explicit confirmation of the two identifiers.

#### Scenario: Authorized explicit link
- **WHEN** an authorized administrator confirms an unlinked User and a Person without another User
- **THEN** the system persists exactly that User-to-Person relation and returns the refreshed Person-rooted account status

#### Scenario: Weak identity similarity
- **WHEN** a User and Person share a name, email, or identification but no administrator confirms the explicit pair
- **THEN** the system SHALL NOT create or suggest a binding automatically

### Requirement: Link conflict and concurrency protection
The system SHALL reject a link when the selected User is already linked, the selected Person already has a different User, or a concurrent write makes either condition true.

#### Scenario: Account already linked
- **WHEN** an administrator attempts to link a User with an existing `personId`
- **THEN** the system rejects the request without changing either relation

#### Scenario: Person already has another account
- **WHEN** an administrator selects a Person whose unique account relation belongs to another User
- **THEN** the system rejects the request without transferring either account

#### Scenario: Concurrent confirmation
- **WHEN** concurrent link attempts select the same User or Person
- **THEN** at most one link persists and every rejected attempt returns a conflict outcome without partial writes

### Requirement: Link isolation and auditability
The system SHALL record a successful account-to-Person link in an audit event and SHALL NOT change affiliation, governance appointment, role, permissions, personal facts, access email, credentials, activation state, tokens, or sessions as a side effect.

#### Scenario: Successful link preserves independent domains
- **WHEN** an account-to-Person link succeeds
- **THEN** affiliation, appointments, role grants, credentials, access email, and Person data remain unchanged while the audit records actor, target account, target Person, and outcome

#### Scenario: Failed link leaves no audit success event
- **WHEN** validation, authorization, or uniqueness checks reject a link
- **THEN** no success audit event or partial identity relation is persisted

### Requirement: Privacy-preserving administrative confirmation
The system SHALL show only the minimum identity evidence needed to distinguish the selected User and Person and SHALL not expose full identification values in list, search, confirmation, or error surfaces.

#### Scenario: Confirmation dialog
- **WHEN** an administrator opens account-link confirmation
- **THEN** the dialog names the selected account and Person, explains that roles and institutional relationships remain unchanged, and requires an explicit confirmation action

#### Scenario: Unauthorized actor
- **WHEN** an actor lacks the required read or link capability
- **THEN** the system withholds the protected data or mutation controls and the API rejects direct mutation attempts

### Requirement: Existing account lifecycle reuse
The system SHALL direct administrators managing a Person without an account to an existing approved account creation, approval, or activation workflow and SHALL NOT introduce a second registration or activation lifecycle.

#### Scenario: Person without account
- **WHEN** an authorized administrator consults a Person without a linked account
- **THEN** the system identifies that no account exists and offers only actions backed by an existing authorized lifecycle contract
