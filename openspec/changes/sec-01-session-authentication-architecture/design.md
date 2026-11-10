# Design

## Decision Status

- **STATICALLY_OBSERVED**: established by current source, tracked configuration or tests; not runtime certification.
- **PROPOSED**: preferred target for architectural approval.
- **APPROVAL_REQUIRED**: human decision required before `APPLY`.
- **BLOCKED**: implementation must not begin until the stated dependency is resolved.
- **NOT_VERIFIED**: current repository evidence cannot establish the claim.

## Context

See `proposal.md` for motivation and `specs/security/session-authentication/spec.md` for normative behavior.

Current static evidence shows:

- login and refresh return both access and refresh credentials in JSON while also setting the refresh credential in an `HttpOnly` cookie;
- the browser stores `{ token, user }` in `sessionStorage`, sends the access token as Bearer, and enables credentialed requests;
- reload recovery trusts a stored access token long enough to call `/users/me`; it does not recover from a refresh cookie when Web Storage is empty;
- the response interceptor coalesces refresh inside one JavaScript context and retries a failed request once, but does not coordinate separate tabs;
- refresh credentials are random, stored as hashes, rotated atomically and bounded by an absolute persisted expiry;
- logout revokes the matching refresh session; password change/reset and account deactivation revoke sessions, while account deactivation and role change also advance session generation;
- cookie-backed refresh and logout validate the configured frontend origin, and CORS allows credentials only from that configured origin;
- `/users/me` returns current persisted account context and permission codes under backend JWT validation;
- deployment attributes and runtime behavior are not certified by this PROPOSE phase.

Tracked configuration proposes a one-hour access-token lifetime and contains conflicting refresh examples of fourteen and thirty days. Production documentation describes one HTTPS site behind one Caddy hop with `SameSite=Lax`, exact frontend origin and credentialed CORS. Effective deployed values remain **NOT_VERIFIED**.

Historical adjacent mismatch: frontend password change sent `password` and `passwordConfirmation`, while the backend DTO expects `newPassword` and `newPasswordConfirmation`. G3.3 corrected the frontend contract; token-based activation/reset retains its separate payload.

## Goals / Non-Goals

**Goals:**

- establish one browser session owner and one backend authority;
- prevent JavaScript and Web Storage from receiving long-lived refresh credentials;
- remove access credentials from persistent browser storage;
- preserve reload recovery, bounded retry, rotation, revocation and current-user refresh;
- define safe migration and rollback without mixing SEC-02 authorization redesign.

**Non-Goals:**

- changing roles, capability grants, resource authorization or ERP navigation;
- changing community registration or issuing a session during email verification;
- introducing Prisma changes, BFF infrastructure, new dependencies or new endpoints during PROPOSE;
- certifying production cookie, proxy, CDN or CORS behavior without runtime evidence.

## Decisions

### Approval record

On 2026-11-10, the SGI-Curime responsible approved D1-D5 as the target architecture for incremental implementation. Gate 1 authorizes only backend authentication/session compatibility: cookie-only refresh transport across existing aliases, secure production cookie policy, origin enforcement, response shaping and focused contract tests.

Gate 2 approval extends the backend contract only: access JWTs carry mandatory `sid = Session.id`; JWT validation fails closed when the persisted session is absent, foreign, revoked or expired; individual logout revokes the stable session ID; `POST /auth/logout-all` acts only for the authenticated user; password change/reset atomically advance `sessionGeneration` and revoke active sessions. JWTs without `sid` are rejected. This approval does not authorize frontend changes, Prisma schema changes, deployment or Gate 3.

Deployment topology, effective production origin/CORS/proxy behavior, refresh inactivity value, anti-abuse thresholds, browser coordination baseline, active-session cap, global logout and rollout/recovery parameters remain **NOT_VERIFIED** or **APPROVAL_REQUIRED** as stated below. D6-D10 remain pending for their later gates. This record does not authorize Gates 2 or 3, production deployment, Prisma changes, RBAC changes or frontend changes.

