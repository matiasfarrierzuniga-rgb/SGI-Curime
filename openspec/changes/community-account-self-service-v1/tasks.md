# Tasks

## 1. Approval gate and persistence baseline

- [ ] 1.1 Obtain owner approval for the additive Prisma migration, `Cuenta comunitaria` zero-permission role, disposable PostgreSQL validation environment, and forward-only rollback plan; verify approval and environment evidence are recorded before any schema command.
- [x] 1.2 Inventory migration-dependent consumers of `User.identification`, `UserStatus`, roles, activation tokens, and seed deployment from current `origin/main`; verify no consumer is omitted from the implementation checklist.
- [x] 1.3 Implement and review additive migration making `User.identification` nullable, adding `PENDING_EMAIL_VERIFICATION`, adding purpose to `AccountActivationToken` with legacy-safe default/backfill, and creating `Cuenta comunitaria` with no `RolePermission`; verify migration SQL preserves existing rows/tokens and role/permission assertions pass on disposable PostgreSQL.
- [ ] 1.4 Update Prisma schema, generated-client workflow, and idempotent role seed source; verify focused seed tests/assertions prove community role exists with zero capabilities and existing roles retain grants.

## 2. Community registration and verification backend

- [ ] 2.1 Define dedicated community registration, verification, and resend DTO/HTTP contracts without changing legacy `POST /register`; verify DTO/controller tests reject invalid name, email, password confirmation, and missing privacy acknowledgement.
- [ ] 2.2 Implement account-only community creation with nullable `personId`/identification, normalized unique email, password hash, pending-verification state, and persisted community role; verify unit and disposable-PostgreSQL tests prove no Person, Affiliate, venture relation, or privileged grant is created.
- [ ] 2.3 Implement neutral duplicate/error acknowledgement and concurrency-safe unique-conflict handling; verify HTTP contract tests return indistinguishable public acknowledgement for active, blocked, legacy, and pending email cases.
- [x] 2.4 Extend existing notification infrastructure without new provider: add `COMMUNITY_EMAIL_VERIFICATION` security event/intent, dedicated community URL builder method, and a template stating email verification for community-account completion; verify template/service tests prove it never says `Su solicitud fue aprobada`, never requests another password, targets only community verification route, and legacy activation output is unchanged.
- [ ] 2.5 Implement separate community email-verification use case using hashed, expiring, single-use `AccountActivationToken` records filtered by persisted community purpose and atomic pending-to-active transition; verify unit tests cover valid, invalid, expired, reused, superseded, purpose-mismatched, concurrent, and blocked-account tokens with no session emission.
- [ ] 2.6 Implement resend policy: transactional prior-community-token invalidation, one replacement, public IP throttling, per-pending-account issuance limit, and safe post-commit delivery failure handling; verify unit/HTTP tests cover rate limit, race, provider failure, token secrecy, neutral response, retained pending state/token, and retry.
- [x] 2.7 Preserve and regression-test legacy `UserRequest` approval plus `INACTIVE` account activation; verify existing valid legacy token activates only a legacy inactive user, community endpoint rejects its purpose, and neither workflow grants community behavior accidentally.

## 3. Authentication, RBAC, and community entry

- [x] 3.1 Wire community account status/role into existing login, session, `/users/me`, capability, and internal-access behavior; verify tests prove pending/blocked accounts cannot log in and verified community account receives a standard session with `canAccessErp: false`.
- [ ] 3.2 Add API authorization regression coverage for community credentials; verify `401`/`403` tests deny ERP administration, user-request review, role/user management, ventures, and other privileged operations.
- [ ] 3.3 Add `Mi Comunidad` authenticated route/shell outside `/app` with direct-route and loading-state guards; verify frontend route tests show community session can open it while anonymous, pending, and ERP-route attempts expose no protected content.

## 4. Community registration and verification frontend

