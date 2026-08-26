# ERP-F0-03: Sprint 1 Authorization Profile

**Status:** Accepted for the Sprint 1 frontend implementation scope
**Contract:** `ERP_F0_03_SPRINT1_CONTRACT=ACCEPTED`
**Version:** 1.0
**Date:** 2026-08-26

## 1. Purpose

This document is the governing authorization profile for Sprint 1. It defines
the smallest accepted role and capability vocabulary that a later frontend
implementation may project into `AccessContext`, `RoleRoute`, `AppRoutes`,
`erpNavigation`, and the minimum ERP shell.

It does not implement authorization and does not replace backend enforcement.

## 2. Sprint scope

Sprint 1 covers:

- authentication and authenticated session access;
- the user's own profile;
- MOD-USR access foundations: users, account requests, activations, roles,
  permissions, and security administration;
- MOD-ADM Core: affiliate records and affiliate requests;
- the minimum protected ERP entry and denial experience.

The scope is intentionally limited to capabilities with a direct Sprint 1
consumer. Screens and operations not listed here remain outside the
implementation gate.

## 3. Definitions

- **Technical role:** the role string currently delivered by the session.
- **Canonical capability:** a stable permission identifier owned by this
  contract.
- **Access requirement:** either `authenticated`, one capability, or an
  explicitly declared `ANY` or `ALL` set of capabilities.
- **Scope:** the resource boundary attached to a grant. Sprint 1 defines only
  `SELF` for profile ownership.
- **Projection:** frontend UX used for navigation visibility, route UX, and
  protected controls.

## 4. Roles

| Role | Current code evidence | Sprint consumer | Status |
| --- | --- | --- | --- |
| `Administrador` | `ROLE_ADMIN` in `frontend/src/shared/security/roles.ts`; backend auth roles guard | MOD-USR and MOD-ADM Core | ACCEPTED |
| `Gestor de Inventario` | `ROLE_INVENTORY_MANAGER` in `frontend/src/shared/security/roles.ts` | Existing inventory only; excluded from this contract's implementation scope | DEFERRED |
| Authenticated user | `AuthContext.isAuthenticated` and `AuthenticatedUser` | Portal entry and own profile | ACCEPTED |
| `Secretaría` | No role constant, session mapping, or backend evidence found | None confirmed | TBD_NON_BLOCKING |

`Secretaría` cannot be granted capabilities until a canonical role mapping and
an actual Sprint consumer are approved. It is not a prerequisite for the
accepted Administrator and authenticated-user paths.

## 5. MOD-USR capabilities

| Capability | Description | Actor | Frontend consumer | Backend support | Required | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `usr.users.read` | View users in the access administration area | `Administrador` | Users entry and protected route | Users domain exists in the repository; operation contract requires confirmation | YES | ACCEPTED |
| `usr.users.create` | Create a user | `Administrador` | Deferred until user form exists | No confirmed Sprint 1 consumer | NO | TBD_NON_BLOCKING |
| `usr.users.update` | Update user data | `Administrador` | Deferred until user form exists | No confirmed Sprint 1 consumer | NO | TBD_NON_BLOCKING |
| `usr.users.enable` | Enable a user account | `Administrador` | Deferred until account action exists | Activation domain exists; exact operation mapping requires confirmation | NO | TBD_NON_BLOCKING |
| `usr.users.disable` | Disable a user account | `Administrador` | Deferred until account action exists | Exact operation mapping requires confirmation | NO | TBD_NON_BLOCKING |
| `usr.roles.read` | View role definitions | `Administrador` | Roles entry when implemented | Roles domain is referenced by current frontend policy; endpoint mapping requires confirmation | YES | ACCEPTED |
| `usr.roles.assign` | Assign a role to a user | `Administrador` | Deferred until assignment action exists | Exact endpoint and audit behavior require confirmation | NO | TBD_NON_BLOCKING |
| `usr.profile.read` | Read the signed-in user's profile | Authenticated user | Profile route | Authenticated session and profile page exist | YES | ACCEPTED |
| `usr.profile.update` | Update the signed-in user's profile | Authenticated user | Deferred until editable profile flow exists | Exact backend operation requires confirmation | NO | TBD_NON_BLOCKING |