Implementation remains limited to the separately authorized gate and unresolved operational parameters remain pending.

### D1 — Prefer access token in memory plus refresh cookie only

The preferred browser model keeps the short-lived access token in the auth runtime and the refresh credential exclusively in an `HttpOnly` cookie. The browser restores after reload by performing one cookie-backed refresh, then retrieving `/users/me`. The backend remains authoritative for account activity, session generation and capabilities.

```text
Login
  Browser --credentials--> POST /login
  Backend --Set-Cookie: refresh HttpOnly--> Browser
  Backend --accessToken + user, no refreshToken--> Auth runtime

Protected request
  Auth runtime --Bearer accessToken--> API

Reload / expired access
  Browser --refresh cookie--> POST /refresh
  Backend --rotated Set-Cookie + accessToken--> Auth runtime
  Auth runtime --Bearer accessToken--> GET /users/me

Logout
  Browser --refresh cookie + trusted origin--> POST /logout
  Backend --revoke session + clear cookie--> Browser
  Auth runtime --clear memory and protected caches--> anonymous
```

Rationale: this removes refresh-token exposure to injected JavaScript and removes access-token persistence while retaining the existing Bearer authorization model, backend guards and server-side refresh sessions. It is less disruptive than converting every protected request to cookie authentication.

### D2 — Compare alternatives explicitly

| Dimension | A. Current hybrid | B. Memory access + cookie-only refresh (**preferred**) | C. Cookie session for all auth | D. BFF |
|---|---|---|---|---|
| Architecture | Bearer access token in `sessionStorage`; refresh in JSON and cookie | Bearer access token in memory; refresh only in `HttpOnly` cookie | Access/session credential sent automatically as cookie for every request | Browser talks to same-origin frontend server; BFF owns upstream credentials |
| Credential exposure | Refresh body and stored access token are JS-readable | Access token is JS-readable only while runtime lives; refresh is not | Tokens can be hidden from JS; cookies accompany requests automatically | Upstream tokens hidden from browser; BFF session cookie remains |
| CSRF/CORS/SameSite | Cookie refresh/logout need origin checks; dual transport complicates reasoning | Origin checks on cookie issuance/rotation/clear; explicit credentialed CORS; `SameSite` certified per topology | Every state-changing API operation requires robust CSRF protection | Same-origin BFF simplifies CORS, but BFF cookie operations still need CSRF controls |
| Concurrency/rotation | Single-flight per tab; no cross-tab coordination | Single-flight plus same-origin cross-context coordination; atomic server rotation and uniform invalid-token rejection | Depends on server session model; fewer client token races if opaque non-rotating session IDs | BFF centralizes refresh and can serialize upstream rotation |
| Expiry/revocation | Persisted refresh expiry and revocation; access generation checked | Same backend controls retained; reload explicitly uses refresh | Straightforward central session lookup, but may add a database lookup to every request | Centralized at BFF plus upstream; two session layers to operate |
| Reload recovery | Stored access token then `/users/me` | Refresh cookie, new in-memory access, then `/users/me` | Cookie automatically available; current-user request restores UI | BFF cookie restores BFF session |
| Existing clients | Current contract | Existing browser remains on current routes; body-token clients need inventory/transition | Broad API and frontend contract change | New deployment component and API facade |
| Complexity | Already implemented, but ambiguous and exposed | Moderate; focused frontend/backend changes | High cross-cutting controller/guard/CSRF change | Highest infrastructure, observability and operational cost |
| Maintenance | Two refresh transports | Clear browser boundary; no body-token compatibility mode | Uniform browser model but stronger universal CSRF burden | Extra service, routing, secrets and failure modes |

**Rejected as target:**

- **A, current hybrid:** preserves unnecessary refresh-token exposure and persistent access-token XSS surface.
- **C, all-cookie session:** valid architecture, but changes authorization transport for every protected API call and expands CSRF controls across the full API without a demonstrated SGI need.
- **D, BFF:** not pertinent now. SGI has one SPA and one first-party API; no demonstrated multi-upstream token mediation or server-rendering requirement justifies another deployable component. Reconsider only if topology or client portfolio changes.

