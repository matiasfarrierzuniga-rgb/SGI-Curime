## Purpose

Defines SGI Curime's V1 institutional account lifecycle and its consistent persisted-capability authorization contract across user interfaces and backend APIs.

## ADDED Requirements

### Requirement: Public account access follows institutional approval
The system SHALL treat a public account registration as a UserRequest containing identity and contact snapshots and SHALL NOT create an active User directly from the public `/register` flow. Public submission MAY link an existing Person only when it can safely and unambiguously resolve that Person; unresolved valid submissions SHALL remain acceptable pending administrative review. Only an authorized administrative approval SHALL safely resolve or reconcile a canonical Person, create the corresponding Person-linked User, assign an active software Role, and place the account in an inactive state pending activation.

#### Scenario: Person submits a valid public account request
- **WHEN** a person submits valid account-request identity, contact, and reason data through `/register`
- **THEN** the system creates one pending UserRequest with identity/contact snapshots, creates no User or active session, and links a Person only when current safe resolution is unambiguous

#### Scenario: Valid submission cannot yet link a canonical Person
- **WHEN** a public submission is valid but current Person resolution cannot safely and unambiguously link a canonical Person
- **THEN** the system accepts the pending UserRequest with its snapshots and defers Person resolution/reconciliation to administrative review

#### Scenario: Duplicate account or pending request exists
- **WHEN** a public submission uses an email or identity already held by a User or pending UserRequest
- **THEN** the system rejects the submission without creating another request, User, activation token, or session

#### Scenario: Authorized reviewer approves a pending request
- **WHEN** an authenticated actor with the required request-review capability approves a pending UserRequest and selects an active software Role
- **THEN** the system safely resolves or reconciles one canonical Person, atomically marks the request approved, records the reviewer, creates one inactive User linked to that Person, assigns that Role, and creates one activation token for that User

#### Scenario: Review cannot safely resolve a canonical Person
- **WHEN** administrative review cannot safely resolve or reconcile the request to a canonical Person
- **THEN** approval is rejected without creating a User or activation token and the request remains available for institutional resolution

#### Scenario: Reviewer rejects a pending request
- **WHEN** an authenticated actor with the required request-review capability rejects a pending UserRequest with a valid reason
- **THEN** the system records the rejection and reviewer without creating a User or activation token

#### Scenario: Request has already been resolved
- **WHEN** an approval or rejection targets a UserRequest that is no longer pending
- **THEN** the system rejects the transition and preserves the existing request, User, token, and role state

### Requirement: Existing link-based account activation remains authoritative
The system SHALL preserve the existing AccountActivationToken lifecycle, email activation link, `/activate-account` route, password policy, and atomic account activation behavior. Activation tokens SHALL remain high-entropy, stored only as hashes, expiring, and single-use; the system SHALL NOT introduce numeric OTP activation.

#### Scenario: Approved account receives activation link
- **WHEN** administrative approval creates an inactive User and activation token
- **THEN** the system sends the existing email activation link containing the raw token while persisting only its hash and expiration

#### Scenario: Valid token establishes password
- **WHEN** an inactive User submits a valid unexpired unused token and matching policy-compliant passwords
- **THEN** the system atomically consumes the token, stores the password hash, changes the User to ACTIVE, records activation audit evidence, and allows later login

#### Scenario: Invalid or expired token is submitted
- **WHEN** activation receives an unknown token or an expired token
- **THEN** the system rejects activation, leaves account and token state unchanged, and presents an actionable invalid-or-expired result without authenticating the user

#### Scenario: Used token is submitted again
- **WHEN** activation receives a token already consumed by a successful activation
- **THEN** the system rejects reuse, leaves the active account unchanged, and presents an already-used result

#### Scenario: Token belongs to account that cannot be activated
- **WHEN** a valid token refers to a User that is not eligible for inactive-to-active activation
- **THEN** the system rejects activation without changing password, status, token, or session state

### Requirement: Authentication resolves effective persisted permissions
The system SHALL resolve each authenticated User from current persisted account, Role, RolePermission, and Permission data. Effective authorization SHALL use the resulting permission codes and SHALL reject inactive, blocked, locked, expired, or otherwise ineligible accounts according to existing authentication policies.

