## Context

See `proposal.md` for motivation and `specs/security/institutional-access-contract/spec.md` for normative behavior.

Repository evidence at baseline `0aa9dff` shows two mature but incompletely joined foundations:

- UserRequest approval already resolves Person identity, creates an inactive User, assigns an active Role, creates an AccountActivationToken, and delivers the existing activation link.
- Account activation already hashes tokens, validates expiration and reuse, atomically activates the User, establishes the password, and records audit evidence.
- Authentication reloads RolePermission and Permission records into `permissionCodes`; `CapabilityGuard` already authorizes newer modules from those persisted codes.
- Public frontend `/register` currently calls direct `POST /register`, which creates an active User and bypasses UserRequest review and activation.
- Frontend navigation and many routes already use capability identifiers, but legacy backend modules still authorize with software role names. Some capability names and route/API groupings drift.
- `BoardPosition` and governance membership are institution-domain concepts separate from account Role and Permission.

The relational model is sufficient. This is an application-contract reconciliation, not a persistence redesign.

```text
Canonical account flow

Public /register
      |
      v
UserRequest(PENDING snapshots; optional safe Person link)
                           |
            capability-protected review + Person resolution
                           |
              +------------+------------+
              |                         |
           REJECTED                  APPROVED
                                        |
                             User(INACTIVE)+Role
                                        |
                            AccountActivationToken
                                        |
                              email activation link
                                        |
                           password + User(ACTIVE)
                                        |
                           login + persisted Session
                                        |
                        RolePermission -> Permission[]

Authorization decision

permission code ---> navigation visibility
                ---> frontend route/action guard
                ---> backend API capability guard (authority)
```

## Goals / Non-Goals

**Goals:**

- Reuse the complete approved UserRequest and activation path as the only public account-entry path.
- Make persisted permission codes the single runtime authorization input for sensitive business capabilities.
- Preserve current URLs and domain behavior except for the intentional `/register` semantic correction.
- Migrate legacy role guards incrementally with explicit equivalence evidence and no access expansion.
- Produce a testable actor/module contract spanning navigation, deep links, actions, APIs, and audit evidence.
- Keep rollout application-only and reversible without data migration.

**Non-Goals:**

- No Prisma edits, migrations, seed-role redesign, or new authorization tables.
- No dynamic RBAC catalog administration.
- No replacement of JWT, refresh sessions, passwords, lockout, activation links, or notification delivery.
- No governance redesign and no BoardPosition-to-Role mapping.
- No authorization-by-client-state and no broad frontend visual work.

## Decisions

### 1. `/register` becomes a UserRequest compatibility entry point

The public URL remains `/register`, but its submission uses the existing UserRequest creation contract and returns request-submission semantics. The direct public active-User creation path is removed from normal public reach. Administrator bootstrap remains a distinct controlled backend concern and is not routed through public UI.

The frontend should reuse or converge on the existing UserRequest form model rather than maintain separate registration semantics. It submits the validated identity/contact snapshots required by the current request contract. Submission MAY retain an existing Person link only when current resolution is safe and unambiguous; it does not require Person linkage to accept a valid request. Approval remains the gate that must safely resolve or reconcile a canonical Person before creating the inactive User. Success tells the applicant that review is pending; it does not authenticate or redirect into ERP.

Alternative rejected: keep both public direct registration and request registration. Two entry paths preserve the bypass and make lifecycle guarantees false.

Alternative rejected: create User immediately but block login pending approval. Existing approval flow already creates inactive User and activation token atomically; duplicating pre-approval account state adds conflict paths without model benefit.

### 2. Preserve link activation unchanged and improve only integration feedback

`AccountActivationToken`, token generation, SHA-256 storage, expiration, single-use claim, email delivery, and `/activate-account` remain authoritative. Frontend activation maps established backend outcomes into distinct invalid/expired, used, ineligible/already-active, and success feedback without pre-validating token truth client-side.

Alternative rejected: numeric OTP. It conflicts with approved behavior and would require a new security and delivery contract.

### 3. Persisted capabilities are runtime authority

Server-resolved `permissionCodes` from RolePermission relations remain the sole capability input. Role names remain useful for catalog display, seeding, subscription policy, and compatibility evidence, but sensitive endpoint authorization migrates to `CapabilityGuard` plus explicit capability decorators.

`ROLE_CAPABILITIES` remains seed/equivalence data, not runtime authorization. No endpoint trusts role, permission, or capability values supplied by frontend input or storage.

