# Design

## Context

See `proposal.md` and the delta specs. Current `POST /register` creates `UserRequest(PENDING)` with legal identification and administrative review. `User.identification` is required/unique; `Person` is optional on `User`; `AccountActivationToken` already stores a SHA-256 token hash, expiry, and one-use marker. Legacy activation changes `INACTIVE` to `ACTIVE` while setting password. Login permits only `ACTIVE` accounts. Existing public throttling defaults to five requests per sixty seconds.

## Goals / Non-Goals

**Goals:**
- Deliver a self-contained account lifecycle without fake identity data or automatic institutional linkage.
- Retain a strict separation between pending email verification, legacy inactive accounts, and administrator blocks.
- Preserve legacy `/register` request-review behavior and activation consumers.
- Keep authorization persisted and deny ERP access by default.

**Non-Goals:**
- Reconcile or create `Person`, change affiliation, volunteer, venture, governance, or ERP workflows.
- Auto-login after verification, add OAuth/MFA, alter existing role grants, or repair historical identity data.
- Reuse public registration to create privileged users.

## Decisions

### 1. New public contract, legacy `/register` retained

Keep `POST /register` and `UserRequest` unchanged for historical/institutional account requests. Add public `POST /community-accounts/register`, `POST /community-accounts/verify-email`, and `POST /community-accounts/resend-verification`; all avoid collision with legacy routes. Registration accepts `fullName`, `email`, `password`, `passwordConfirmation`, and required `privacyAcknowledgement`; verification accepts `token`; resend accepts `email`. Registration/resend return the same neutral `202` acknowledgement for every eligible/suppressed identity state. This is lower risk than changing payload semantics of `/register` and protects existing frontend/admin consumers.

### 2. Account-only identity model

Create a `User` with `personId = null`; write submitted display name and normalized access email only to `User`. Make `User.identification` nullable through an additive Prisma migration. PostgreSQL unique constraints permit multiple nulls, preserving uniqueness for existing legal identifiers. Do not create a minimal `Person`: email/name coincidence is not sufficient authority to link to a physical identity.

Alternative rejected: synthetic identification violates the identity contract. Creating a blank `Person` confuses email control with identity and creates future reconciliation risk.

### 3. Explicit lifecycle state

Add `PENDING_EMAIL_VERIFICATION` to `UserStatus`. Community registration stores a password hash and this pending status; verification changes it atomically to `ACTIVE`. Preserve `INACTIVE` for approved legacy accounts that must still set a password. Preserve `BLOCKED`; no verification/resend can make it active. Login continues to reject all non-`ACTIVE` users.

Alternative rejected: overload `INACTIVE`, because it cannot distinguish a legacy activation password setup from already-set community credentials and administrative inactivity.

### 4. Persisted least-privilege role

Add role `Cuenta comunitaria` in schema migration data and idempotent seed definitions, with zero `RolePermission` entries. Registration resolves this role by stable name inside its transaction; absence is an operational configuration failure, not a client-selectable role. Existing server-side `canAccessErp` remains false because there is no Person/Affiliate and no ERP capability. Add authenticated `Mi Comunidad` outside `/app`; direct ERP/admin routes remain guard- and API-protected.

Alternative rejected: reuse `Subscription_L1` or `Vecino/Afiliado`, which conflates existing semantics and future grants.

### 5. Token and delivery policy

Reuse `AccountActivationToken` storage and random 32-byte, SHA-256-hashed token generator. Add a persisted token-purpose discriminator in the additive migration, defaulted/backfilled as `LEGACY_ACCOUNT_ACTIVATION` for existing records, with `COMMUNITY_EMAIL_VERIFICATION` for the new lifecycle. Token lookup and invalidation MUST filter by both purpose and expected account state; this prevents a community verification endpoint from consuming a historical activation token, and vice versa. Add a community verification use case rather than modifying legacy activation semantics. At registration/resend, transactionally invalidate outstanding usable community-verification tokens for that pending user, persist one replacement, and deliver only after commit. Consume through `usedAt IS NULL AND expiresAt > now`, matching purpose, plus pending-status transition in a serializable transaction. Logs/audit store account/event metadata only, never token plaintext.