#### Scenario: Eligible active User logs in
- **WHEN** an active eligible User submits valid credentials
- **THEN** the system creates the existing session, issues access credentials, and returns current software Role identity and persisted permission codes

#### Scenario: Role or permission assignment changes after token issuance
- **WHEN** persisted access assignments change and the User next resolves current authentication or authorization state
- **THEN** the system uses current persisted permissions rather than trusting a client-supplied role or permission list

#### Scenario: Client supplies privileged role or permissions
- **WHEN** a request body, browser storage value, or route state claims permissions not present in persisted RolePermission data
- **THEN** the system ignores those claims and authorizes only from server-resolved persisted permissions

### Requirement: Sensitive access uses one capability contract
Every sensitive capability SHALL have one canonical permission identifier used consistently for frontend navigation visibility, frontend route or action authorization, and backend API authorization. Backend API authorization SHALL remain authoritative, and absence from navigation SHALL NOT be treated as sufficient protection.

#### Scenario: User has required capability
- **WHEN** an authenticated ERP-eligible User has the canonical persisted capability for a sensitive module or action
- **THEN** the relevant navigation or action is visible, its protected frontend route is accessible, and its backend API permits the operation subject to domain validation

#### Scenario: User lacks required capability
- **WHEN** an authenticated User lacks the canonical persisted capability for a sensitive module or action
- **THEN** navigation and actions are hidden or disabled, direct frontend deep links render no protected content and resolve to forbidden behavior, and the backend API returns forbidden

#### Scenario: User manually enters hidden module URL
- **WHEN** an authenticated User manually requests a frontend URL whose required capability is absent
- **THEN** the route denies access before the protected page initiates sensitive data requests or renders sensitive content

#### Scenario: User calls API without using frontend
- **WHEN** an authenticated User directly calls a sensitive API without its required capability
- **THEN** the backend rejects the request regardless of frontend navigation or route state

#### Scenario: Public or authentication-only endpoint is reviewed
- **WHEN** an endpoint is intentionally public or requires authentication without a business capability
- **THEN** its policy is explicit, tested, and not silently converted into capability-protected or default-public behavior

### Requirement: ERP shell does not replace child-route authorization
The system SHALL resolve authenticated state before ERP content renders. The ERP shell SHALL NOT require `erp.dashboard.read` as a universal prerequisite and SHALL NOT grant sensitive module access. Every sensitive child route SHALL require its own canonical capability; `/app/dashboard` SHALL require `erp.dashboard.read`; and bare ERP entry SHALL redirect to a first authorized destination or render forbidden/no-administrative-access behavior when no child route is authorized.

#### Scenario: Finance actor opens ERP finance route without dashboard access
- **WHEN** an authenticated eligible User has the required finance capability but lacks `erp.dashboard.read`
- **THEN** the User can access the matching finance child route and cannot access `/app/dashboard`

#### Scenario: Inventory actor opens ERP inventory route without dashboard access
- **WHEN** an authenticated eligible User has `inv.inventory.read` but lacks `erp.dashboard.read`
- **THEN** the User can access matching inventory routes and cannot access `/app/dashboard`

#### Scenario: Authenticated actor enters bare ERP route
- **WHEN** an authenticated User opens the bare ERP entry route
- **THEN** the system redirects to an authorized child route when one exists or renders forbidden/no-administrative-access behavior without loading sensitive child content when none exists

#### Scenario: Sensitive child route lacks required capability
- **WHEN** an authenticated User requests any sensitive ERP child route without its canonical capability
- **THEN** the route denies before protected content or data loading regardless of whether the ERP shell rendered

### Requirement: Legacy role-name authorization migrates without access expansion
Sensitive backend endpoints currently guarded by hard-coded software role names SHALL prefer migration to existing explicit persisted capabilities. Migration SHALL preserve or narrow the verified V1 access outcome and SHALL NOT grant access merely because an actor has a similarly named institutional governance position. If no existing capability correctly represents an endpoint, migration of that endpoint SHALL stop pending explicit product approval of a documented capability candidate.

#### Scenario: Legacy administrator-only endpoint is migrated
- **WHEN** a sensitive endpoint previously required the `Administrador` software role
- **THEN** it requires an explicit persisted capability assigned through reviewed seed policy, and an authenticated User without that capability receives forbidden

