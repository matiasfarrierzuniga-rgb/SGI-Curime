# Phase A Backend Baseline Evidence

Date: 2026-10-05  
Scope: Tasks 1.1 and backend portion of 1.4 only. Current behavior recorded; no production behavior changed.

## Preservation Boundary

- No backend production source changed.
- No Prisma schema, migration, seed, registration, guard, or capability identifier changed.
- No OTP, OAuth/OIDC, dynamic RBAC administration, or governance-to-Role mapping added.
- Existing focused tests already cover every 1.4 backend behavior named below. No redundant test added.

## Account And Auth Endpoint Inventory

`PUBLIC` below means no JWT guard. `AUTHENTICATED` means `JwtAuthGuard`. Capability guards resolve `permissionCodes` server-side from `RolePermission -> Permission`; legacy role guards remain recorded as baseline, not migrated.

| Endpoint | Current guard/policy | Actor outcome | Audit event / evidence | Existing test evidence |
| --- | --- | --- | --- | --- |
| `POST /register` | `ThrottlerGuard`; public | Creates direct active User through `RegisterUserUseCase`; legacy public entry path | User creation audit owned by registration use case; no endpoint-specific audit assertion in inspected focused suite | Registration controller/use-case tests not part of 1.4 focus; Phase B change target |
| `POST /admin/register` | `ThrottlerGuard`, `OptionalJwtAuthGuard`; use case decides bootstrap/administrator authorization | Unauthorized -> `401`; forbidden actor -> `403`; allowed actor creates User | User creation audit owned by administrator-registration use case; controller maps auth errors | Registration controller/use-case tests not part of 1.4 focus |
| `POST /user-requests` | `ThrottlerGuard`; public | Creates `PENDING` request; no User; rejects duplicate User or pending request | `USER_REQUEST_CREATED` (`USER_REQUESTS`) | `user-requests.service.spec.ts`: pending creation; user/pending duplicate coverage |
| `GET /user-requests` | `JwtAuthGuard` + `RolesGuard` + `@Roles('Administrador')` | Administrator lists requests; unauthenticated denied by JWT; other roles denied | Read: no audit event | `user-requests.controller.ts`; no controller guard test found in focused suite |
| `GET /user-requests/:id` | `JwtAuthGuard` + `RolesGuard` + `@Roles('Administrador')` | Administrator reads request; missing request -> `404` | Read: no audit event | `user-requests.service.spec.ts`: unknown request `404` |
| `PATCH /user-requests/:id/approve` | `JwtAuthGuard` + `RolesGuard` + `@Roles('Administrador')` | Valid pending request + active selected Role + safe Person creates exactly one `INACTIVE` User and activation token; resolved/invalid conflict -> `409`; missing Role -> `404` | `USER_CREATED` (`USERS`, `roleId`); `USER_REQUEST_APPROVED` (`USER_REQUESTS`, `createdUserId`) | `user-requests.service.spec.ts`: approval, inactive user, SHA-256 hash persistence, delivery, inactive/missing Role rejection |
| `PATCH /user-requests/:id/reject` | `JwtAuthGuard` + `RolesGuard` + `@Roles('Administrador')` | Marks pending request `REJECTED`; resolved request -> `409` | `USER_REQUEST_REJECTED` (`USER_REQUESTS`) | `user-requests.service.spec.ts`: reviewer ID and resolved-request conflict |
| `POST /auth/activate-account` | public | Valid unused, unexpired token for `INACTIVE` User claims token once, hashes password, activates User; invalid/expired/ineligible -> `400`; used/claim race -> `409` | `ACCOUNT_ACTIVATED` (`AUTH`) | `activate-account.use-case.spec.ts`; `prisma-auth.repository.spec.ts`: hash lookup and atomic claim |
| `POST /auth/login`, `POST /login` | public | Active valid account gets access token, refresh token, persisted Session, and resolved `permissionCodes`; invalid credentials/inactive/locked -> `401`; expired subscription -> mapped `403` | `LOGIN_SUCCESS`; failures `LOGIN_FAILED`; threshold `ACCOUNT_LOCKED` | `login.use-case.spec.ts`; `prisma-auth.repository.spec.ts`: atomic Session creation |
| `POST /auth/refresh`, `POST /refresh` | public refresh credential; cookie origin check when cookie supplied | Valid active Session rotates credentials; invalid/expired/revoked credential or inactive User -> `401` | `REFRESH_SUCCESS` / `REFRESH_FAILED` | `refresh-session.use-case.spec.ts` |
| `POST /auth/logout`, `POST /logout` | public refresh credential; cookie origin check when cookie supplied | Revokes matching Session; missing/invalid credential returns idempotent success | `LOGOUT`; session revocation behavior in use case | `logout.use-case.spec.ts` |
| `POST /auth/forgot-password` | public | Requests password-reset delivery; response follows reset use case | Password-reset audit owned by reset flow | `request-password-reset.use-case.spec.ts` exists; not rerun in focused set |
| `POST /auth/reset-password` | public | Valid reset token updates password and revokes existing sessions; invalid/reused token mapped by auth error boundary | `PASSWORD_RESET`, `SESSION_REVOKED` | `reset-password.use-case.spec.ts` exists; controller mapping in `auth.controller.spec.ts` |
| `PATCH /auth/change-password` | `JwtAuthGuard` | Authenticated User changes password; use case validates current/new passwords and revokes sessions | `PASSWORD_CHANGED`, `SESSION_REVOKED` | `change-password.use-case.spec.ts` exists |
| `GET /auth/me` | `JwtAuthGuard` | Returns server-resolved authenticated user, including persisted `permissionCodes` | Read: no audit event | `auth.controller.spec.ts`; `jwt.strategy.spec.ts` |
| `GET /auth/admin-test` | `JwtAuthGuard` + `RolesGuard` + `@Roles('Administrador')` | Administrator receives confirmation; unauthenticated/other role denied | Read: no audit event | Controller source inventory only |
| `GET /users` | `JwtAuthGuard` + `RolesGuard` + `CapabilityGuard`; `usr.users.read` | Server-resolved capability required; actor-aware action flags returned | Read: no audit event | `users.controller.spec.ts`; `capability.guard.spec.ts` |
| `GET /users/me` | controller class guards; `@Roles()` metadata | Authenticated User gets profile/affiliation and server-resolved `permissionCodes` | Read: no audit event | `users.controller.spec.ts` |
| `GET /users/:personId` | class guards; `usr.users.read` | Capable actor reads Person/account projection | Read: no audit event | `users.controller.spec.ts` |
| `PATCH /users/:id/is-active`, `/activate`, `/deactivate` | class guards; `usr.users.lifecycle.manage` | Capable actor changes account lifecycle subject to use-case safeguards | `USER_ACTIVATED` / `USER_DEACTIVATED` | Controller source inventory; use-case audit tests outside requested baseline slice |
| `PATCH /users/:id` and `/subscription-expiration` | class guards; `usr.users.update` | Capable actor updates account/subscription policy | `USER_UPDATED` | Controller source inventory |
| `PATCH /users/:id/role` | class guards; `usr.users.role.change` | Capable actor changes Role through server validation | `USER_ROLE_CHANGED` | Controller source inventory |
| `PATCH /users/:id/unlock` | class guards; `usr.users.unlock` | Capable actor clears account lock | `ACCOUNT_UNLOCKED` | Controller source inventory |
| `GET /roles` | `JwtAuthGuard` + `RolesGuard` + `CapabilityGuard`; `usr.roles.read` | Capable actor receives active role id/name catalog | Read: no audit event | Composition test: `users-roles-bootstrap.spec.ts`; controller source inventory |

