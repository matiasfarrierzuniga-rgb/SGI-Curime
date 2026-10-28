# Spec Delta

## Purpose

Define la cuenta comunitaria básica, verificable por correo y separada de identidad legal, afiliación y autorización institucional.

## ADDED Requirements

### Requirement: Community account registration
The system SHALL allow an anonymous visitor to submit name, email, password, password confirmation, and privacy acknowledgement to create or continue a pending community-account verification without requiring legal identification or administrative approval.

The public HTTP contracts SHALL be `POST /community-accounts/register`, `POST /community-accounts/verify-email`, and `POST /community-accounts/resend-verification`; they SHALL remain separate from legacy `POST /register`.

#### Scenario: New eligible visitor registers
- **WHEN** valid minimum registration data is submitted for an unused email
- **THEN** the system creates a non-authenticable community account pending email verification and begins delivery of a verification link

#### Scenario: Validation fails
- **WHEN** required fields, email format, password confirmation, or privacy acknowledgement are invalid
- **THEN** the system rejects the submission with field-level validation information and creates no account or session

### Requirement: Neutral public registration responses
The system SHALL return a neutral public acknowledgement for accepted registration or resend attempts without revealing whether an email already belongs to an account.

#### Scenario: Email belongs to an existing account
- **WHEN** a visitor submits registration or resend data for an existing email
- **THEN** the system returns the same neutral acknowledgement shape used for an eligible pending account and does not disclose account status

### Requirement: Email verification lifecycle
The system SHALL activate a pending community account only after a valid, unexpired, unused verification token is consumed atomically, and SHALL not create a session as part of verification.

#### Scenario: Valid verification link
- **WHEN** a pending community account submits its valid verification token
- **THEN** the system consumes the token once, activates the account, records the verification event, and directs the visitor to sign in

#### Scenario: Invalid token
- **WHEN** a token is invalid, expired, previously used, or superseded
- **THEN** the system does not activate an account or create a session and provides a safe recovery path

#### Scenario: Blocked account token
- **WHEN** a verification token belongs to an account blocked by an administrator
- **THEN** the system does not reactivate the account

### Requirement: Controlled verification resend
The system SHALL allow a pending community account to request a replacement verification link subject to anti-abuse limits, and SHALL invalidate any prior unconsumed verification link when a replacement is issued.

#### Scenario: Allowed resend
- **WHEN** a pending community account requests resend within configured limits
- **THEN** the system issues one replacement link, invalidates the prior link, and returns a neutral acknowledgement

#### Scenario: Rate limit exceeded
- **WHEN** registration or resend exceeds a configured public-request limit
- **THEN** the system refuses additional delivery without exposing account existence or tokens

### Requirement: Minimum community authorization
The system SHALL assign every verified community account a persistent community role with no ERP or administrative capabilities and SHALL provide only its authenticated community space.

#### Scenario: Verified community sign-in
- **WHEN** a verified community account signs in with valid credentials
- **THEN** the system establishes a normal session and routes the account to its community space

#### Scenario: Community account opens ERP route
- **WHEN** a community account directly requests an ERP or administrative route
- **THEN** the system denies access without rendering protected ERP data

### Requirement: Identity and institutional separation
The system MUST NOT create, link, or modify a Person, Affiliate, VentureAssociation, institutional position, or privileged permission solely because a community account is registered or verified.

#### Scenario: Community registration completes
- **WHEN** a visitor registers and verifies a community account
- **THEN** the resulting account remains unlinked from existing identity and institutional records unless a separate authorized process acts later

### Requirement: Legacy account workflow compatibility
The system SHALL preserve historical UserRequest review, administrative account activation, existing accounts, valid legacy tokens, sessions, roles, and permissions while community-account behavior is introduced.

#### Scenario: Administrator reviews historical request
- **WHEN** an authorized administrator reviews a pre-existing or newly submitted historical UserRequest
- **THEN** the existing review and legacy activation workflow remains available and unchanged by community self-service

### Requirement: V2 traceability status
The change SHALL record CU-20, CU-21, and CU-22 as proposed V2 traceability references and SHALL mark their source requirements NOT_VERIFIED until the immutable local V2 catalog is supplied and validated.

#### Scenario: Planning review
- **WHEN** the OpenSpec artifacts are reviewed before APPLY
- **THEN** they distinguish V1 code evidence from unverified V2 use-case references