Alternative rejected: centralize on role-name guards. This prevents granular assignments already represented by the model and conflicts with current capability-based modules and frontend behavior.

### 4. Build one reviewed capability inventory before guard replacement

Implementation first records every sensitive controller/handler and classifies it as `PUBLIC`, `AUTHENTICATED`, or `CAPABILITY_PROTECTED`. For each legacy role-guarded endpoint, the inventory identifies its canonical existing capability. If no existing capability represents the endpoint/action correctly, inventory records missing-capability candidate, endpoint/action, and existing role behavior; implementation stops that endpoint migration and requests explicit product approval before any new identifier, policy entry, or seed mapping is added.

Targeted legacy migrations include Users-related review surfaces, Affiliates, Affiliate Requests, User Requests, Audit Logs, Inventory, sanctions/admin reports where exposed, and any remaining representative module found during the inventory. Newer capability-guarded modules are regression-checked rather than rewritten.

Role guards are removed only after tests prove equivalent allowed actors and denied actors using persisted permissions. Mixed guards are not retained as permanent defense-in-depth because role checks would continue to override legitimate capability assignments.

Alternative rejected: bulk mechanical replacement based only on menu names. Endpoint actions can require different capabilities and some endpoints are intentionally public or authentication-only.

### 5. Capability identifiers form a three-layer contract

One canonical inventory is consumed conceptually by:

| Layer | Responsibility | Failure outcome |
| --- | --- | --- |
| Navigation/action UX | Hide unavailable entry points and actions | Item absent/disabled |
| Frontend route | Prevent protected component/data initialization on deep link | `/403` for authenticated denial; `/login` for anonymous |
| Backend API | Authoritative data and mutation protection | `403` for missing capability; `401` for missing/invalid auth |

Existing shared capability constants are reconciled against backend policy. Frontend-only identifiers with no backend contract, including the observed absence-justification drift, are removed or mapped to the canonical backend identifier. Route grouping must match endpoint policy; UserRequest review cannot inherit an unrelated capability merely because it shares a page area.

Alternative rejected: infer frontend access from role names. It recreates drift and prevents persisted permission changes from taking effect consistently.

### 6. ERP shell and route policy become explicit default-deny

Authentication restoration completes before protected content renders. The ERP shell does not require `erp.dashboard.read` or any other universal module capability and does not itself grant sensitive access. Every sensitive child route has explicit capability metadata or an explicit documented authentication-only classification: `/app/dashboard` requires `erp.dashboard.read`; finance, inventory, users, and all other modules require their own canonical capabilities. Bare ERP entry redirects to the first authorized child route or renders forbidden/no-administrative-access behavior when none is available.

Self-service routes such as profile, personal assemblies, reservation request, and personal absence justifications are reviewed separately. They remain authentication-only only when backend ownership checks make that policy correct; they are not assigned administrative capabilities for convenience.

Alternative rejected: rely on sidebar filtering. Direct URLs and API calls bypass navigation.

### 7. Preserve governance and software access as separate axes

No authorization decision reads BoardPosition, GovernancePosition, board appointment labels, or affiliate legacy role snapshots as software permissions. A governance office holder accesses SGI functions only through their User's assigned software Role and persisted permissions.

The existing software role named `Tesorero` remains a software Role. Similarity to the governance position `TREASURER` is not treated as identity or automatic assignment.

### 8. Keep user and role administration bounded to existing capabilities

Existing user listing, update, lifecycle, unlock, and role-assignment operations remain capability-protected and audited. Role selection continues to accept a server-validated active role ID. Administrator continuity constraints remain intact.

This change does not add role creation, role editing, permission creation, permission editing, or RolePermission mutation APIs/UI. No capability identifier is added during endpoint migration without the explicit product-approval gate in Decision 4; approved static policy/seed work still adds no persistence model.

### 9. Audit security transitions, not authorization reads

Existing UserRequest creation/review, User creation, activation, role assignment, lifecycle, login/session, and sensitive business audit events are preserved. Guard denials are validated through tests and operational HTTP evidence; this change does not require persisting every denied read, which could create volume and privacy concerns.

Audit details continue to sanitize tokens, passwords, secrets, and credentials. Future dynamic RBAC mutation audit is deferred with its out-of-scope administration functions.

### 10. Certification uses actor fixtures defined by permissions

Tests model actors by persisted permission sets and ERP eligibility, not by invented institutional titles. At minimum certification covers:

- anonymous actor;
- authenticated general account without ERP capability;
- administrator policy actor;
- treasurer policy actor;
- inventory manager policy actor;
- authenticated actor missing each tested capability;
- actor with a capability independent of legacy role name where supported by controller tests.

For each sensitive module, evidence covers navigation, direct route, API access, and key action controls. Backend test fixtures must resolve permissions through the same repository shape as production. Database-mutating E2E runs use disposable test state and remain human-executed under repository policy.

## Risks / Trade-offs

- [Changing `/register` breaks direct-registration clients] -> Preserve URL and compatible identity fields, document response change, update all tracked clients/tests, and release frontend/backend together.
- [Legacy role-to-capability mapping is incomplete] -> Inventory endpoints first; block migration for any endpoint whose intended action cannot be mapped from current policy evidence.
- [Removing a role guard accidentally broadens access] -> Require allowed/denied equivalence tests before each controller migration and certify capability-only access explicitly.
- [Keeping both guards accidentally narrows valid capability access] -> Use mixed guards only during a short test transition; final sensitive policy is capability-based unless explicitly classified otherwise.
- [Frontend and backend constants drift again] -> Add contract tests comparing canonical identifiers and checking every sensitive route/navigation entry against policy evidence.
- [Existing role with no seeded capabilities loses ERP access] -> Treat empty assignments as explicit current evidence; do not invent capability mappings without product approval.
- [403 refresh causes repeated current-user calls] -> Preserve session on 403, refresh access state once, and avoid retry loops.
- [Account approval succeeds but email delivery fails] -> Preserve current transaction/delivery semantics, expose actionable administrative failure evidence, and do not invent a second activation mechanism.
- [Scope expands into governance or RBAC administration] -> Enforce diff checks for Prisma, migrations, BoardPosition mapping, and role/permission mutation APIs.

## Migration Plan

### Phase A - Contract inventory and focused regression baseline

1. Record current public registration, UserRequest, activation, login/session, role, permission, navigation, route, endpoint, and audit contracts.
2. Produce the endpoint/capability and actor/module matrices from current code.
3. Add or refine focused tests around existing approved activation and persisted-permission behavior before changing entry points or guards.

### Phase B - Account lifecycle closure

1. Route public `/register` submission to UserRequest creation and pending-review success behavior.
2. Remove public reachability of direct active-User registration while preserving controlled administrator bootstrap behavior.
3. Preserve approval, inactive User creation, role selection, activation-token delivery, activation, and login contracts.
4. Add explicit activation outcome UX and lifecycle integration tests.

### Phase C - Backend capability migration

1. Classify every representative endpoint and map legacy role requirements to canonical capabilities.
2. Migrate UserRequest, Affiliate/AffiliateRequest, Audit, Inventory, and remaining legacy sensitive controllers in bounded groups only where an existing canonical capability is evidenced; stop and escalate any endpoint needing a new capability.
3. Preserve public/authentication-only endpoints and domain ownership checks.
4. Verify `401`, `403`, successful access, role-independence, and audit behavior after each group.

### Phase D - Frontend navigation, route, and action alignment

1. Reconcile frontend capability constants with backend identifiers.
2. Give every sensitive navigation item, route, and action the matching canonical capability.
3. Make every sensitive child route default-deny, protect `/app/dashboard` specifically with `erp.dashboard.read`, and route bare ERP entry only to an authorized child or no-administrative-access behavior.
4. Verify anonymous, forbidden, allowed, deep-link, session restoration, and no-content-flash behavior.

### Phase E - Audit and actor-based certification

1. Verify existing sensitive lifecycle and role-assignment audit events remain sanitized and complete.
2. Execute the actor/module matrix across all three authorization layers.
3. Confirm no schema, migration, dynamic RBAC administration, OTP, OAuth/OIDC, governance mapping, or unrelated visual change entered scope.

### Rollback Strategy

- No database rollback is required because schema and persisted records are unchanged.
- Before release, account-lifecycle and authorization phases remain separately revertible in source control, but production cutover releases compatible frontend/backend policy together.
- If `/register` integration fails before UserRequest creation, revert the application release; do not reactivate direct registration as an undocumented hotfix.
- If capability migration denies or exposes incorrect access, restore the previous controller policy as one reviewed application rollback while preserving RolePermission and audit data, then forward-fix the mapping.
- Existing activation tokens and Sessions remain valid across rollback because their persistence and validation contracts do not change.

## Open Questions

None. Material V1 behavior is fixed by the institutional access report and this change's specification; module-specific capability mapping must be resolved from repository evidence during the inventory task, not guessed during implementation.