#### Scenario: Inventory role guard is migrated
- **WHEN** inventory APIs move from `Administrador` or `Gestor de Inventario` role-name checks
- **THEN** access is determined by the canonical inventory capability and preserves verified access for Users whose persisted roles carry that capability

#### Scenario: Existing capabilities cannot represent an endpoint
- **WHEN** inventory identifies a sensitive endpoint/action whose current role behavior cannot be represented by an existing canonical capability
- **THEN** the system documents the endpoint/action, existing role behavior, and missing capability candidate and does not migrate or add a permission identifier until explicit product approval is recorded

#### Scenario: Governance title resembles software role
- **WHEN** a Person holds a governance position such as President, Treasurer, Secretary, or Board Member
- **THEN** that position grants no software capability unless a separate User assignment to a software Role provides it

### Requirement: Authorization failures preserve authentication semantics
The system SHALL distinguish unauthenticated access from authenticated-but-unauthorized access across backend and frontend behavior. Protected content SHALL not flash before either decision completes.

#### Scenario: Request has no valid authentication
- **WHEN** a protected frontend route or backend endpoint receives no valid authenticated session
- **THEN** the frontend directs the user to login without rendering protected content and the backend returns `401`

#### Scenario: Authenticated User lacks capability
- **WHEN** a valid authenticated User requests a capability-protected route or endpoint without that capability
- **THEN** the frontend presents forbidden behavior without clearing an otherwise valid session and the backend returns `403`

#### Scenario: Restored session is still being resolved
- **WHEN** the frontend has stored session data but has not completed authoritative current-user resolution
- **THEN** it renders a neutral restoration state and does not render protected module content

### Requirement: Access-sensitive transitions remain auditable
The system SHALL preserve existing audit history and SHALL record security-sensitive account transitions with actor, action, module, entity identity, timestamp, and sanitized context where applicable. This change SHALL NOT require dynamic role or permission mutation events because those administration capabilities remain out of scope.

#### Scenario: UserRequest is approved or rejected
- **WHEN** an authorized reviewer resolves a UserRequest
- **THEN** the system records the reviewer and corresponding request decision, and approval also records User creation without logging activation secrets

#### Scenario: Account is activated
- **WHEN** a User successfully completes activation
- **THEN** the system records account activation without storing raw token or password data in audit details

#### Scenario: User role assignment changes
- **WHEN** an authorized actor changes a User's software Role through an existing supported operation
- **THEN** the system records actor, target User, previous role identity, and new role identity without trusting client-supplied permission claims

### Requirement: Actor-based certification proves all three authorization layers
The V1 access contract SHALL be certified with representative actors against account lifecycle transitions and each sensitive module's navigation, frontend route, and backend API layers. Certification SHALL include allowed and denied outcomes and SHALL identify any intentionally authentication-only or public capability.

#### Scenario: Actor has complete module access
- **WHEN** a representative actor's persisted permissions include a module capability
- **THEN** certification proves expected navigation, deep-link, API, and action outcomes for that capability

#### Scenario: Actor lacks module access
- **WHEN** a representative actor lacks a module capability
- **THEN** certification proves hidden navigation, denied deep link, no protected-content flash, and backend `403`

#### Scenario: Anonymous actor requests protected access
- **WHEN** an anonymous actor requests a protected frontend route and its backend API
- **THEN** certification proves login redirection without protected rendering and backend `401`

### Requirement: Existing persistence and approved authentication mechanisms are preserved
The change SHALL use the existing Person, UserRequest, User, Role, Permission, RolePermission, AccountActivationToken, Session, and AuditLog models without schema redesign or new persistent authorization models. It SHALL preserve existing link activation, password, JWT, refresh-session, lockout, and audit mechanisms except where behavior is explicitly changed by this specification.

#### Scenario: Implementation scope is inspected
- **WHEN** the completed change is reviewed
- **THEN** no Prisma schema change, migration, numeric OTP mechanism, OAuth/OIDC provider, dynamic RBAC administration, or automatic governance-position mapping is present

#### Scenario: Existing activation or session record predates deployment
- **WHEN** a valid activation token or session created before deployment is used after compatible application rollout
- **THEN** it continues to follow the existing token or session contract without data conversion