### D3 — One cookie contract; no browser-selectable legacy mode

**PROPOSED.** Every current login, refresh and logout alias uses the same cookie-only refresh contract. A route, media type, custom header or `User-Agent` cannot establish confidential-client identity because browser JavaScript can select those values. Repository evidence shows only the SPA and automated tests; no confidential external client is evidenced. Therefore:

- login and refresh responses omit refresh credentials for all aliases;
- refresh and logout reject refresh credentials in request bodies after migration;
- the existing body-token e2e cases become intentional compatibility breaks and are replaced with cookie-contract cases;
- external and confidential clients remain **NOT_VERIFIED**;
- any future body-token contract requires a separate approved capability plus non-browser client authentication such as mTLS or an equivalent confidential-client mechanism. It is not part of SEC-01.

This decision is **APPROVAL_REQUIRED** because it intentionally breaks the current academic body-token contract. Until approved, `APPLY` is **BLOCKED**.

### D4 — Cookie, CSRF, CORS, TTL and topology contract

**PROPOSED target:**

| Control | Target | Evidence/status |
|---|---|---|
| Production cookie name | `__Host-sgi_refresh` | **PROPOSED**; current default is `sgi_refresh` |
| Development cookie name | `sgi_refresh` over local development transport | **PROPOSED**; not production-equivalent |
| Attributes | `HttpOnly`, `Secure` in production, no `Domain`, `Path=/` | `Path=/` and `HttpOnly` are **STATICALLY_OBSERVED**; production `Secure` derives from code |
| SameSite | `Lax` for approved same-site topology | tracked configuration/documentation **STATICALLY_OBSERVED**; runtime **NOT_VERIFIED** |
| Access TTL | 15 minutes | **PROPOSED / APPROVAL_REQUIRED**; tracked current default is one hour |
| Refresh absolute TTL | 30 days, never extended by rotation | **PROPOSED / APPROVAL_REQUIRED**; tracked examples conflict at 14/30 days |
| Refresh inactivity TTL | Proposed idle expiry bounded by 30-day absolute maximum; exact value and reset semantics require approval | **PROPOSED / APPROVAL_REQUIRED**; not established by current evidence |
| CORS | exact trusted frontend origin with credentials; never wildcard | **STATICALLY_OBSERVED** in source; runtime **NOT_VERIFIED** |
| Proxy | exactly one trusted Caddy hop in production | tracked deployment contract **STATICALLY_OBSERVED**; runtime **NOT_VERIFIED** |

`Path=/` is necessary while root and `/auth/*` aliases coexist; cookie path is defense-in-depth, not authorization. Cookie creation, rotation and clearing—including login—require a verifiable trusted `Origin`; reviewed `Referer` fallback remains permitted. Browser requests without trusted evidence fail closed. CORS does not replace CSRF protection.

Same-origin or same-site HTTPS behind the documented proxy is the preferred topology. `SameSite=None`, multiple origins, extra proxy hops or cross-site frontend/API deployment are **BLOCKED** until a revised CSRF/CORS design is approved and runtime-certified.

### D5 — Rotation uses rejection without reuse classification

**PROPOSED level 1.** Compare-and-rotate remains atomic. Expired, revoked, unknown and already-rotated credentials all receive the same unauthorized result and generic `REFRESH_FAILED` audit evidence without credential material. Current persistence replaces the active hash and cannot distinguish reuse from an unrelated unknown token; SEC-01 therefore does not claim replay-family detection.

No server grace window or refresh-family persistence is proposed. Detectable reuse, family revocation or lineage would require a later persistence design and separately approved Prisma migration.

### D6 — Deterministic renewal coordination

**IMPLEMENTED in G3.2; browser certification remains NOT_VERIFIED.**

