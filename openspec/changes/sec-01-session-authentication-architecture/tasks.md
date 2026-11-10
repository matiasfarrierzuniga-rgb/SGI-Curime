# Tasks

## 1. Architecture gate and contract evidence

- [ ] 1.1 **SEC-01-11 — Approve joint frontend/backend ADR.** Obtain human approval for D1-D10 in `design.md`, including removal of every body-refresh contract, 15-minute access TTL, 30-day absolute and inactivity refresh expiry, topology, cross-tab fallback, global logout, canonical password fields, session-cap disposition, anti-abuse thresholds, separate observation/recovery objectives and rollback ownership; verify no executable change begins while an APPLY-blocking decision remains.
- [ ] 1.2 **SEC-01-01 — Characterize current contract.** Reconfirm login, refresh, logout, reload, expiry, `/users/me`, password change/reset and account-deactivation behavior against current source and focused tests; verify an evidence matrix distinguishes `IMPLEMENTED`, `PARTIAL` and `NOT_VERIFIED` without exposing credentials.
- [ ] 1.3 **SEC-01-02 — Confirm credential-consumer inventory.** Reconcile the `design.md` matrix with every browser, script, test and approved external consumer; verify unknown external clients remain `NOT_VERIFIED`, no confidential legacy client is invented, and each observed body-token test receives an intentional migration disposition.

## 2. Backend session boundary

- [ ] 2.1 **SEC-01-03 — Remove hybrid refresh exposure.** Remove refresh credentials from request and response bodies for every login/refresh/logout alias, remove body DTO acceptance and preserve cookie behavior without a client-selectable legacy mode; verify controller/HTTP tests prove aliases never emit refresh credentials and reject body-token refresh/logout.
- [ ] 2.2 **SEC-01-05 — Enforce cookie, CSRF, CORS, TTL and anti-abuse policy.** Implement approved production `__Host-` cookie attributes, access/absolute-refresh TTLs, exact credentialed CORS and trusted-origin validation for login/refresh/logout; add approved throttling and redacted metrics; verify configuration, origin, topology and abuse-control tests fail closed.

## 3. Frontend runtime session

- [ ] 3.1 **SEC-01-04 — Move browser credentials to approved storage.** Make auth runtime the sole access-token owner, remove access/user session dependence on Web Storage and safely purge the obsolete session key; verify frontend unit tests show no access or refresh credential in `localStorage` or `sessionStorage` after login, refresh, reload or logout.
  - [x] G3.1: `AuthProvider` owns in-memory access credential, user, session epoch and anonymous transition; public `useAuth()` no longer exposes the credential.
  - [x] G3.1: remove credential/identity persistence and purge only legacy `sgi-curime-session` keys from both Web Storage areas.
  - [x] G3.1: HTTP transport consumes registered auth callbacks without directly persisting credentials, clearing React state or mutating query caches.
  - [x] G3.2: cookie-only bootstrap performs refresh then `/users/me`, preserves token only in provider memory, and resolves invalid cookies to anonymous or transient failures to `refresh-failed` without automatic loops.
  - [x] G3.2: shared coordinator serializes cookie operations, uses bounded Web Locks when available, and sends credential-free BroadcastChannel coordination events.
  - [ ] G3.2 browser multi-tab certification and supported-browser baseline remain `NOT_VERIFIED`; unsupported APIs retain only safe single-context behavior.
- [ ] 3.2 **SEC-01-06 — Implement renewal and invalid-credential contract.** Preserve atomic one-time rotation and absolute expiry; recover through cookie refresh then `/users/me`; implement per-context single-flight, Web Locks, credential-free BroadcastChannel events and bounded fallbacks; verify concurrent tabs, stale cookies/events, API absence, timeout, expiry, generic refresh-failure audit and no false replay-family claim.
- [ ] 3.3 **SEC-01-07 — Complete transactional revocation and cleanup.** Implement individual logout plus approved global logout; atomically increment generation and revoke sessions for password change/reset and deactivation; end the initiating session; preserve `401`/`403` semantics and cache cleanup; verify persistence rollback, best-effort audit failure and that already-issued bearer tokens fail generation checks immediately, without changing RBAC grants.
  - [x] Gate 2 backend: issue mandatory JWT `sid`, fail closed on inactive/foreign/expired persisted sessions, and revoke individual logout by stable `Session.id`.
  - [x] Gate 2 backend: add authenticated `POST /auth/logout-all`; atomically increment generation and revoke active sessions for global logout, password change and reset.
  - [x] Gate 2 focused unit and HTTP-contract coverage: individual/global logout, password change/reset, account deactivation, missing `sid`, session ownership and refresh/logout race.
  - [ ] Gate 3 frontend memory/cache cleanup and runtime coordination remain pending.
  - [ ] PostgreSQL transaction/concurrency integration and production/runtime certification remain pending.

## 4. Compatibility, transition and rollback

- [ ] 4.1 **SEC-01-08 — Certify aliases and canonical password contract.** Validate every preserved auth/current-user alias, no-body refresh shape, `/users/me` authority and `currentPassword/newPassword/newPasswordConfirmation`; replace academic body-token assertions and verify every intentional break is documented with no browser-selectable compatibility bypass.
- [ ] 4.2 **SEC-01-09 — Execute staged migration and safe rollback rehearsal.** Deploy backend cookie contract before frontend memory migration, observe approved indicators, and rehearse rollback using only cookie-compatible builds under assigned ownership and time limit; verify rollback restores service without body refresh exposure or weakened rotation, revocation, generation, origin or audit controls.

## 5. Security verification and implementation closure

- [ ] 5.1 **SEC-01-10 — Execute security certification matrix.** In an identified safe environment, run authorized unit, HTTP-contract and browser checks for login/login-CSRF, reload, TTLs, concurrent tabs/fallbacks, invalid rotated credentials, individual/global logout, password change/reset, deactivation, cookie flags, CORS, abuse limits, aliases and safe rollback; record evidence statuses without credentials.
- [ ] 5.2 **SEC-01-12 — Close implementation plan traceability.** Map every requirement and scenario to changed files, focused tests, rollout evidence and residual risk; verify all SEC-01 tasks and acceptance criteria are resolved before requesting `VERIFY` or `ARCHIVE`, with RBAC, Inventario, ERP and unrelated account lifecycle behavior unchanged.

## Workflow follow-up

- Request separate authorization before `APPLY`, `VERIFY` and `ARCHIVE`.
- Archive only after implementation, approved certification evidence and explicit human request.
