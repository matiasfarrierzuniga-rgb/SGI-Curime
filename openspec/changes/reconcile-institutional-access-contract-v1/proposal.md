## Why

SGI Curime currently has the required persistence and activation foundations, but its public `/register` path bypasses institutional review and its authorization rules mix persisted capabilities with hard-coded software role names. V1 needs one explicit account lifecycle and one capability contract across navigation, frontend routes, and backend APIs before access can be certified by actor.

## What Changes

- Make the canonical public account lifecycle `public identity/contact snapshots -> UserRequest -> administrative review and safe Person resolution/reconciliation -> approved request -> inactive Person-linked User -> existing email activation link -> password establishment -> ACTIVE User -> login -> Role -> persisted Permissions`. A submission MAY link an existing Person only when resolution is safe and unambiguous; Person linkage is not a public-submission prerequisite.
- **BREAKING** for the current public registration behavior: `/register` no longer creates an active User directly; it submits a UserRequest for administrative review and activation through the existing approved flow.
- Preserve `AccountActivationToken`, its hashed single-use token semantics, expiration handling, email activation link, `/activate-account`, password establishment, and session behavior. Numeric OTP is not introduced.
- Preserve the current relational model. No Prisma schema redesign, new persistent authorization model, or migration is required by this change.
- Replace legacy backend authorization based on hard-coded software role names with explicit existing persisted capability requirements for sensitive APIs, while preserving authentication-only and public endpoints where domain behavior requires them. If an endpoint cannot be represented correctly by an existing capability, stop that endpoint migration and request explicit product approval before adding a capability.
- Align ERP navigation visibility, frontend deep-link route protection, action visibility, and backend API enforcement with the same canonical capability identifiers and default-deny behavior.
- Keep institutional governance positions separate from software Roles, Permissions, and User assignments. No BoardPosition-to-Role inference or automatic mapping is allowed.
- Preserve existing seeded software roles and capability assignments unless a separately reviewed compatibility correction is required to support an already-implemented flow. Dynamic Role, Permission, and RolePermission administration remains out of scope.
- Deliver the change in phases: account lifecycle closure; backend capability migration; frontend navigation alignment; frontend route/action alignment; sensitive-action audit verification; actor-based certification.
- Add focused unit, integration, frontend route/navigation, and non-mutating or disposable E2E coverage for lifecycle transitions, `401` versus `403`, denied deep links, denied APIs, and actor/module access.

### Scope

- Frontend public registration, activation feedback, auth state, ERP navigation, route guards, and capability-aware actions.
- Backend UserRequest review, registration entry points, authentication context, capability policy/guards, legacy role-guarded controllers, and audit integration.
- Tests and contract fixtures needed to prove the same capability decision at all three authorization layers.

### Non-Goals

- OAuth, OpenID Connect, Google login, Microsoft login, or any new identity provider.
- Numeric email OTP or replacement of activation links/tokens.
- Prisma schema redesign, new persistent authorization models, migrations, or database backfill.
- Dynamic Role CRUD, Permission CRUD, or RolePermission administration.
- Automatic mapping between President, Treasurer, Secretary, Board Member, other governance positions, and software Roles.
- Unrelated frontend visual refinement or module redesign.

### Security And Compatibility

- Backend API authorization remains authoritative; hidden navigation never constitutes security enforcement.
- Unauthenticated requests continue to receive `401`; authenticated users lacking a required capability receive `403`; frontend handling preserves this distinction without rendering protected content first.
- Persisted `permissionCodes` remain the runtime source for capability decisions. Role names remain identity/catalog labels and seed inputs, not substitutes for permission checks on migrated APIs.
- ERP shell authentication is separate from sensitive route authorization: every sensitive child route has its own capability; `/app/dashboard` requires `erp.dashboard.read`; bare ERP entry redirects to an authorized destination or renders no-administrative-access behavior.
- Existing activation links, token records, sessions, UserRequest records, Users, Roles, Permissions, RolePermission assignments, and audit history remain valid.
- Existing sensitive routes and endpoints retain their business behavior and URLs unless `/register` behavior explicitly changes as stated above.

### Risks And Rollback

- Capability drift could deny legitimate users or expose legacy endpoints. Mitigation: inventory every affected endpoint, map existing role outcomes to persisted capabilities, and certify representative actors before removing role guards.
- Changing `/register` can affect direct-registration tests and clients. Mitigation: preserve request fields where valid, document the response transition, and validate the full approval/activation path before cutover.
- Missing frontend route metadata can create a navigation/URL mismatch. Mitigation: use one reviewed capability inventory and test menu plus deep-link behavior together.
- Rollback is application-only because no schema or data migration is planned. Revert registration routing and guard composition as one coherent release; do not alter persisted activation, role, permission, session, or audit records.

## Capabilities

### New Capabilities

- `security/institutional-access-contract`: Defines the canonical institutional account lifecycle and the shared persisted-capability contract across navigation, frontend routes/actions, backend APIs, audit evidence, and actor-based certification.

### Modified Capabilities

None.

## Impact

- Frontend: `/register`, UserRequest submission integration, `/activate-account` error states, auth/session consumers, `erpNavigation`, bare ERP entry behavior, capability-specific `AppRoutes` guards, capability-aware actions, and corresponding tests.
- Backend: registration and UserRequest controllers/services, auth context, capability policy/guards, controllers still using hard-coded role-name authorization, audit verification, and authorization tests.
- APIs: public registration semantics change from direct User creation to UserRequest creation; existing activation, login, refresh, logout, current-user, and business endpoint URLs remain stable.
- Persistence: existing `Person`, `UserRequest`, `User`, `Role`, `Permission`, `RolePermission`, `AccountActivationToken`, `Session`, and `AuditLog` models are preserved without schema or migration changes.
- Dependencies: no new production dependency expected.
- Implementation acceptance: account requests require approval before activation; effective permissions come from persisted RolePermission data; every sensitive capability has aligned navigation, route, and API outcomes; role/governance semantics remain distinct; focused tests prove allowed and denied behavior.