1. `AuthProvider` starts `initializing`, performs cookie-backed `POST /refresh` without Bearer, then fetches `/users/me`; only the resulting access token remains in provider memory.
2. A shared coordinator serializes cookie-mutating bootstrap refresh, 401 renewal, login and logout operations inside a JavaScript context.
3. When available, a named same-origin Web Lock guards each cookie operation. Acquisition waits at most five seconds through `AbortSignal`; lock release is guaranteed by the request callback settlement.
4. `BroadcastChannel` uses only `session-changed`, `session-invalidated`, `refresh-started` and `refresh-completed`, with ephemeral operation identifier and timestamp. It never carries credentials, cookie material, user/session IDs, roles, capabilities or personal data.
5. Duplicate and expired channel events are ignored. Remote `session-changed` invalidates local epoch/cache then performs its own cookie refresh plus `/users/me`; remote `session-invalidated` only clears local frontend context and never rebroadcasts or auto-recovers.
6. No tab receives or reuses another tab's access token. `sessionEpoch` prevents stale bootstrap, refresh, login or `/users/me` results from restoring obsolete state.
7. If Web Locks is unavailable, only local serialization remains. If BroadcastChannel is unavailable, only single-context behavior remains; Web Storage is never used as a fallback channel.
8. Original protected requests retain one retry maximum. Login, refresh and logout are never recursively refreshed.

Cooperation is same-origin and best-effort. It does not revoke issued JWTs, synchronize unsupported/non-cooperative contexts, or replace server-side revocation. Real browser multi-tab behavior and supported-browser baseline remain **NOT_VERIFIED**; repository browser evidence covers Chromium only.

### D7 — Revocation and generation are transactional security state

**PROPOSED:**

- Individual logout revokes only the session identified by the cookie and clears it idempotently.
- Password change/reset atomically updates the password, increments `sessionGeneration`, sets invalidation metadata and revokes all active refresh sessions. The initiating session ends; frontend clears memory/caches and requires login.
- Account deactivation already performs status change, generation increment and refresh-session revocation in its repository transaction.
- User-requested global logout is a new authenticated operation that atomically increments generation and revokes all active refresh sessions. Exact route approval is required; proposed route is `POST /auth/logout-all`.
- Existing role-change invalidation remains unchanged and belongs to authorization governance.
- A persistence failure rolls back the security mutation. Audit recording occurs after commit on a best-effort path; audit failure must create operational evidence but must not undo or falsely report the committed security state.

No Prisma schema change is required: `sessionGeneration`, invalidation metadata and session revocation fields already exist. Endpoint approval and password/reset generation behavior are **APPROVAL_REQUIRED**.

**Gate 2 approval record:** the endpoint and password/reset generation behavior above are approved for backend implementation. Verification remains limited to focused unit and HTTP-contract evidence; PostgreSQL integration and production behavior remain **NOT_VERIFIED** until a safe identified environment is authorized.

### D8 — Password-change contract is backend-canonical

**IMPLEMENTED in G3.3 frontend.** Canonical request fields are `currentPassword`, `newPassword` and `newPasswordConfirmation`, matching the current backend DTO and use case. Frontend authenticated profile change now sends only these fields; token-based activation/reset remains the separate `{ token, password, passwordConfirmation }` contract. Backend does not accept duplicate aliases that could create ambiguous validation.

### D9 — Session state has one frontend mutation owner

The auth provider owns in-memory access credential, authoritative user state and anonymous transition. HTTP transport may request renewal and emit typed outcomes, but it must not independently persist or clear session state. TanStack Query remains owner of server data; protected caches are cleared on invalid-session transition, not on an isolated `403`.

### D10 — Human approval gate

`APPLY` requires explicit approval of:

1. preferred model B and removal of body refresh transport for every current alias;
2. proposed production cookie name and attributes;
3. 15-minute access TTL and 30-day absolute refresh TTL;
4. same-site production topology and fail-closed origin policy;
5. cross-tab progressive-enhancement strategy and supported browser baseline;
6. generation increment for password change/reset and proposed global-logout operation;
7. canonical password-change fields;
8. concurrent-session limit decision;
9. security certification matrix and rollback ownership/thresholds.

## Consumer Matrix

