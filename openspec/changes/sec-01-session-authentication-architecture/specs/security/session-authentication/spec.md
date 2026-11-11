# Spec Delta

## Purpose

Define a secure, testable session lifecycle for browser and API consumers while preserving backend authority, controlled compatibility and reliable credential revocation.

## ADDED Requirements

### Requirement: Browser credential boundary
The session contract SHALL keep refresh credentials exclusively in an `HttpOnly` cookie and SHALL keep browser access credentials only in runtime memory. Current aliases SHALL NOT return refresh credentials in response bodies or accept them in request bodies. Web Storage SHALL NOT contain access or refresh credentials.

#### Scenario: Successful browser login
- **WHEN** an eligible user completes browser login
- **THEN** the system returns the access credential and authoritative user context without a refresh credential in the response body
- **AND** the system issues the refresh credential as an `HttpOnly` cookie

#### Scenario: Browser storage inspection
- **WHEN** a browser session is active
- **THEN** neither local storage nor session storage contains an access or refresh credential

### Requirement: Cookie security policy
Production SHALL use a `__Host-` refresh cookie with `HttpOnly`, `Secure`, `Path=/`, no `Domain` and approved `SameSite`. The access credential SHALL expire after the approved short lifetime, initially proposed as 15 minutes. A refresh session SHALL have a 30-day absolute maximum, never extended by rotation, plus an approved inactivity expiry that is no longer than that maximum.

#### Scenario: Production cookie issuance
- **WHEN** login or renewal succeeds in production
- **THEN** the refresh cookie is issued with `HttpOnly` and `Secure`
- **AND** its `SameSite`, path and lifetime match the approved deployment policy

#### Scenario: Invalid cookie configuration
- **WHEN** configured cookie attributes are incompatible with the deployment security policy
- **THEN** the application fails closed rather than issuing a weaker cookie

### Requirement: Cookie-request forgery protection
Every browser request that creates, rotates or clears a refresh cookie, including login, SHALL be accepted only from the configured trusted frontend origin. CORS SHALL allow credentials only for explicit trusted origins and SHALL NOT be treated as CSRF protection.

#### Scenario: Trusted browser login
- **WHEN** a login request will create a refresh cookie and supplies a verifiable trusted origin
- **THEN** the server may authenticate the credentials and issue the cookie

#### Scenario: Trusted browser renewal
- **WHEN** a renewal request carries the refresh cookie and a verifiable trusted origin
- **THEN** the server evaluates the request and may rotate the session

#### Scenario: Missing or untrusted browser origin
- **WHEN** a browser request attempts to create, rotate or clear a refresh cookie without a verifiable trusted origin
- **THEN** the server rejects it without rotating or revoking another session

### Requirement: Reload session recovery
The browser SHALL recover a session after reload by attempting cookie-backed renewal and then obtaining authoritative current-user data. It SHALL NOT infer authentication from stale user data or persist an access credential for recovery.

#### Scenario: Reload with active refresh session
- **WHEN** the application reloads with a valid refresh cookie
- **THEN** one coordinated renewal obtains a new in-memory access credential
- **AND** authoritative current-user data establishes the authenticated state

#### Scenario: Reload without active refresh session
- **WHEN** renewal fails because no active refresh session exists
- **THEN** the application reaches an anonymous state and clears protected client caches without a refresh loop

### Requirement: Coordinated renewal
The browser SHALL coalesce renewal within each context, use cross-context exclusion when supported, and provide a bounded safe fallback when coordination APIs are unavailable. Coordination messages SHALL NOT contain credentials or user data. Each failed protected request SHALL be retried at most once.

#### Scenario: Concurrent unauthorized responses
- **WHEN** multiple protected requests fail because one access credential expired
- **THEN** they share one renewal result for that browsing context
- **AND** each original request is retried no more than once

#### Scenario: Renewal endpoint rejects a request
- **WHEN** renewal itself is unauthorized or forbidden
- **THEN** the client does not recursively attempt renewal
- **AND** transitions to anonymous state when the failure proves the session invalid

#### Scenario: Cross-context coordination API unavailable
- **WHEN** Web Locks or BroadcastChannel is unavailable
- **THEN** each context retains single-flight and bounded retry behavior
- **AND** a second failed renewal transitions only that context to anonymous without exposing credentials

### Requirement: Refresh rotation and invalid-credential rejection
The server SHALL rotate refresh credentials atomically, store only non-reversible representations, preserve absolute session expiry, and uniformly reject expired, revoked, unknown or already-rotated credentials. Without verifiable token history, it SHALL NOT claim reuse-family detection.

#### Scenario: Successful rotation
- **WHEN** a valid active refresh credential is presented once
- **THEN** the previous credential becomes unusable
- **AND** the replacement credential cannot outlive the session's absolute expiry

#### Scenario: Invalid or already-rotated refresh credential
- **WHEN** an unknown or already-rotated refresh credential is presented
- **THEN** the server rejects it without issuing credentials
- **AND** records a generic refresh failure without logging or classifying the credential value as verified replay

### Requirement: Authoritative access validation
Protected operations SHALL validate access-token expiry, account activity and current session generation on the backend. Current user and capability data SHALL come from persisted backend state rather than browser claims.

#### Scenario: Stale access generation
- **WHEN** an access credential belongs to an invalidated session generation
- **THEN** the protected operation is rejected as unauthenticated

#### Scenario: Current user retrieval
- **WHEN** a valid authenticated client requests its current user
- **THEN** the response reflects current persisted account and capability state

### Requirement: Session revocation lifecycle
Individual logout SHALL revoke the presented session and clear its cookie. Global logout, password change/reset and account deactivation SHALL atomically increment session generation and revoke all active refresh sessions. Security-state persistence failure SHALL roll back; later audit failure SHALL NOT undo committed revocation.

