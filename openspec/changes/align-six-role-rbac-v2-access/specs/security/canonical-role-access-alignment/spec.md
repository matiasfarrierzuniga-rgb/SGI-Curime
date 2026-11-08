# Spec Delta

## Purpose

Define least-privilege alignment between persisted canonical role assignments, implemented business operations, backend enforcement, and frontend access surfaces for every SGI-Curime profile.

## ADDED Requirements

### Requirement: Persisted capabilities authorize only equivalent implemented operations
The system SHALL authorize an operation only when the authenticated session has its approved persisted capability, the endpoint implements the same business operation, and all applicable domain-scope rules pass. Similar names or broader module access SHALL NOT substitute for an approved equivalence.

#### Scenario: Exact capability and domain scope allow an operation
- **WHEN** an active ERP-admitted session has the persisted capability mapped to an implemented operation and satisfies its business-scope rules
- **THEN** the backend SHALL allow that operation independently of frontend visibility

#### Scenario: Related capability does not imply access
- **WHEN** a session has a capability for reading, creating, reviewing, approving, updating, publishing, or another related operation but lacks the capability required by the requested operation
- **THEN** the backend SHALL deny the request with `403`

#### Scenario: Unauthenticated request is rejected
- **WHEN** a protected operation is requested without a valid authenticated session
- **THEN** the backend SHALL reject the request with `401`

### Requirement: Canonical assignment matrix covers all six roles
The authorization contract SHALL cover Presidency, Secretariat, Treasury, Institutional Operator, System Administrator, and Community User using their persisted assignments as input. Role assignment counts SHALL be verified against current canonical evidence before behavioral alignment is accepted.

#### Scenario: Institutional role is evaluated completely
- **WHEN** any of the four institutional roles or the system administrator is assessed
- **THEN** every persisted assignment for that role SHALL be classified as implemented-and-aligned, implemented-but-misaligned, or without equivalent implementation

#### Scenario: Assignment counts drift from expected baseline
- **WHEN** current canonical evidence does not match Presidency 16, Secretariat 24, Treasury 26, Operator 12, System Administrator 27, and Community User 0
- **THEN** alignment SHALL stop for the affected baseline and report the discrepancy instead of silently changing grants or assuming the expected matrix

### Requirement: Frontend surfaces mirror backend-authorized operations
ERP routes, Sidebar destinations, dashboards, and action controls SHALL require the capability of the operation they expose. Frontend policy SHALL consume server-resolved session capabilities and SHALL NOT infer authorization from role labels or client-provided capability data.

#### Scenario: Authorized feature is reachable
- **WHEN** a session has the required capability and the corresponding backend operation is implemented
- **THEN** the route and applicable screen or action SHALL be available and direct navigation SHALL succeed

#### Scenario: Unauthorized direct route is denied
- **WHEN** a session directly requests an ERP route without its required capability
- **THEN** the frontend SHALL prevent protected content and data from rendering and SHALL present the existing forbidden outcome

#### Scenario: Hidden action remains backend protected
- **WHEN** an unavailable action is omitted from the interface
- **THEN** direct invocation of its backend operation without the required capability SHALL still be denied

### Requirement: Unsupported capabilities do not create fictional functionality
A persisted capability without an equivalent implemented operation SHALL remain non-routable until a separately approved functional contract exists. The system SHALL NOT create placeholder routes, fictitious data, broad endpoint mappings, or unrelated operation access to make the capability appear implemented.

#### Scenario: Capability has no endpoint equivalence
- **WHEN** traceability finds no implemented endpoint and business operation equivalent to a persisted capability
- **THEN** the capability SHALL be reported as unsupported and SHALL expose no ERP route or action

#### Scenario: Existing module covers only part of a capability family
- **WHEN** a module implements one operation but not another operation named by a persisted capability
- **THEN** only the implemented operation SHALL be exposed and the missing operation SHALL remain unsupported

### Requirement: Canonical profile boundaries remain distinct
Each canonical profile SHALL receive only functionality supported by its own persisted assignments and implemented contracts. Shared screens and layouts MAY be reused, but their data and actions SHALL be filtered by capability and business scope.

#### Scenario: Presidency uses shared administrative experience
- **WHEN** Presidency enters the ERP
- **THEN** the shared administrative dashboard and institutional screens SHALL expose only authorized assembly, agreement, authorization, supervision, personal assembly, profile, and justification functionality that is implemented

#### Scenario: Secretariat uses implemented institutional workflows
- **WHEN** Secretariat enters the ERP
- **THEN** implemented registry, affiliation, assembly, minutes, document, event, venture, and volunteering functions SHALL be exposed only at its assigned operation level

#### Scenario: Treasury uses existing financial behavior
- **WHEN** Treasury enters the ERP
- **THEN** existing financial dashboard, charges, payments, movements, donations, reconciliation, and reports SHALL expose only implemented authorized operations without changing accounting calculations

#### Scenario: Operator uses existing operational behavior
- **WHEN** Institutional Operator enters the ERP
- **THEN** existing reservation, inventory, loan, maintenance, and operational functions SHALL expose only implemented authorized operations and SHALL reuse the inventory dashboard when applicable

#### Scenario: System Administrator remains least privileged by operation
- **WHEN** System Administrator enters the ERP
- **THEN** account, role, audit, and authorized supervision functions SHALL distinguish read from mutation and SHALL preserve self-account and privilege-escalation restrictions

### Requirement: Community User remains outside institutional ERP
`ROLE_COMMUNITY_USER` SHALL have zero institutional assignments and SHALL NOT gain ERP access from authentication alone. Existing community and public functions SHALL retain their independent authorization and business contracts.

#### Scenario: Community account requests ERP access
- **WHEN** an authenticated Community User requests an ERP route or institutional endpoint
- **THEN** the system SHALL deny ERP access and SHALL NOT expose institutional data or actions

#### Scenario: Community account uses implemented community services
- **WHEN** an authenticated Community User accesses an existing community function
- **THEN** the system SHALL apply that function's existing community authorization without treating the user as an institutional operator

#### Scenario: Visitor accesses public volunteering
- **WHEN** a visitor without an account accesses an implemented public volunteering flow
- **THEN** the flow SHALL remain available without requiring a community account

### Requirement: Authorization evidence supports controlled integration
Completion SHALL include role-to-surface traceability and positive and negative evidence for changed authorization behavior. Unknown V2 use-case mappings SHALL remain `NOT_VERIFIED` and SHALL NOT be treated as authority for endpoints, routes, or grants.

#### Scenario: Alignment is proposed for integration
- **WHEN** implementation review is complete
- **THEN** evidence SHALL identify corrected access, reused screens, unsupported capabilities, modified files, executed validation results, regression risks, and a GO or NO-GO recommendation

#### Scenario: Required authorization evidence is missing or failing
- **WHEN** a changed protected operation lacks negative coverage or relevant validation fails
- **THEN** integration status SHALL be NO-GO and the operation SHALL NOT be declared aligned