| Alias | Method | Observed consumer | Current credential contract | Target contract | Compatibility | Evidence | Status |
|---|---|---|---|---|---|---|---|
| `/login` | POST | SPA | credentials in body; access/user consumed; refresh body ignored; cookie accepted | access/user body; refresh cookie only; trusted origin | refresh field removal does not affect typed SPA response | `auth.api.ts`, `AuthContext.tsx` | **STATICALLY_OBSERVED** |
| `/auth/login` | POST | backend e2e; community login tests | credentials in body; access/user/refresh body plus cookie | same secure contract as `/login`, no refresh body | body-refresh assertions intentionally replaced | `auth.e2e-spec.ts`, community auth tests | **STATICALLY_OBSERVED** |
| `/refresh` | POST | SPA interceptor; backend e2e | SPA sends cookie/no body; tests also send refresh body | cookie only; access body; rotated cookie | SPA compatible after memory migration; body test breaks | `httpClient.ts`, `auth.e2e-spec.ts` | **STATICALLY_OBSERVED** |
| `/auth/refresh` | POST | backend e2e | cookie-backed rotation; response also contains refresh body | cookie only; access body; rotated cookie | refresh response assertion breaks | `auth.e2e-spec.ts` | **STATICALLY_OBSERVED** |
| `/logout` | POST | SPA; backend e2e | SPA sends cookie/no body; tests cover body/cookie | cookie only; idempotent revoke and clear | SPA compatible; body test breaks | `auth.api.ts`, `AuthContext.tsx`, `auth.e2e-spec.ts` | **STATICALLY_OBSERVED** |
| `/auth/logout` | POST | backend e2e | body or cookie refresh credential | cookie only | body-token case breaks | `auth.e2e-spec.ts` | **STATICALLY_OBSERVED** |
| `/users/me` | GET | SPA; users e2e | Bearer access; persisted profile/capabilities | canonical authoritative browser user context | preserved | `auth.api.ts`, `users.controller.ts`, tests | **STATICALLY_OBSERVED** |
| `/auth/me` | GET | backend e2e/controller tests | Bearer access; auth principal projection | retained compatibility projection; not browser recovery authority | preserved | `auth.controller.ts`, `auth.e2e-spec.ts` | **STATICALLY_OBSERVED** |
| Auth aliases | mixed | repository scripts | no script consumer found in inspected repository | no special contract | absence outside inspected tree cannot be claimed | targeted repository search | **NOT_VERIFIED** externally |
| Auth aliases | mixed | mobile, third-party or external clients | no verified consumer or confidential-client authentication | unsupported until separately approved | breaking impact unknown | no immutable consumer registry found | **NOT_VERIFIED / BLOCKED** if claimed |

## Threat Model and Anti-Abuse

| Threat | Boundary/control | Residual status |
|---|---|---|
| XSS reads credentials | refresh cookie is `HttpOnly`; access stays in memory; CSP and input defenses remain required | in-page actions and memory access remain possible; **NOT_ELIMINATED** |
| CSRF/login CSRF | trusted-origin validation for cookie create/rotate/clear, `SameSite=Lax`, exact credentialed CORS | runtime proxy/header behavior **NOT_VERIFIED** |
| Refresh theft | random token, hash-only persistence, `Secure` transport, rotation and absolute expiry | stolen token may win first-use race |
| Session fixation | login always creates a fresh server session and overwrites browser refresh cookie | other legitimate device sessions remain by policy |
| Unknown/rotated credential | uniform rejection and redacted `REFRESH_FAILED` evidence | no reuse-family classification by D5 |
| Cross-tab race | D6 lock/channel/fallback algorithm and bounded retries | unsupported-browser behavior requires certification |
| Deactivated account | persisted status and generation validation plus refresh revocation | current source evidence exists; runtime **NOT_VERIFIED** |
| Compromised client | backend re-resolves account/capabilities and never trusts browser role/capability claims | valid client session can act until revoked |
| Proxy/origin drift | one-hop proxy contract, exact origin, fail-closed production configuration | deployed topology **NOT_VERIFIED** |

