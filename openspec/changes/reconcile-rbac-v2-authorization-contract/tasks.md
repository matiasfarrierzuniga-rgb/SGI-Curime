# Tasks

## 1. Canonical catalog and ERP admission

- [x] 1.1 Create versioned RBAC V2 catalog containing approved legacy/V2 capability codes, role classifications, and documented non-routable codes; verify unit tests accept approved codes and reject unknown/unapproved codes.
- [x] 1.2 Refactor ERP admission to use active account, active role, and approved ERP-admitted role classification independently of Person/Affiliate; verify system admin and institutional fixtures without affiliates, community users, inactive users, blocked users, and inactive roles.
- [x] 1.3 Align `CapabilityGuard` with canonical catalog and server-resolved permissions; verify authenticated missing/unknown/unapproved capabilities receive `403` and unauthenticated requests receive `401`.

## 2. Community identity and persisted compatibility

- [x] 2.1 Add forward-only idempotent Prisma migration creating `ROLE_COMMUNITY_USER`, transferring legacy `Cuenta comunitaria` user assignments safely, and disabling new legacy assignment; verify Prisma schema validation and migration SQL review preserve users, RolePermission rows, tokens, and sessions.
- [x] 2.2 Update role seed policy and community registration resolution to canonical `ROLE_COMMUNITY_USER`; verify seed unit tests keep zero community grants and legacy roles retain their existing grants.
- [x] 2.3 Maintain runtime compatibility for legacy community identity through deployment transition; verify community sessions remain non-ERP and no legacy or V2 user receives automatic new permissions.

## 3. Capability-first endpoint conversion

- [x] 3.1 Convert Affiliate and Affiliate Request list/detail endpoints to their approved persisted read capabilities; verify direct API `401`, `403`, allowed, and no role-name dependence.
- [x] 3.2 Convert audit and inventory read/report endpoints to approved persisted read capabilities; verify technical/treasurer/inventory fixtures receive only documented operations.
- [x] 3.3 Inventory remaining `RolesGuard` endpoints, retain only documented transition exceptions lacking approved capability equivalence, and add controller metadata regression tests.

## 4. Frontend contract alignment

- [x] 4.1 Align frontend access constants, ERP route guards, navigation, and community entry with canonical capability and admission behavior; verify protected deep links deny before data render and community users route outside ERP.
- [x] 4.2 Add frontend tests for technical administrator, institutional roles, treasurer, community user, missing capability, unknown capability, and restored-session behavior using server-delivered permission fixtures.

## 5. Security validation and release evidence

- [x] 5.1 Execute Prisma validate, focused backend unit tests, focused disposable-PostgreSQL E2E tests, backend build, focused ESLint, frontend focused tests, and `git diff --check`; record actual command outcomes.
- [x] 5.2 Produce `SGI_RBAC_V2_DEFINITIVE_CONSOLIDATION_REPORT` with decisions, modified files, correction state, catalog deltas, OpenSpec state, exact test evidence, safe verification commands, and residual risks.
  - [x] 5.3 C3-SEC-01: validate JWT subject and HS256 constraint; verify persisted role/permissions override JWT role claims and stale session generations reject existing bearers.
  - [x] 5.4 C3-SEC-01: preserve atomic role-change/account-deactivation generation increment plus refresh-session revocation; verify refresh rotation and reuse denial with isolated unit tests.
  - [x] 5.5 C3-SEC-01: decouple Affiliate deactivation from software roles, Users, and sessions; verify an Affiliate without a User can deactivate atomically and audit failure rolls back.
  - [ ] 5.6 Human-run database-mutating integration certification remains required before asserting production data/session behavior. No PostgreSQL write was run for C3-SEC-01.

## Workflow follow-up

- Do not archive until approved migration execution and all validation evidence are accepted.