#### Scenario: Logout succeeds or session is already absent
- **WHEN** a client requests logout from the trusted browser origin
- **THEN** the matching refresh session is revoked when present
- **AND** the refresh cookie is cleared
- **AND** local credentials and protected caches are cleared even if the server session was already absent

#### Scenario: Password change or reset
- **WHEN** a password is changed or reset successfully
- **THEN** all refresh sessions for that account are revoked
- **AND** previously issued access credentials cease authorizing protected operations
- **AND** the initiating browser returns to anonymous state and requires login

#### Scenario: Account deactivation
- **WHEN** an account is deactivated
- **THEN** all refresh sessions are revoked
- **AND** existing access credentials are rejected on subsequent protected requests

#### Scenario: Global logout
- **WHEN** an authenticated user completes the approved global-logout operation
- **THEN** every refresh session for that account is revoked
- **AND** previously issued access credentials fail the generation check

### Requirement: Error and cache semantics
Authentication failures and authorization failures SHALL remain distinct. An invalid session SHALL clear browser authentication state and protected caches; a permission denial alone SHALL NOT erase an otherwise valid session.

#### Scenario: Protected request remains unauthorized after renewal
- **WHEN** renewal fails or the retried protected request remains unauthenticated
- **THEN** browser authentication state and protected caches are cleared

#### Scenario: Permission denied
- **WHEN** an authenticated operation is forbidden because capability or resource scope is absent
- **THEN** the client preserves the valid session and presents an authorization failure

### Requirement: Alias compatibility without body refresh credentials
Current login, refresh, logout and current-user aliases SHALL remain available during migration, but all login, refresh and logout aliases SHALL use the same cookie-only refresh contract. No browser-selectable route, header, media type or user-agent value SHALL enable refresh credentials in message bodies.

#### Scenario: Migrated browser consumer
- **WHEN** the migrated browser uses existing authentication route aliases
- **THEN** it completes login, renewal and logout using the cookie-only refresh contract

#### Scenario: Body-token client uses a current alias
- **WHEN** a client sends a refresh credential in a refresh or logout request body
- **THEN** the server rejects the body contract without exposing a replacement credential

#### Scenario: Unknown external consumer
- **WHEN** no verified confidential-client contract exists
- **THEN** the system does not preserve browser-accessible body refresh transport for hypothetical compatibility

### Requirement: Canonical password-change contract
Password change SHALL accept `currentPassword`, `newPassword` and `newPasswordConfirmation` as its canonical fields. Alternative new-password field aliases SHALL NOT be accepted unless a separately approved compatibility contract requires them.

#### Scenario: Canonical password change
- **WHEN** an authenticated user submits matching canonical fields and the current password is valid
- **THEN** the password and account-wide session invalidation are committed atomically

#### Scenario: Ambiguous legacy fields
- **WHEN** a client submits `password` or `passwordConfirmation` instead of the canonical new-password fields
- **THEN** validation rejects the request without changing credentials or sessions

### Requirement: Concurrent session policy
The system SHALL support independently revocable device sessions. Individual logout SHALL affect one session; approved account-wide security events SHALL affect all sessions. Any active-session cap SHALL require an approved product value and deterministic handling of the displaced session.

#### Scenario: Login from another device
- **WHEN** an eligible user logs in from another device below any approved cap
- **THEN** the server creates an independently revocable session without silently revoking the first device

#### Scenario: Session cap is not approved
- **WHEN** no authoritative maximum session count exists
- **THEN** implementation does not invent a numeric cap or claim session-limit enforcement

### Requirement: Authentication anti-abuse and observability
Login, renewal and logout SHALL have approved abuse controls and non-sensitive operational evidence. Metrics and audit events SHALL NOT include passwords, access tokens, refresh tokens or cookie values. Numeric rate limits SHALL be enforced only after approval and safe lockout testing.

#### Scenario: Repeated authentication failures
- **WHEN** login or renewal exceeds an approved abuse threshold
- **THEN** the server applies the approved throttle or lockout response without exposing account existence or credential material

#### Scenario: Security telemetry
- **WHEN** login, renewal, origin validation, rotation conflict, logout or global revocation succeeds or fails
- **THEN** operational evidence records the outcome and safe context without credentials

### Requirement: Safe rollback
Rollback SHALL preserve cookie-only refresh transport, rotation, revocation, generation validation, origin checks and audit redaction. If no safe prior build exists, operators SHALL stop rollout and forward-fix rather than restore browser-visible refresh credentials.

#### Scenario: Migration rollback is activated
- **WHEN** an approved rollback signal crosses its threshold
- **THEN** operators deploy only reviewed cookie-compatible frontend and backend builds
- **AND** refresh credentials remain absent from message bodies

### Requirement: Security certification gate
The target session contract SHALL NOT be certified until positive, negative, concurrency, rotated/unknown credential, expiry, revocation, CSRF, CORS, cookie-policy, compatibility and rollback cases execute in an identified safe environment.

#### Scenario: Planning or static review only
- **WHEN** implementation has not completed the authorized security verification matrix
- **THEN** the session architecture remains `PROPOSED` or `NOT_VERIFIED`

#### Scenario: Certification evidence exists
- **WHEN** every required security and compatibility case passes with traceable evidence
- **THEN** the approved implementation may be reported as verified for that environment and scope

### Requirement: Rollout observation and recovery distinction
The rollout observation window SHALL be recorded separately from recovery objectives. Observation measures stability and security indicators after deployment; recovery objectives define target recovery time and any maximum rollback duration. Neither value SHALL be treated as evidence of the other.

#### Scenario: Operational approval
- **WHEN** rollout and rollback criteria are approved
- **THEN** the observation duration, recovery target and maximum rollback duration are recorded as separate values
