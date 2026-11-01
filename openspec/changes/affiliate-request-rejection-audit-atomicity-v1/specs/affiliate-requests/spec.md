# Spec Delta

## MODIFIED Requirements

### Requirement: Reject pending request
The system SHALL allow an administrator to reject only a `PENDING` request by invoking `PATCH /affiliate-requests/:id/reject` with a non-empty rejection reason after explicit confirmation. The terminal state, review metadata, and rejection audit event MUST persist atomically.

#### Scenario: Rejection reason is missing
- **WHEN** the administrator attempts to continue without a non-empty rejection reason
- **THEN** the system displays validation feedback and does not send a rejection mutation

#### Scenario: Administrator confirms rejection
- **WHEN** the administrator provides a valid reason and confirms rejection
- **THEN** the system sends one rejection mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Rejection succeeds
- **WHEN** the backend rejects the request
- **THEN** the system refreshes affected request data, presents the `REJECTED` state and rejection reason, and reports success

#### Scenario: Rejection audit persistence fails
- **WHEN** persistence of the rejection audit event fails
- **THEN** the request remains `PENDING` without review metadata or a partial terminal state

#### Scenario: Rejection fails
- **WHEN** rejection returns a conflict or another recoverable error
- **THEN** the system displays the available backend-derived message, releases the busy state, and allows authoritative data to be refreshed