`usr.audit.read` is deferred. The repository has audit infrastructure, but no
Sprint 1 consumer is accepted for this capability.

## 6. MOD-ADM Core capabilities

| Capability | Description | Actor | Frontend consumer | Backend support | Required | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `adm.affiliates.read` | View affiliate records | `Administrador` | MOD-ADM Core entry | `backend/src/affiliates` exists | YES | ACCEPTED |
| `adm.affiliates.create` | Create an affiliate record | `Administrador` | Deferred until affiliate form exists | Affiliate domain exists; exact create contract requires confirmation | NO | TBD_NON_BLOCKING |
| `adm.affiliates.update` | Update an affiliate record | `Administrador` | Deferred until affiliate form exists | `backend/src/affiliates` includes update DTO evidence | NO | TBD_NON_BLOCKING |
| `adm.requests.read` | View affiliate requests | `Administrador` | Requests entry | `backend/src/affiliate-requests` exists | YES | ACCEPTED |
| `adm.requests.review` | Review an affiliate request | `Administrador` | Deferred until review UI exists | Review DTO/service evidence exists; exact transition vocabulary requires confirmation | NO | TBD_NON_BLOCKING |
| `adm.requests.resolve` | Resolve an affiliate request according to the accepted backend state transition | `Administrador` | Deferred until resolution UI exists | Backend review flow exists; final public transition names require confirmation | NO | TBD_NON_BLOCKING |

The terms `review` and `resolve` are capability names, not claims that the
backend must expose `approve` or `reject`. The backend state transition remains
the source of truth.

## 7. Role x Capability matrix

| Role | Module | Capability | Access | Status | Evidence | Sprint blocking |
| --- | --- | --- | --- | --- | --- | --- |
| `Administrador` | MOD-USR | `usr.users.read` | ALLOW | ACCEPTED | Current admin role and users feature | YES |
| `Administrador` | MOD-USR | `usr.roles.read` | ALLOW | ACCEPTED | Current admin role and roles policy surface | YES |
| `Administrador` | MOD-USR | `usr.profile.read` | ALLOW | ACCEPTED | Authenticated profile route | YES |
| Authenticated user | MOD-USR | `usr.profile.read` | ALLOW, `SELF` | ACCEPTED | Authenticated session and profile route | YES |
| `Administrador` | MOD-ADM | `adm.affiliates.read` | ALLOW | ACCEPTED | Backend affiliates domain | YES |
| `Administrador` | MOD-ADM | `adm.requests.read` | ALLOW | ACCEPTED | Backend affiliate-requests domain | YES |
| Any other role | Any Sprint module | Any privileged capability | DENY | ACCEPTED | Default-deny policy | YES |

Capabilities marked `TBD_NON_BLOCKING` are not grants in this matrix and must
not be exposed by a later implementation until their consumer and backend
contract are confirmed.

## 8. Unknown-role policy

`UNKNOWN_ROLE` maps to no privileged capabilities and no protected scopes.
Authentication alone permits only the authenticated-user experience and the
own-profile capability where the session identity is available. The frontend
must fail closed for every administrative requirement.

## 9. Unknown-capability policy

`UNKNOWN_CAPABILITY` always denies access. A missing catalog entry, misspelled
identifier, or capability outside the accepted implementation scope must not
be treated as authenticated access.

## 10. ANY and ALL semantics

Sprint 1 requires only single-capability requirements and
`authenticated`. No accepted Sprint 1 consumer currently requires a compound
requirement, so `ANY` and `ALL` are deferred rather than inferred.

If a later accepted requirement introduces them, the contract must define:

- `ANY`: at least one listed capability is granted;
- `ALL`: every listed capability is granted.

That later decision is outside this gate.

## 11. Scope semantics

