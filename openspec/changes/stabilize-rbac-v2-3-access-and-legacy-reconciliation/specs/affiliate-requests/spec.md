# Spec Delta

## MODIFIED Requirements

### Requirement: Authorized administrative route
The system SHALL expose the functional "Solicitudes de afiliación" screen at `/app/admin/requests` under the effective persisted `padron.application.review` capability and equivalent backend capability enforcement, independent of software role label.

#### Scenario: Anonymous visitor opens the route
- **WHEN** an anonymous visitor opens `/app/admin/requests`
- **THEN** the system redirects the visitor to `/login` without rendering privileged request data

#### Scenario: Authenticated user lacks capability
- **WHEN** an authenticated user without `padron.application.review` opens `/app/admin/requests`
- **THEN** the system redirects the user to `/403` before protected data loads

#### Scenario: Administrator opens the route
- **WHEN** Secretariat has persisted `padron.application.review` and opens `/app/admin/requests`
- **THEN** the system renders the functional "Solicitudes de afiliación" screen

#### Scenario: Authorized actor has another role label
- **WHEN** an eligible actor with persisted `padron.application.review` opens the route
- **THEN** access is allowed without requiring an administrator role label

#### Scenario: Unknown role opens the route
- **WHEN** an authenticated session has an unknown role or an unrecognized capability claim
- **THEN** the system denies access by default

### Requirement: Approve pending request
The system SHALL allow an authorized actor with the exact approved affiliation-review operation to approve only a `PENDING` request by invoking `PATCH /affiliate-requests/:id/approve` after explicit confirmation and backend domain validation.

#### Scenario: Administrator confirms approval
- **WHEN** an authorized actor confirms approval of a `PENDING` request
- **THEN** the system sends one approval mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Approval succeeds
- **WHEN** the backend approves the request
- **THEN** the system refreshes affected request data, presents the `APPROVED` state, and reports success

#### Scenario: Approval conflicts with current backend state
- **WHEN** approval returns a conflict because the request was already resolved or an Affiliate already exists
- **THEN** the system displays the backend-derived conflict message, remains usable, and permits refreshing authoritative request data

#### Scenario: Approval fails generically
- **WHEN** approval fails for another recoverable reason
- **THEN** the system displays an error, releases the busy state, and allows a later retry

#### Scenario: Actor lacks approval access
- **WHEN** an authenticated actor without the required capability calls the approval API directly
- **THEN** the backend returns `403` without changing the request or creating an Affiliate

### Requirement: Reject pending request
The system SHALL allow an authorized actor with the exact approved affiliation-review operation to reject only a `PENDING` request by invoking `PATCH /affiliate-requests/:id/reject` with a non-empty rejection reason after explicit confirmation.

#### Scenario: Rejection reason is missing
- **WHEN** the authorized actor attempts to continue without a non-empty rejection reason
- **THEN** the system displays validation feedback and does not send a rejection mutation

#### Scenario: Administrator confirms rejection
- **WHEN** the actor provides a valid reason and confirms rejection
- **THEN** the system sends one rejection mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Rejection succeeds
- **WHEN** the backend rejects the request
- **THEN** the system refreshes affected request data, presents the `REJECTED` state and rejection reason, and reports success

#### Scenario: Rejection fails
- **WHEN** rejection returns a conflict or another recoverable error
- **THEN** the system displays the available backend-derived message, releases the busy state, and allows authoritative data to be refreshed

#### Scenario: Actor lacks rejection access
- **WHEN** an authenticated actor without the required capability calls the rejection API directly
- **THEN** the backend returns `403` without changing the request

### Requirement: Affiliate and user requests remain distinct
The ERP SHALL treat Affiliate Requests as the active affiliation workflow and preserve historical UserRequest records without presenting retired UserRequest review endpoints, navigation or approval actions as current functionality.

#### Scenario: Administrator uses ERP navigation
- **WHEN** the actor reviews available request destinations
- **THEN** navigation identifies `/app/admin/requests` as "Solicitudes de afiliación" and does not label it as account registration review

#### Scenario: Historical UserRequest evidence exists
- **WHEN** documentation or persistence contains prior UserRequest records
- **THEN** the records remain preserved as historical evidence without restoring retired operational grants or UI

#### Scenario: Existing User Requests route is opened
- **WHEN** an actor attempts to open the removed UserRequest administration route
- **THEN** the system does not present a functional account-approval workflow