## Task 1.2 Canonical Existing Capability Inventory

Source of truth: `backend/src/auth/presentation/capabilities/capability-policy.ts`. `CAPABILITIES` is existing catalog only. A code is recorded as **mapped** only when controller metadata uses that code. `Candidate / no mapping` records a current endpoint or module policy with no evidenced exact existing capability; it does not create or approve an identifier.

| Module | Existing canonical capability codes | Repository-evidenced mapping | Candidate / no mapping; uncertainty |
| --- | --- | --- | --- |
| Dashboard | `erp.dashboard.read` | No backend dashboard controller uses this code. | `GET /admin-reports/dashboard` is legacy `Administrador` only; do not infer dashboard capability equivalence. |
| Users | `usr.users.read`, `usr.users.update`, `usr.users.role.change`, `usr.users.lifecycle.manage`, `usr.users.unlock`, `usr.profile.read` | `/users` read, update, role, lifecycle, unlock endpoints use first five respectively. | `/users/me` has no explicit capability metadata; authentication-only/profile classification remains review input. `usr.profile.read` has no observed backend controller use in inspected source. |
| Roles | `usr.roles.read` | `GET /roles` uses `usr.roles.read`. | None observed. |
| Affiliates | `adm.affiliates.read` | Existing catalog contains read code. | `/affiliates` list/detail/update/lifecycle are legacy `Administrador` only. Read may be candidate for list/detail; update/lifecycle have no exact existing code evidenced. |
| Affiliate Requests | `adm.requests.read` | Existing catalog contains generic requests-read code. | `/affiliate-requests` review endpoints remain legacy `Administrador` only. Code semantics may be shared with User Requests; list/detail candidate only, approval/rejection no exact existing capability evidenced. |
| User Requests | `adm.requests.read` | Existing catalog contains generic requests-read code. | `/user-requests` list/detail/approval/rejection remain legacy `Administrador` only. No endpoint is mapped. Shared generic code must not be assigned without product review; approval/rejection have no exact existing code evidenced. |
| Governance | `adm.institutional-board.read`, `adm.institutional-board.manage` | `/institutional-board` term, candidate, appointment reads use read; mutations use manage. | None observed. No mapping derives from `BoardPosition` or governance labels. |
| Assemblies | `adm.assemblies.read`, `adm.assemblies.manage` | `/assemblies` administrative reads use read; mutations use manage. | `/assemblies/mine` and `/assemblies/:id` use authentication plus internal-access/domain checks, not explicit capability metadata. |
| Absence Justifications | `adm.justifications.read`, `adm.justifications.approve`, `adm.justifications.reject` | List/detail use read; decisions use approve/reject; evidence endpoints apply owner-or-persisted-read policy. | `POST /assemblies/:assemblyId/justifications` uses `adm.assemblies.manage`, not a justification-create code. Self-service registration/list endpoints are authentication/ownership paths. |
| Reservations | `res.reservations.read`, `res.reservations.approve`, `res.reservations.reject`, `res.reservations.cancel` | `/reservations` list/detail and transitions use matching codes. | Availability, create reservation, and active reservable-resource list are authenticated without capability metadata; preserve ownership/domain review classification. |
| Events | `pub.events.manage`, `pub.events.publish` | Administrative event list/create/update/review/draft use manage; publish/archive use publish. | `/public/events` endpoints are public. No separate existing events-read code. |
| Finance | `fin.charges.read`, `fin.payments.record`, `fin.movements.read`, `fin.movements.create`, `fin.dinadeco.read` | Financial charges, payment recording, movements, and DINAECO annual report controllers use matching codes. | None observed. |
| Donations | `don.donations.read`, `don.donations.create`, `don.donations.update`, `don.donations.cancel`, `don.donations.delete` | `/donations` controller uses matching operation codes. | None observed. |
| Inventory | `inv.inventory.read` | Existing catalog contains one inventory-read code. | Inventory categories, items, movements, loans, alerts, and reports need endpoint-by-endpoint evidence. No exact existing mutation/report capability is evidenced; do not map legacy role-protected operations from this read code. |
| Reports | `aud.logs.read`, `fin.dinadeco.read` | Financial DINAECO annual report uses `fin.dinadeco.read`. | `/audit-logs` and `/admin-reports/*` are legacy `Administrador` only. `aud.logs.read` is cataloged but not controller-mapped; no existing capability maps generic administrative report endpoints. |
| Institutional Profile | `adm.institutional-profile.read`, `adm.institutional-profile.update` | `/institutional-profile` GET/PATCH use matching codes. | None observed. |
| Entrepreneurship | `ent.ventures.read`, `ent.ventures.create`, `ent.ventures.update` | `/ventures` controller uses matching operation codes. | None observed. |
| Volunteering | `vol.opportunities.read`, `vol.opportunities.create`, `vol.opportunities.update` | `/volunteering/opportunities` controller uses matching operation codes. | Inventory covers opportunity surface only. Any application, attendance, or participation endpoint absent from inspected controller has no mapping recorded. |

