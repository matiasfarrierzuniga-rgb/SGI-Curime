# SGI PR #136 — Pre-Merge Certification Report

## Decision

**BLOCKED.** Local RBAC V2 quality gates pass, including representative disposable-PostgreSQL migration certification. PR #136 remains Draft, its remote HEAD is still `373d9e7`, and the verified navigation-test correction `06f30a6` is local and unpushed. GitHub Actions has no workflow runs for the remote HEAD; branch-protection requirements cannot be read without authenticated GitHub access.

## Git and GitHub state

- Local branch: `fix/rbac-v2-finance-entry-access`.
- Initial certified remote PR HEAD: `373d9e76483a4a181a382265e13e1ed546273c5a`; local branch matched it before certification.
- Local correction after certification: `06f30a6a3f08ac8ae8640333d6b870cd88e3fa33` (`test(navigation): align finance entry capability paths`). It is not pushed.
- PR #136: open, Draft, base `development`, head `fix/rbac-v2-finance-entry-access`, API `mergeable: true`, `mergeable_state: clean`, 43 changed files, 6 remote commits.
- `origin/development`: `e93a402162b2585e5dccb8b5127fc12eb4b43e82`; it is direct merge-base of remote RBAC head.
- `git merge-tree --write-tree HEAD origin/development`: exit `0`; no textual conflict predicted.
- Remote checks on `373d9e7`: Vercel deployment/status **success**. GitHub Actions API returned zero workflow runs. Public reviews endpoint returned none; requested reviewers endpoint returned none.
- Branch-protection endpoint returned `401`; protection/rulesets are **NOT_VERIFIED** because `gh` is unauthenticated. No inference made about required approvals/checks.

## Compatibility with development

The PR is a descendant of `development`; no commits are exclusive to `development` after merge-base. Files changed cover Prisma migration/seed, auth policy/guard/catalog, affiliate and inventory read guards, audit, users/roles, community registration resolution, frontend capability/routing/navigation compatibility, lockfiles, OpenSpec, and reports. Read-only merge-tree found no textual conflict.

Functional overlap reviewed:

- ERP admission remains account/role-state based and allows `Administrador` plus admitted V2 roles without Person/Affiliate.
- Canonical community role and legacy compatibility remain separate from ERP access.
- Capability guard evaluates persisted, catalog-approved codes; frontend is only a visibility/routing layer.
- Read-equivalent affiliate, audit and inventory endpoints use capabilities; mutation exceptions retain role guards.
- Financial entry-path expectations now match actual protected routes: `fin.movements.read` enters movements; `fin.charges.read` enters financial dashboard.

## Disposable PostgreSQL migration certification

Environment: Docker-owned ephemeral PostgreSQL on `127.0.0.1:55433`, tmpfs data, `NODE_ENV=test`, lifecycle guard enabled. No primary PostgreSQL connection, migration, seed, cleanup, account creation, or data modification occurred.

Migration `20261103000000_reconcile_rbac_v2_community_role` was applied by `prisma migrate deploy`, then exercised through a dedicated temporary fixture:

1. Existing zero-grant `ROLE_COMMUNITY_USER`, legacy `Cuenta comunitaria`, V2 `ROLE_SYSTEM_ADMIN`, distinct permissions/RolePermission rows, legacy community user with `Person`, `Session`, and `AccountActivationToken` were created.
2. Raw migration execution reassigned legacy user to canonical role, preserved Person/session/token and legacy/V2 permission relations, and deactivated legacy role.
3. Re-execution of SQL completed without changing already-transitioned state. This proves SQL state idempotence; Prisma migration history still prevents normal `migrate deploy` re-registration/re-execution.
4. Adding a canonical-role permission caused declared failure `ROLE_COMMUNITY_USER must have zero permissions before transition`; enclosing transaction rolled back. Legacy user assignment and legacy role activation remained unchanged.
5. Container was destroyed after each attempt. A first temporary-script module-resolution failure happened before fixture SQL and its container was also destroyed; corrected rerun passed.

### Recovery / restoration procedure

Before production deployment: take verified logical backup and restore test, record `prisma migrate status`, and run preflight query confirming `ROLE_COMMUNITY_USER` has zero `RolePermission` rows. If migration errors before commit, PostgreSQL transaction rollback preserves source assignments. If already committed, do **not** reactivate or remap roles manually: retain compatibility deployment code, restore approved backup only through change control, or implement an explicitly reviewed forward repair after reconciling users, sessions, tokens, RolePermission data and audit evidence. Validate migration status and sampled role/user counts after recovery.

## Validation evidence

| Scope | Result |
| --- | --- |
| Prisma schema validate | PASSED |
| OpenSpec strict | PASSED |
| Backend RBAC/unit | PASSED: 6 suites, 88 tests |
| HTTP E2E audit, inventory, admin/affiliate, roles, users | PASSED: 9 suites, 67 tests |
| PostgreSQL lifecycle guard | PASSED: 2 tests |
| PostgreSQL community integration | Previously revalidated at `373d9e7`: PASSED, 6 tests; disposable container removed |
| Dedicated migration fixture | PASSED: transition, preservation, rerun, forbidden-grant rollback |
| Frontend security/routing/navigation | PASSED: 5 files, 32 tests |
| Backend focused ESLint | PASSED |
| Frontend focused Oxlint | PASSED |
| Backend build | PASSED |
| Frontend build | PASSED; existing chunk-size warning only |
| `git diff --check` and development merge-tree | PASSED |

## Defects found and corrected

`frontend/src/app/navigation/erpNavigation.test.ts` contained two incorrect expected paths introduced with finance-entry coverage. Actual capability routing was correct and route-protected. Corrected test assertions and reran frontend tests, Oxlint and build. Commit: `06f30a6`.

## Security certification

- **IMPLEMENTED/TESTED:** active account and active role required for ERP; inactive/blocked contexts denied by policy tests.
- **IMPLEMENTED/TESTED:** V2 technical and institutional fixture roles remain least-privileged; canonical and unapproved capability cases deny without persisted approved grants.
- **IMPLEMENTED/TESTED:** canonical and legacy community accounts deny ERP; canonical community role has zero migration-required grants.
- **IMPLEMENTED/TESTED:** protected controller metadata and capability guard cover persisted authorization; HTTP tests cover relevant direct access behavior.
- **COMPATIBILITY VERIFIED:** activation/community integration tests preserve minimal community access and no automatic ERP grants.
- V2 CU catalog remains **NOT_VERIFIED** locally; no CU claim is treated as implementation proof.

## Remaining blockers and next gate

1. Push `06f30a6` and this report only after maintainer approval of these changes; then re-check remote SHA and CI.
2. Mark PR #136 ready for review; it is currently Draft.
3. Obtain required human approval(s) and branch-protection/ruleset confirmation using authenticated repository access.
4. Obtain CI applicable to new remote SHA. Current remote evidence is Vercel success only; Actions has no runs.
5. Production migration still requires approved deployment plan, restorable backup, target confirmation, preflight zero-grant check, and post-deploy verification.

No merge, rebase, cherry-pick, push, primary-PostgreSQL operation, OpenSpec archive, account provisioning, or worktree deletion was performed.