Current login lockout is **STATICALLY_OBSERVED**. `forgot-password` throttling exists, but equivalent login/refresh/logout rate policies are not established by inspected SEC-01 evidence. `APPLY` must propose measurable limits through existing throttling infrastructure and tests; numeric thresholds are **APPROVAL_REQUIRED**. Logout remains idempotent to avoid amplification. Login errors remain non-enumerating. Security metrics count login failure, refresh failure, invalid origin, rotation conflict, logout and global revocation without credentials, cookie values or passwords.

## Concurrent Session Policy

- Multiple devices are **PROPOSED** as supported; each login creates an independently revocable persisted session.
- Individual logout affects only the current refresh session.
- Global logout, password change/reset and account deactivation affect every session and generation as defined in D7.
- A new login does not silently revoke other devices unless an approved active-session cap is exceeded.
- No current product rule establishes a maximum active-session count. Options are unlimited with monitoring, a fixed cap with oldest-session revocation, or user-managed sessions. Recommendation: fixed cap plus user-visible session management, but cap value and UI are outside current evidence.
- Maximum count and whether session-management UI belongs to SEC-01 are **APPROVAL_REQUIRED** and **BLOCK APPLY** for that behavior. Core cookie migration may proceed only if human approval explicitly defers the cap without claiming it implemented.
- Password change requires current-password reauthentication; password reset requires the one-time reset token; administrative deactivation retains backend capability enforcement. No generic step-up framework is introduced by SEC-01.

## CU V2 Traceability

Historical repository evidence references `CU-01` and `CU-23` through `CU-31` for login, recovery, profile, accounts and security, but the immutable V2 catalog and exact per-CU mapping are unavailable in the inspected repository. Their SEC-01 relationship is therefore **NOT_VERIFIED**. No CU identifier is asserted as implementation evidence, and missing immutable-catalog verification does not silently authorize or certify behavior.

## Risks / Trade-offs

- [XSS can still use an in-memory access token or act through the page] → Keep access TTL short, retain CSP/input defenses, and avoid persistent credentials; SEC-01 does not claim XSS elimination.
- [Cross-tab refresh races can reject a legitimate context] → Coordinate same-origin refresh, test race ordering, keep one retry, and fail predictably.
- [Unknown clients may consume refresh credentials from JSON] → Treat them as unsupported and **NOT_VERIFIED**; do not preserve an insecure browser-selectable mode.
- [Cross-site deployment may force `SameSite=None`] → Require `Secure`, exact credentialed CORS and runtime CSRF certification.
- [Origin/referer behavior differs through proxies] → Certify effective production headers through the real proxy chain; fail closed rather than accept unverifiable browser mutation.
- [Password change/reset currently may leave access tokens valid until expiry] → Approve and test generation advancement or an equivalent immediate invalidation mechanism.
- [Frontend/backend password-change field names appear divergent] → Characterize contract before APPLY; fix only under explicit task scope and compatibility tests.
- [Rollback pressure could request refresh-body restoration] → Refuse that rollback; use cookie-contract compatibility builds or forward-fix.

## Migration Plan

### Phase 0 — Approval and evidence

- Approve D1-D10 and the delta spec.
- Inventory browser, scripts, mobile/third-party and test consumers of login/refresh/logout.
- Record current cookie/CORS environment by deployment without printing secrets.
- Approve TTLs, browser baseline, concurrent-session decision, rate thresholds, global-logout route and rollback ownership/triggers.

### Phase 1 — Backend compatibility foundation

- Add contract tests for cookie-only login/refresh/logout across every preserved route alias.
- Remove refresh credentials from all response and request bodies; do not add client-selectable legacy behavior.
- Apply trusted-origin checks consistently to cookie issuance, rotation and clearing.
- Preserve atomic rotation, absolute expiry, hashed storage and audit redaction.
- Close generation gaps for password change/reset, implement approved global logout, and align canonical password fields without changing RBAC.

### Phase 2 — Frontend runtime migration