Sprint 1 defines one scope: `SELF`. It applies only to
`usr.profile.read` and means the authenticated subject's own profile. The
frontend may use the session identity for UX decisions, but the backend must
verify ownership on every read or mutation.

Resource scopes such as `OWN`, `ASSIGNED`, organization boundaries, and
record-level affiliate restrictions are deferred. The frontend must not
simulate them without authoritative resource context.

## 12. Backend authority boundary

Frontend authorization is a UX, navigation, and routing projection. A hidden
link or denied frontend route is not a security boundary. The backend remains
authoritative through authentication, role guards, domain policies, resource
ownership checks, and audit rules. Frontend code must not invent backend
claims, bypass API responses, or grant an operation because its menu entry is
visible.

## 13. TBD blocking

No blocking TBD remains within the accepted Sprint 1 contract. The following
conditions were resolved by scope:

- accepted actors are limited to the evidenced Administrator role and
  authenticated users;
- Sprint 1 uses default deny and one explicit `SELF` profile scope;
- compound `ANY`/`ALL` requirements are not needed by an accepted consumer.

## 14. TBD non-blocking

- canonical `Secretaría` role mapping;
- granular create, update, enable, disable, and assign operations;
- exact backend transition names for affiliate request resolution;
- backend claims beyond the current role and session identity;
- detailed profile mutation contract.

These items must be resolved before their respective UI actions are
implemented, but do not close the Sprint 1 authorization foundation gate.

## 15. Future

- complete MOD-ADM capabilities for assemblies, attendance, justifications,
  sanctions, agreements, and minutes;
- advanced inventory capabilities;
- MOD-REP, MOD-FIN, MOD-RES, and other future module vocabularies;
- additional canonical roles, including `Secretaría`, once evidenced;
- compound requirements and richer scopes.

## 16. Deferred

- `usr.audit.read` and audit-specific frontend consumers;
- `SELF` scopes for non-profile resources;
- ABAC, segregation of duties, organization scopes, and resource-level UI
  policy simulation;
- final frontend implementation of any capability marked TBD.

## 17. Implementation gate

```text
ERP_F0_03_SPRINT1_CONTRACT=ACCEPTED
MOD_USR_SCOPE=ACCEPTED
MOD_ADM_CORE_SCOPE=ACCEPTED
SPRINT1_ROLES=ACCEPTED
SPRINT1_CAPABILITIES=ACCEPTED
SPRINT1_ROLE_CAPABILITY_MAPPING=ACCEPTED
UNKNOWN_ROLE_POLICY=ACCEPTED
UNKNOWN_CAPABILITY_POLICY=ACCEPTED
BACKEND_AUTHORITY_BOUNDARY=ACCEPTED
FUTURE_ROLES=NON_BLOCKING
FUTURE_CAPABILITIES=NON_BLOCKING
DEFERRED_MODULES=NON_BLOCKING
AUTHORIZATION_IMPLEMENTATION_GATE=OPEN
```

The gate opens only for BATCH 2 implementation of the accepted projection.
It does not authorize changes to this document's out-of-scope capabilities.

## 18. Traceability

| Contract area | Repository evidence |
| --- | --- |
| Technical roles and current policy | `frontend/src/shared/security/roles.ts` |
| Authentication and session identity | `frontend/src/features/auth/model/AuthContext.tsx` and `frontend/src/features/auth/model/auth.types.ts` |
| Existing profile route | `frontend/src/app/router/AppRoutes.tsx` and `frontend/src/pages/ProfilePage.tsx` |
| MOD-USR backend boundary | `backend/src/auth`, `backend/src/user-requests`, and related auth guards |
| MOD-ADM affiliate records | `backend/src/affiliates` |
| MOD-ADM affiliate requests | `backend/src/affiliate-requests` |
| Prior F0 functional inventory | `docs/architecture/erp-f0-01.md` and `docs/architecture/erp-f0-baseline.md` in the quarantined reference material |

The last two F0 documents were used as reference from the quarantine stash;
this contract is the only artifact being versioned in this batch.