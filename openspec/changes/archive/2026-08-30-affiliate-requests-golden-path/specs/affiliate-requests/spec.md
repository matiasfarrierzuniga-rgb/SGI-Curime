## Purpose

Defines the administrative golden path for reviewing existing Affiliate Requests and resolving them through the backend-owned approval and rejection lifecycle without introducing direct Affiliate creation.

## ADDED Requirements

### Requirement: Authorized administrative route
The system SHALL expose the functional "Solicitudes de afiliación" screen at `/app/admin/requests` under the existing `adm.requests.read` frontend capability while preserving backend administrator enforcement.

#### Scenario: Anonymous visitor opens the route
- **WHEN** an anonymous visitor opens `/app/admin/requests`
- **THEN** the system redirects the visitor to `/login` without rendering privileged request data

#### Scenario: Authenticated user lacks capability
- **WHEN** an authenticated user without `adm.requests.read` opens `/app/admin/requests`
- **THEN** the system redirects the user to `/403`

#### Scenario: Administrator opens the route
- **WHEN** an administrator with `adm.requests.read` opens `/app/admin/requests`
- **THEN** the system renders the functional "Solicitudes de afiliación" screen

#### Scenario: Unknown role opens the route
- **WHEN** an authenticated session has an unknown or unmapped role
- **THEN** the system denies access by default

### Requirement: Affiliate request list
The administrative screen SHALL retrieve requests from `GET /affiliate-requests`, present server-side pagination, and support only the backend-defined status, search, email, and identification filters.

#### Scenario: Requests load successfully
- **WHEN** the administrator opens the screen or changes a supported filter or page
- **THEN** the system requests the corresponding backend page and displays the returned requests and total

#### Scenario: List is loading
- **WHEN** the list request is pending
- **THEN** the system displays accessible loading feedback and does not present stale data as current

#### Scenario: No requests match
- **WHEN** the backend returns an empty page
- **THEN** the system displays an explicit empty state appropriate to the active filters

#### Scenario: List request fails
- **WHEN** the list request fails
- **THEN** the system displays an error state with a retry action that requests the same filters and page again

#### Scenario: Filter changes
- **WHEN** the administrator changes a supported filter
- **THEN** the system resets pagination to the first page and does not invent unsupported query parameters

### Requirement: Authoritative request detail
The system SHALL retrieve the selected request from `GET /affiliate-requests/:id` and display the information required to review its identity, contact details, affiliation reason, status, review metadata, and rejection reason when present.

#### Scenario: Administrator selects a request
- **WHEN** the administrator selects a request from the list
- **THEN** the system loads and displays authoritative detail for that request

#### Scenario: Detail load fails
- **WHEN** the detail request fails
- **THEN** the system displays a recoverable detail error with retry and close actions

#### Scenario: Request is terminal
- **WHEN** the request status is `APPROVED` or `REJECTED`
- **THEN** the detail displays its terminal status and does not offer approve or reject actions

### Requirement: Approve pending request
The system SHALL allow an administrator to approve only a `PENDING` request by invoking `PATCH /affiliate-requests/:id/approve` after explicit confirmation.

#### Scenario: Administrator confirms approval
- **WHEN** the administrator confirms approval of a `PENDING` request
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

### Requirement: Reject pending request
The system SHALL allow an administrator to reject only a `PENDING` request by invoking `PATCH /affiliate-requests/:id/reject` with a non-empty rejection reason after explicit confirmation.

#### Scenario: Rejection reason is missing
- **WHEN** the administrator attempts to continue without a non-empty rejection reason
- **THEN** the system displays validation feedback and does not send a rejection mutation

#### Scenario: Administrator confirms rejection
- **WHEN** the administrator provides a valid reason and confirms rejection
- **THEN** the system sends one rejection mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Rejection succeeds
- **WHEN** the backend rejects the request
- **THEN** the system refreshes affected request data, presents the `REJECTED` state and rejection reason, and reports success

#### Scenario: Rejection fails
- **WHEN** rejection returns a conflict or another recoverable error
- **THEN** the system displays the available backend-derived message, releases the busy state, and allows authoritative data to be refreshed

### Requirement: Backend-owned Affiliate creation
The frontend MUST NOT create an Affiliate directly. Approval SHALL rely exclusively on the existing backend transaction, which resolves the Affiliate Request as `APPROVED` and creates an `ACTIVE` Affiliate that is subsequently available through the existing Affiliates contract.

#### Scenario: Approval creates an Affiliate
- **WHEN** the backend completes `PATCH /affiliate-requests/:id/approve`
- **THEN** the request is `APPROVED` and the created `ACTIVE` Affiliate is available through `GET /affiliates`

#### Scenario: Request is rejected
- **WHEN** the backend completes `PATCH /affiliate-requests/:id/reject`
- **THEN** the request is `REJECTED` and no Affiliate is created by the frontend

#### Scenario: Administrative screen needs creation behavior
- **WHEN** the frontend implements the review workflow
- **THEN** it MUST NOT call or introduce `POST /affiliates`, duplicate the approval transaction, or infer new business states

### Requirement: Accessible and responsive review workflow
The administrative workflow SHALL remain keyboard operable, expose meaningful labels and dialog semantics, provide visible textual state and busy feedback, and adapt to mobile, tablet, and desktop viewports without color-only communication.

#### Scenario: Keyboard review
- **WHEN** an administrator navigates, opens detail, confirms an action, or closes a dialog using a keyboard
- **THEN** focus remains usable and each interactive control has an accessible name

#### Scenario: Status is presented
- **WHEN** a request status or action result is displayed
- **THEN** the meaning is available as visible text and is not communicated only by color

#### Scenario: Narrow viewport
- **WHEN** the administrative workflow is used on a mobile or tablet viewport
- **THEN** filters, request data, dialogs, and actions remain readable and operable

### Requirement: Affiliate and user requests remain distinct
The ERP SHALL distinguish Affiliate Requests from User Requests while leaving the existing `/admin/user-requests` workflow functionally unchanged.

#### Scenario: Administrator uses ERP navigation
- **WHEN** the administrator reviews available request destinations
- **THEN** navigation identifies `/app/admin/requests` as "Solicitudes de afiliación" and does not present it as the User Requests workflow

#### Scenario: Existing User Requests route is opened
- **WHEN** the administrator opens `/admin/user-requests`
- **THEN** the existing user-account request workflow remains separate and available under its existing authorization behavior