- [ ] 4.1 Replace public registration presentation only after backend contract lands: minimum fields, password confirmation, privacy acknowledgement, inline accessible errors, loading protection, and neutral success state; verify component tests and keyboard/screen-reader labels at 320/375/768/1024/1440 px expectations.
- [ ] 4.2 Implement verification and resend UI using server outcomes only; verify tests cover missing/invalid/expired/used/superseded token, resend throttling feedback, successful redirect to `/login`, and no client session creation.
- [ ] 4.3 Update login copy and post-login navigation for community users without changing ERP behavior; verify frontend tests route community user to `Mi Comunidad`, preserve valid public return routes, and reject `/app` return targets.
- [ ] 4.4 Preserve historical user-request administrative UI and its pending-review copy only where it still represents `POST /register`; verify focused frontend tests show no community registration outcome is represented as an approved affiliation or administrative account request.

## 5. Integration, security, and release evidence

- [ ] 5.1 Add focused backend unit/HTTP contract tests for registration, duplicate/privacy behavior, tokens, resend, legacy compatibility, notification event/template/URL selection, fake-provider delivery failure, role permissions, login, sessions, and direct protected routes; verify exact commands are documented and run only by authorized operator.
- [ ] 5.2 Add focused frontend tests for form states, routes, token UX, access guards, and accessibility; verify exact `npm run test -- --run <paths>` and `npm run verify` commands are documented for Daniel.
- [ ] 5.3 With explicit authorization, execute disposable PostgreSQL E2E certification for schema migration, lifecycle, concurrency, legacy activation, and rollback/forward-repair; record only evidenced result as `PASSED`, `FAILED`, or `NOT_EXECUTED`.
- [ ] 5.4 Structurally verify mail configuration without reading/logging secrets: fake-disabled test defaults, real-delivery required-variable validation, `APP_PUBLIC_URL` route construction, and `npm run email:test` safety gate. Do not send email in automated tests. Review migration SQL, secret-safe logs, CORS/session behavior, `git diff --check`, and final status; verify no token, credential, production data, unrelated change, automatic affiliation, institutional role, or ERP capability is included.

## Workflow follow-up

- Submit focused implementation PR against `main` with executed verification evidence.
- Archive only after owner accepts implementation and verification results.

## Safe checkpoint evidence — 2026-10-25

- Manual QA approved the community registration, validation/notification feedback, FakeEmailProvider verification, activation, login, `Mi Comunidad`, ERP isolation, and community-session preservation flows. QA-REG-007 is approved. QA-REG-005 is approved for successful verification and navigation; its final manual observation did not certify the exact Network request count.
- Automated focused coverage passed for community registration/verification/resend feedback, one-operation double-click protection, StrictMode non-duplication, used/expired/missing token states, SweetAlert2 success/navigation, no automatic client session, community login routing, ERP denial, backend token lifecycle, and zero-capability RBAC.
- Gmail real delivery was not exercised. Resend was selected as the transactional HTTPS adapter. QA-REG-008 manual certification approved one controlled diagnostic delivery and the real community flow: existing authorized Gmail receipt, `/verify-community-email` link, atomic account activation, SweetAlert2 success, login, and `/mi-comunidad` access. No automated or repeated real sends were performed. FakeEmailProvider harness remains test-only and loopback-gated.
- Resend QA uses `NODE_ENV=test`, `onboarding@resend.dev`, and exact server-side `RESEND_QA_ALLOWED_RECIPIENT` enforcement. Production configuration rejects that Resend test sender and does not apply the QA-recipient restriction, allowing a future verified institutional sender/domain. The previously exposed Resend key revocation cannot be verified from repository/local configuration and remains a required Resend-dashboard security confirmation.
- Full `AppRoutes.test.tsx` remains blocked by four inherited administrator-title assertions, reproduced against the `origin/main` baseline; focused community router coverage passes. General backend lint remains blocked by historical out-of-scope errors and is not run with `--fix` during this checkpoint.
- `Mi Comunidad` V1 remains an authenticated basic dashboard placeholder. PR creation, integration into `main`, production migration/seed, and archive remain pending.
