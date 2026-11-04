# SGI RBAC V2 Definitive Consolidation Report

## Status

**IMPLEMENTED.** OpenSpec change `reconcile-rbac-v2-authorization-contract` is complete locally and strict-valid. Migration deployment remains pending approval. V2 immutable CU catalog is **NOT_VERIFIED** locally; no CU identifier is claimed as implementation evidence.

## Decisions implemented

- **DEC-001:** Canonical runtime/frontend catalog contains 93 approved codes: 46 legacy plus 47 reviewed V2. Unknown codes deny. Catalog existence grants nothing; seed role grants remain legacy-only.
- **DEC-002:** ERP admission requires active account and active role. `Administrador` plus five approved ERP V2 roles (`ROLE_SYSTEM_ADMIN` and four institutional roles) are admitted without `Person` or active `Affiliate`. Community and general accounts remain denied.
- **DEC-003:** `ROLE_COMMUNITY_USER` is canonical. Forward-only migration creates it if absent, validates zero canonical grants, moves legacy `Cuenta comunitaria` users, and deactivates legacy role. It preserves users, permissions, sessions and tokens.
- **DEC-004:** Converted only verified read-equivalent endpoints: affiliates, affiliate-request reads, audit, inventory reads/reports. Mutation, sanction, administrative-test and unmapped report guards remain explicit transition exceptions.

## Files and contracts

- Canonical backend policy: `backend/src/auth/presentation/capabilities/capability-policy.ts`.
- ERP admission: `backend/src/auth/domain/policies/internal-access.policy.ts`.
- Community transition: `backend/prisma/migrations/20261103000000_reconcile_rbac_v2_community_role/migration.sql`.
- Seed/registration: `backend/prisma/seed-roles.ts`, `backend/src/user-requests/community-accounts.service.ts`.
- Protected reads: affiliate, affiliate-request, audit, inventory controllers; user/role controllers no longer include redundant `RolesGuard`.
- Frontend alignment: `frontend/src/shared/security/access.ts`, `roles.ts`, `InternalErpRoute.tsx`.

No Prisma schema change. No migration, seed, reset, backfill, or operation ran against primary PostgreSQL.

## Validation evidence

| Check | Result |
| --- | --- |
| `npx prisma validate --config prisma.config.ts` | PASSED |
| Focused backend Jest | PASSED: 5 suites, 58 tests |
| Mock HTTP E2E | PASSED: 2 suites, 35 tests |
| Disposable PostgreSQL integration | PASSED: 1 suite, 6 tests; isolated port 55433 container removed |
| Backend focused ESLint | PASSED |
| `npm run build` backend | PASSED |
| Frontend focused Vitest | PASSED: 4 files, 20 tests |
| Focused frontend Oxlint | PASSED |
| `npm run build` frontend | PASSED; pre-existing chunk-size warning only |
| `openspec validate reconcile-rbac-v2-authorization-contract --strict` | PASSED |
| `git diff --check` | PASSED |

Frontend global lint is **NOT_PASSED** due pre-existing `frontend/src/features/admin-dashboard/ui/AdminDashboard.test.tsx:79:11` duplicate `activityDay`; outside increment scope. The global command also reports pre-existing fast-refresh warnings.

## Safe verification commands

From `backend/`: run Prisma validate, focused Jest paths, focused ESLint paths, `npm run build`, and only the disposable PostgreSQL lifecycle with non-5432 test URL. From `frontend/`: run focused Vitest paths, focused Oxlint paths, and `npm run build`. Do not run seed, migration, reset, or backfill against primary PostgreSQL without approved deployment plan and backup.

## Residual risks and release conditions

1. Apply migration only through approved deployment against backed-up target database; inspect migration status before and after.
2. Existing V2 role-permission assignments remain persistence-managed. No automatic V2 grants were introduced; validate intended grants in deployment data.
3. Transition exceptions still use role guards until approved operation-equivalent capabilities exist.
4. Resolve pre-existing frontend global lint error before declaring repository-wide lint green.
5. Do not archive OpenSpec until migration execution and validation evidence are accepted.
