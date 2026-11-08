# Spec Delta

## Purpose

Defines auditable review of administrative privileges after institutional appointment changes while preserving identity, account, affiliation and governance history.

## ADDED Requirements

### Requirement: Appointment changes require privilege review
The system SHALL require an explicit administrative privilege review when an appointment ends, a person is replaced, an office changes or a governance term concludes.

#### Scenario: Appointment is revoked
- **WHEN** an authorized actor records the end of an active appointment
- **THEN** the appointment history is preserved and the affected person's administrative access is marked for review

#### Scenario: Appointment is replaced
- **WHEN** an appointment is closed and a successor is created
- **THEN** privilege review covers both the outgoing and incoming persons without inferring either software role

#### Scenario: Term concludes
- **WHEN** a governance term reaches its recorded conclusion
- **THEN** active institutional privileges associated for review with its appointments are evaluated through the same explicit procedure

### Requirement: Domain records survive appointment end
Ending or changing an appointment MUST preserve `Person`, `User`, `Affiliate`, `User.personId` and every historical `GovernanceMembership`. It MUST NOT delete a community account, affiliation, session history or another legitimate authorization merely because the appointment changed.

#### Scenario: Appointed person has community account and affiliation
- **WHEN** the person's appointment ends
- **THEN** the account, Person link, Affiliate record and historical appointment remain intact

### Requirement: Governance office and software role remain independent
An appointment SHALL NOT grant, replace or revoke a software role automatically. Effective RBAC changes require an independently authorized role-management decision based on current legitimate responsibilities.

#### Scenario: Person receives an appointment
- **WHEN** a governance membership is created
- **THEN** no software role or capability is assigned as a side effect

#### Scenario: Person leaves an office
- **WHEN** a governance membership ends
- **THEN** no software role is removed until an authorized privilege reviewer decides which access is no longer legitimate

### Requirement: Privilege review is least-privilege and auditable
The review SHALL identify actor, affected person/account, trigger, current effective permissions, decision, rationale and timestamp. Any resulting role change SHALL use the existing protected role-change contract and session safeguards.

#### Scenario: Privileges remain legitimate
- **WHEN** review establishes that current access is justified independently of the ended appointment
- **THEN** access remains unchanged and the decision is recorded

#### Scenario: Privileges must be reduced
- **WHEN** review establishes that administrative access is no longer legitimate
- **THEN** an authorized role change applies the approved least-privilege result, protects sessions and records role-change audit evidence

#### Scenario: Reviewer lacks authority
- **WHEN** an actor without the required identity or role-management capability attempts a privilege decision
- **THEN** the decision is rejected with `403` and effective access remains unchanged

### Requirement: Review failure does not corrupt governance history
A failure while recording or applying a privilege-review decision MUST NOT delete or rewrite the appointment transition. The system SHALL expose the unresolved review state for authorized follow-up.

#### Scenario: Access adjustment fails after valid appointment end
- **WHEN** the role-management operation cannot complete
- **THEN** the ended appointment remains valid historical evidence and the privilege review remains unresolved rather than fabricating success