- Make auth runtime sole session owner.
- Remove token/user Web Storage dependency and purge the obsolete storage key safely.
- Recover reload through coordinated refresh then `/users/me`.
- Preserve one-retry behavior, `401`/`403` distinction and protected-cache cleanup.
- Add same-origin cross-context renewal coordination.

### Phase 3 — Controlled transition

- Deploy backend cookie contract before frontend memory migration; current SPA already sends cookies and does not type the refresh response field, but this compatibility must be proved by authorized tests.
- Deploy frontend against cookie-only behavior.
- Monitor generic refresh failure, rotation conflicts, logout and invalid-origin outcomes without recording credentials.
- Keep only reviewed cookie-contract builds available for rollback.

### Phase 4 — Alias and obsolete-storage retirement

- Confirm no approved client sends or expects refresh credentials in bodies and no Web Storage credential remains.
- Remove obsolete body DTO fields and browser session-storage utility after migration evidence passes.
- Preserve route aliases until independent deprecation approval.

### Phase 5 — Security certification

- Execute focused unit and contract tests, browser integration tests, concurrency/invalid-credential cases and safe-environment deployment checks.
- Verify login, reload, expiry, logout, password change/reset, account deactivation, CORS, CSRF, cookie attributes and rollback.
- Report unexecuted runtime checks as `NOT_VERIFIED`; do not certify from static review.

### Rollback

Rollback never restores refresh credentials in bodies. Approved sequence:

1. stop rollout and preserve evidence;
2. revert frontend only to a reviewed cookie-compatible build;
3. if backend rollback is required, use the last backend build that supports cookie-only refresh and the current aliases;
4. prefer forward-fix when no safe cookie-only build exists;
5. retain rotation, revocation, origin validation, audit redaction and generation checks throughout.

Proposed activation signals are sustained login/refresh failure above the human-approved threshold, inability to recover valid sessions after reload, cross-tab invalidation beyond the approved rate, or confirmed alias incompatibility. Security findings involving credential disclosure trigger containment, not insecure compatibility.

The proposed operational owner is the incident commander designated by the project owner, with backend and frontend maintainers executing their boundaries. No person is assigned by this document. Activation requires that designated owner plus architectural/security approval, except emergency containment under the project's incident authority. Proposed maximum rollback window is 24 hours; continued rollback requires renewed human approval. Closure requires restored service indicators, no browser refresh exposure, reconciliation of affected sessions and recorded validation evidence. Ownership, thresholds and 24-hour limit are **APPROVAL_REQUIRED**.

No schema rollback is expected. Any later refresh-family persistence proposal requires separate Prisma migration and rollback approval.

### Integrated certification checkpoint — 2026-11-10

- **VERIFIED:** disposable PostgreSQL guard, tmpfs isolation, health, Prisma migration deployment, smoke, and ownership-safe destruction on loopback port `55434`; no institutional/shared database was used.
- **VERIFIED:** focused auth HTTP contract tests for refresh, cookie rotation, logout, logout-all, password/reset and related session transitions; focused config, rate-limit and JWT strategy tests passed.
- **VERIFIED:** `backend/test/auth-postgres-certification.ts` used Prisma repositories/use cases against the disposable PostgreSQL database and verified real rows for sessions, generation increments, individual/global revocation, password change/reset, forced rollback, refresh/logout race and revoked/expired JWT `sid`; the container and tmpfs were destroyed.
- **PARTIAL:** controller-level auth HTTP tests still use Prisma mocks; they do not replace production topology or browser evidence. The real Prisma certification is focused on the SEC-01 persistence scenarios listed above.
- **NOT_VERIFIED:** real browser login/reload, multi-tab coordination, fallback APIs, Web Storage observation, production Caddy/HTTPS/CORS/cookie runtime, effective deployed TTL/inactivity and anti-abuse values, JWT performance, and operational recovery ownership.
- **FAILED / OUT OF SCOPE:** existing `events-auth.e2e-spec.ts` failures and unrelated `canAccessErp` expectations in `auth.e2e-spec.ts`; no SEC-01 files or behavior were changed in response.
