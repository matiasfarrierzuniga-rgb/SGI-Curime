# Spec Delta

## MODIFIED Requirements

### Requirement: Authorized administrative route
The system SHALL expose the functional "Solicitudes de afiliación" screen at `/app/admin/requests` under the existing `adm.requests.read` frontend capability and SHALL enforce the same persisted capability in the backend for list and detail access. Approval and rejection remain under their explicit transition policy until a distinct approved review capability exists.

#### Scenario: Anonymous visitor opens the route
- **WHEN** an anonymous visitor opens `/app/admin/requests`
- **THEN** the system redirects the visitor to `/login` without rendering privileged request data

#### Scenario: Authenticated user lacks capability
- **WHEN** an authenticated user without `adm.requests.read` opens `/app/admin/requests`
- **THEN** the system redirects the user to `/403`

#### Scenario: Administrator opens the route
- **WHEN** an ERP-admitted administrator or other user with persisted `adm.requests.read` opens `/app/admin/requests`
- **THEN** the system renders the functional "Solicitudes de afiliación" screen and permits its list/detail APIs

#### Scenario: Unknown role opens the route
- **WHEN** an authenticated session has an unknown or unmapped role
- **THEN** the system denies access by default