Reuse `NotificationsModule`, `NotificationService`, `EmailProvider`, `FakeEmailProvider`, `GmailAppPasswordEmailProvider`, `NotificationUrlBuilder`, and existing email layout. Add `COMMUNITY_EMAIL_VERIFICATION` as a security notification event, an intent carrying token and expiry, `NotificationUrlBuilder.communityEmailVerification()` targeting a dedicated public verification route, and a template whose subject/body state “Verifique su correo para completar su cuenta comunitaria”; it MUST NOT say “Su solicitud fue aprobada” or ask for another password. Keep `ACCOUNT_ACTIVATION_REQUESTED`, `/activate-account`, `ActivationTokenDeliveryService`, and the approved-ADI-account template unchanged for legacy activation.

Use existing IP throttling for registration and resend, plus a per-pending-account resend window computed from community-verification-token issuance history. Return a neutral acknowledgement for accepted or suppressed requests. Notification delivery occurs after transaction commit through the existing provider port. If it fails, retain the pending account and its token, record a token-safe operational/audit event, return neutral acknowledgement from public registration/resend, and allow recovery through the bounded resend flow; do not create a session or claim successful delivery. Expired, used, or purpose-mismatched links never activate an account and offer safe resend. Durable outbox/retry is explicitly out of scope because it does not exist for legacy delivery; it requires separate authorization. Exact TTL and per-account limits are configuration defaults selected in APPLY and covered by tests, without embedding secrets.

Alternative rejected: token plaintext persistence, browser verification, and a separate unaudited token model.

### 6. Password, duplicate, and privacy policy

Validate password/confirmation at registration using existing secure hasher and password policy. Normalize email as current DTOs do. User email remains global unique access identity; concurrent creation handles database unique conflict and maps it to the same neutral acknowledgement. Existing active/blocked/legacy accounts are never changed by community registration. A dedicated resend request only delivers for `PENDING_EMAIL_VERIFICATION`, but produces the same response for every email state.

### 7. Frontend behavior

Replace legacy account-request form only after backend contract is ready. Form exposes name, email, password, confirmation, required privacy acknowledgement, inline accessible validation, loading state, and neutral post-submit message. Verification page sends token to backend, distinguishes safe invalid/expired/used results, offers resend, and redirects successful verification to `/login`; it never creates client session. Login routes verified community users to `Mi Comunidad`; `/app` stays unavailable.

## Risks / Trade-offs

- [Migration alters account schema] → additive nullable column/state only; preflight legacy rows, use backward-compatible code order, document forward rollback.
- [Token resend race/replay] → serializable transaction, conditional token claim, invalidate-before-create, focused concurrency tests.
- [Cross-lifecycle token use] → persisted token purpose, purpose/state-filtered lookup, legacy default/backfill, regression tests in both endpoints.
- [Email enumeration or abuse] → uniform acknowledgement, public throttling, per-account resend window, no token logging.
- [Email delivery failure after commit] → pending state/token retained, observable safe audit/error event, resend recovery; public response stays neutral and makes no false delivery/verification claim.
- [Role missing/misconfigured] → migration plus idempotent seed and startup/integration test; do not fall back to privileged role.
- [Legacy activation regression] → separate use case/routes and regression coverage for `INACTIVE` legacy accounts and existing tokens.

## Migration Plan

1. Before APPLY, owner approves schema/RBAC change and confirms disposable PostgreSQL validation environment and rollback boundary.
2. Add migration: nullable `User.identification`, enum `PENDING_EMAIL_VERIFICATION`, token-purpose discriminator with legacy-safe default/backfill, and idempotent `Cuenta comunitaria` role with no permission rows. Preserve all existing data; no identity backfill required.
3. Update Prisma schema, generated client, seed role source, backend lifecycle/registration contracts, then frontend only after backend contract tests pass.
4. Deploy migration before code that writes pending community accounts. Rollback application by disabling community routes; retain additive nullable schema/state and role. Do not delete pending accounts or issued records. Forward repair resolves any partially delivered pending account through resend.
5. Operator validates migration and behavior against disposable PostgreSQL before production authorization; production migration, seed, and mail configuration require separate owner approval.

## Open Questions

- Exact production TTL and resend limits remain deployment configuration values; their choice does not change the behavioral contract.
- Final community-space content is limited to an authenticated shell/placeholder in V1; personal profile expansion requires separate scope.
- Local worktree contains only `.env.example` files, no readable local `.env`; structural configuration is therefore unproven for real delivery. The checked examples are valid for fake/disabled delivery. Before real deployment, operator must supply a valid public `APP_PUBLIC_URL`, `EMAIL_PROVIDER=gmail-app-password`, `EMAIL_SEND_ENABLED=true`, `EMAIL_FROM`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` through approved secret management; values must not be logged or committed.