### Existing Catalog Not Yet Controller-Mapped In This Inventory

- `erp.dashboard.read`
- `usr.profile.read`
- `adm.affiliates.read`
- `adm.requests.read`
- `aud.logs.read`
- `inv.inventory.read`

These are existing identifiers, not approval to attach them. Their endpoint equivalence remains Phase C product/evidence work.

## Task 1.4 Regression Baseline

| Required behavior | Existing proof |
| --- | --- |
| UserRequest approval | `user-requests.service.spec.ts`: request claim, approval status, reviewer evidence, no approval without safe Person |
| Inactive User creation | Same approval test asserts `passwordHash: null`, `status: 'INACTIVE'`, validated `roleId`, linked Person |
| Active Role validation | Same suite rejects missing Role (`404`) and inactive Role (`409`) before creation |
| Activation token hashing and delivery | Approval test persists SHA-256 `tokenHash`, proves raw token differs, then sends raw token only to delivery service; delivery spec proves notification payload and sanitized failure log |
| Single-use activation | `activate-account.use-case.spec.ts` rejects used token and failed atomic claim; `prisma-auth.repository.spec.ts` asserts conditional `usedAt: null`, unexpired claim |
| Login and Session creation | `login.use-case.spec.ts` asserts valid active account signs token, persists refresh hash, audits success; repository spec asserts Session creation and login update occur in one transaction |
| Persisted permission resolution | Repository spec loads `RolePermission.permission.code`; JWT strategy re-resolves account by JWT subject; capability guard grants from `permissionCodes`, including unrecognized role with persisted grant, and denies absent grants |

## Focused Verification

Human-supplied backend validation (authoritative; not executed by Forge):

```text
docker compose exec backend npm test -- --runInBand
```

Result: `PASS`

- Suites: 113 passed, 3 skipped of 116.
- Tests: 1035 passed, 17 skipped of 1052.
- Duration: 47.679s.
- `AuthAudit` `ERROR` logs emitted during `LOGIN_SUCCESS`, `REFRESH_SUCCESS`, and `LOGOUT` are expected resilience-coverage test-log noise, not test failures. No contrary evidence was investigated or found; no investigation required for this record.

## Decision Candidates / Phase B-C Inputs

1. `POST /register` currently creates an active User. This contradicts target lifecycle but remains intentionally unchanged in Phase A.
2. UserRequest list/detail/approve/reject currently use legacy `Administrador` role guards. Capability migration is deferred to Phase C; no capability inferred here.
3. `GET /auth/admin-test` remains legacy role-protected test endpoint. No migration decision made.
