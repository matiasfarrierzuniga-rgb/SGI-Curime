# SGI RBAC V2 Safe Integration Report

## Status

**IMPLEMENTED AND CERTIFIED LOCALLY.** No push, merge to `main`, migration, seed, or operation against primary PostgreSQL was performed.

## Recoverable commits

| Purpose | Commit |
| --- | --- |
| Initial branch HEAD | `e63266ea195189f17064a78224654ec35ec05da7` |
| Local-work recovery | `8d54c9d0d57746dc5dc70e90284c5c9ab25f08f3` — `chore(rbac): recover local authorization changes` |
| RBAC V2 integration | `45f0431` — cherry-pick and reconciliation of `e178605cb1c91c273966507b4552c9439f8e8bc8` |
| Stabilization | `7194be9118a1163d2c7fb82486bf3cbac66a7494` — `test(rbac): stabilize reconciled authorization coverage` |

Recovery commit contains all effective local modifications, including explicitly preserved `frontend/pnpm-lock.yaml` and `frontend/pnpm-workspace.yaml`. `git show --name-status 8d54c9d` confirms restoration paths.

## Reconciliation

- **Equivalent:** affiliate/inventory controller authorization changes; retained one semantically equivalent decorator set.
- **Complementary:** guard coverage combines local audit-capability assertions with V2 catalog, canonical role, ERP admission, community-role, migration, frontend, OpenSpec, and PostgreSQL changes.
- **Contradictory:** seed test expected legacy `Cuenta comunitaria`; resolved to OpenSpec canonical `ROLE_COMMUNITY_USER`, with explicit assertion that legacy role is not newly seeded.
- **Local-only retained:** audit E2E/controller tests, extended controller authorization regression coverage, pnpm workspace/lock files.
- **OpenSpec-only integrated:** canonical capability policy, ERP admission policy, community transition migration, account registration resolution, frontend authorization alignment, OpenSpec artifacts, and definitive consolidation report.

Conflict files resolved manually: `affiliates.controller.ts`, `capability.guard.spec.ts`, `controller-capability-contracts.spec.ts`, and `seed-roles.spec.ts`.

## Stabilization

- Canonical catalog, persisted capability evaluation, ERP admission independent of affiliate, canonical community identity, and 401/403 guard behavior verified by focused backend tests.
- Controller metadata regression test updated to assert required guards without treating repeated Nest metadata representation as a semantic authorization change.
- Fixed confirmed frontend lint duplicate: renamed colliding `activityDay` local; assertion now accepts intentional duplicate event rendering.
- Seed mock call payload typed to satisfy focused ESLint.

## Validation

| Command / scope | Result |
| --- | --- |
| `backend: npx prisma validate --config prisma.config.ts` | PASSED |
| Backend RBAC focused Jest | PASSED: 6 suites, 88 tests |
| Backend audit/inventory HTTP E2E | PASSED: 6 suites, 41 tests |
| Backend affiliate/admin, roles, users HTTP E2E | PASSED: 3 suites, 26 tests |
| Disposable PostgreSQL `55433`: migrate + community integration | PASSED: 1 suite, 6 tests; container destroyed |
| Frontend focused Vitest | PASSED: 4 files, 21 tests |
| Backend focused ESLint | PASSED |
| Frontend focused Oxlint | PASSED |
| `backend: npm run build` | PASSED |
| `frontend: npm run build` | PASSED; existing chunk-size warning only |
| `openspec validate reconcile-rbac-v2-authorization-contract --strict` | PASSED |
| `git diff --check` | PASSED |

An initial PostgreSQL test attempt used the generic E2E config, which excludes `*.postgres.integration-spec.ts`; it failed with “No tests found”, destroyed its disposable container, and was rerun successfully with `test/jest-postgres-integration.json`.

## Final branch and main readiness

- Branch: `fix/rbac-v2-finance-entry-access`.
- `origin/main` compared at `cc9394dc3e4e981e884f95ddb626cfdb4803aa3c`; merge-base `36fdf5487bb498662c3385e67824460d08a5e377`.
- Read-only `git merge-tree --write-tree HEAD origin/main` completed with exit `0`: no current textual merge conflict predicted.
- Temporary OpenSpec worktree remains untouched. Source commit `e178605` remains reachable through integrated commit `45f0431` and its original worktree.

## Residual risks

1. Apply migration `20261103000000_reconcile_rbac_v2_community_role` only under approved deployment plan, target confirmation, backup, and post-deploy checks.
2. Existing V2 permission assignments remain deployment-data responsibility; catalog membership grants no permissions automatically.
3. Role-guarded mutation endpoints remain documented transition exceptions until approved operation-equivalent capabilities exist.
4. Immutable V2 CU catalog remains `NOT_VERIFIED` locally; no CU is claimed as proof of implementation.
