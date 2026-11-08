# Design

## Context

See proposal.md and `security/rbac-v2-authorization` delta. Current persistence has 13 roles, 93 permissions, and 151 grants, while the source catalog recognizes 46 legacy codes. Six unversioned V2 role records use 47 additional codes. Runtime guard recognition denies those codes even when persisted. Current ERP admission combines account status, role status, `Administrador` exception, Person, and active Affiliate state. `Cuenta comunitaria` is deployed for self-service accounts while V2 persistence also contains `ROLE_COMMUNITY_USER`.

## Goals / Non-Goals

**Goals:**
- Make source-controlled catalog the sole runtime recognition authority.
- Preserve least privilege: role definition does not grant access until a persisted RolePermission assignment exists.
- Separate ERP admission from capability authorization and from Person/Affiliate domain relationships.
- Transition community role identity without deleting records or changing account lifecycle.
- Replace only role guards whose capability mapping is approved by DEC-001 through DEC-004.

**Non-Goals:**
- No dynamic role or permission administration.
- No automatic V2 role assignment, governance-position mapping, or broad grant of database-only capabilities.
- No migration, seed, reset, or test against the persistent development PostgreSQL database.
- No modification of account-request, activation, email, SMTP, Person, Affiliate, or session contracts beyond admission evaluation.

## Decisions

### 1. Catalog is source-controlled and additive

Create a typed RBAC catalog containing legacy capabilities plus approved V2 codes observed in PostgreSQL. The catalog divides codes into `legacy`, `v2`, and `transition-unapproved`; only approved groups feed runtime `isKnownCapability` and seed policy. V2 codes with no approved endpoint stay cataloged only if explicitly marked non-routable; they do not receive controller mappings or grants beyond existing data.

Alternative rejected: accepting every persisted database string. That turns manual state into executable authorization policy and defeats review.

### 2. Admission precedes authorization

JWT resolution returns `canAccessErp` from account status, active role, and a versioned ERP-admitted role-name set. `ROLE_SYSTEM_ADMIN` and approved institutional V2 roles are admitted without Person/Affiliate. `ROLE_COMMUNITY_USER`, `Cuenta comunitaria`, and `Subscription_L1` remain excluded. CapabilityGuard then decides each protected operation from current persisted permission codes.

Alternative rejected: infer ERP admission from any nonempty permission list. It would broaden access for unclassified/manual assignments.

### 3. Community role migration is forward-only

An additive Prisma migration creates canonical `ROLE_COMMUNITY_USER` if absent, reassigns users from `Cuenta comunitaria` only when canonical role exists and has zero grants, then deactivates legacy role to prevent new assignment. It never deletes Role, User, RolePermission, tokens, or sessions. Seed creates canonical role and no longer creates the legacy role. Runtime treats both names as community/non-ERP until deployment migration is complete.

Alternative rejected: rename legacy row in place. Existing durable records and environment drift can make this unsafe or collide with an already-created V2 record.

### 4. Endpoint conversion uses explicit mapping table

Migrate only list/detail Affiliate Requests, Affiliate reads, audit logs, and inventory reads where code evidence already establishes `adm.requests.read`, `adm.affiliates.read`, `aud.logs.read`, and `inv.inventory.read`. Preserve nominal guards for mutations, reports, sanctions, and admin-test where no approved distinct capability exists. Remove mixed permanent guards only on converted handlers.

Alternative rejected: map mutations to read capabilities. This broadens privilege and violates least privilege.

### 5. C3-SEC-01 session and affiliation hardening

`sessionGeneration` is the canonical immediate bearer invalidation mechanism. Login and refresh place the current persisted generation in newly issued access tokens; JWT validation resolves the account and rejects a mismatched generation before exposing an authenticated principal. Role changes and account deactivation atomically increment the generation and revoke active refresh sessions. `sessionsInvalidBefore` is retained as compatibility/audit metadata written alongside global invalidation; authorization does not evaluate it because timestamp comparison is vulnerable to same-second issuance ambiguity.

Refresh-token logout remains individual revocation. Refresh rotation uses compare-and-swap over an unrevoked, unexpired session, so a reused or concurrent losing refresh credential cannot mint replacement credentials.

Affiliate deactivation changes only `Affiliate.status` and audit evidence. It does not require a Person/User relation, rewrite software role, assign `Subscription_L1`, revoke a session, or change Person. Loss of institutional eligibility remains a separate approved appointments/access-policy decision; this checkpoint adds no new access grant or removal rule.

JWT validation accepts only HS256 and rejects a missing, non-integer, or non-positive subject before repository resolution. JWT `role` remains compatibility context only: authenticated role and permission codes always come from persistence.

## Risks / Trade-offs

- [V2 persisted permissions lack endpoints] → catalog them as non-routable and deny by default; no controller mapping.
- [Existing users retain legacy community role if migration not applied] → runtime denies ERP for both identifiers; deployment procedure includes verification query.
- [Institutional role naming lacks immutable V2 source] → use only four approved DEC statements; label broader CU mapping `NOT_VERIFIED`.
- [Role admission allows access without affiliation] → only explicitly admitted role names enter ERP; capability checks still protect every operation.
- [Local existing worktree has uncommitted RBAC changes] → implementation uses isolated worktree from `e63266e`; no source worktree changes are touched.

## Migration Plan

1. Deploy source code compatible with both community names and with expanded approved catalog.
2. Apply additive Prisma migration only in an approved disposable or target environment: create canonical community role, validate zero grants, transfer legacy community users, deactivate legacy role.
3. Run idempotent seed to ensure canonical roles, permissions, and approved grants; it must not delete or overwrite unapproved operational grants.
4. Verify roles, assignments, and no community ERP admission using read-only SQL; then deploy guarded controllers and frontend constants as one compatible release.
5. Roll back application code if a guard mapping is wrong. Do not roll back additive role migration by deletion; forward-repair roles/assignments after cause analysis.

## Open Questions

- Immutable V2 CU catalog and authority for all 47 non-legacy codes remain `NOT_VERIFIED`; this does not block catalog recognition or deny-by-default behavior approved here.
