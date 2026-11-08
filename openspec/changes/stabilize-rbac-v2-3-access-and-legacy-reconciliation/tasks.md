# Tasks

## 1. CP-01 — Consolidate RBAC and Secretariat baseline

- [ ] 1.1 Recheck branch, HEAD, worktree, `origin/main...HEAD`, checkpoints `19988e4`, `de83b65`, `f55f3fc`, `ebfdaaa`, `62dc194`, and protected `.archify/`; verify no switch, worktree, stash, reset, merge, rebase, push or unrelated-file modification occurred.
- [ ] 1.2 Recover existing six-role PostgreSQL evidence without reconstructing roles, record provenance in `acceptance-matrix.md`, and compare capability identities and approved responsibilities against the executable catalog; report counts as observations, verify material drift produces `NO-GO`, and run no sync/seed/data write.
- [ ] 1.3 Reconcile stale numeric Secretariat and total-assignment references in current RBAC planning/contracts while preserving historical evidence; verify no capability or working function is removed solely to satisfy a count.
- [ ] 1.4 Lock existing institutional-board behavior in focused backend/frontend tests for term create/edit and appointment create/edit/replace/revoke, including `401`, `403`, allowed, transaction and audit outcomes; verify production appointment logic recovered at `f55f3fc` is otherwise unchanged.
- [ ] 1.5 Align Affiliate Request and Affiliate guards with exact persisted capabilities, preserving Secretariat list/detail/approve/reject and affiliate read/manage behavior; verify positive Secretariat cases, role-label independence, direct API negatives, duplicate/conflict behavior and audit atomicity.
- [ ] 1.6 Update CP-01 rows in `acceptance-matrix.md` with file/test evidence, scoped diff and application-only rollback; verify unsupported operations are not marked aligned.

## 2. CP-02 — Align navigation and dashboard

- [ ] 2.1 Reconcile `frontend/src/app/navigation/erpNavigation.ts` and `erpNavigation.test.ts` with effective persisted capabilities and approved responsibilities for all six roles; verify no empty groups, no fictional destinations and no new grants.
- [ ] 2.2 Reconcile `frontend/src/app/router/AppRoutes.tsx` and `AppRoutes.test.tsx` with Sidebar policy and backend operation equivalence; verify anonymous login behavior, authenticated `/403`, direct deep links and no protected-content/data-request flash.
- [ ] 2.3 Align Events navigation, `/app/events`, dashboard links and create/review/approve/publish controls with exact event capabilities while preserving `/eventos` public routes; verify each positive operation and related-capability negative against API and UI.
- [ ] 2.4 Align Volunteering navigation and `/app/admin/volunteering` with `vol.opportunities.read` and operation-specific actions while preserving account-independent public `/voluntariado`; verify authorized deep link, denied deep link and public visitor flow.
- [ ] 2.5 Reconcile shared dashboard queries, cards, links and actions with effective capability composition; verify no unauthorized admin-report request occurs and specialized finance/inventory entry remains unchanged.
- [ ] 2.6 Update CP-02 matrix rows with route/action/API evidence, affected frontend files and rollback; verify Sidebar, dashboard, route, button and backend guard agree for each certified operation.

## 3. CP-03 — Retire legacy authorization coupling safely

- [ ] 3.1 Inventory every productive/test reader and writer of `ChangeUserRoleUseCase`, `updateActiveAffiliateRoleForUser`, `Affiliate.legacyRoleId`, `ROLE_CAPABILITIES`, auth/user projections and assembly role snapshots; classify each as authorization, compatibility, historical evidence or fixture in `acceptance-matrix.md`.
- [ ] 3.2 Migrate runtime authorization and current access projections to authoritative persisted `User.role`/`RolePermission` sources; verify mismatched `Affiliate.legacyRoleId`, governance titles and browser claims cannot grant access.
- [ ] 3.3 Replace `ROLE_CAPABILITIES` authorization-shaped test fixtures with production-shaped persisted-permission fixtures where applicable, retaining only documented seed/equivalence uses; verify focused guard, auth and HTTP certification suites still cover `401`, `403` and allow.
- [ ] 3.4 Preserve `AssemblyConvocation` legacy role identifiers/name snapshots and required compatibility reads; verify later user-role changes, inactive/missing role rows and affiliates without legacy role do not rewrite or fabricate history.
- [ ] 3.5 Remove `updateActiveAffiliateRoleForUser` from the role-change transaction only after the matrix proves all required consumers have certified replacements; otherwise retain it explicitly and mark CP-03 partial. Verify authoritative role update, session invalidation and audit remain atomic in either outcome.
- [ ] 3.6 Confirm Prisma schema, columns and historical values remain unchanged, document physical removal as a separate future migration requiring human approval, and update CP-03 matrix/file/rollback evidence.

## 4. CP-04 — Review institutional privilege validity

- [ ] 4.1 Define stable sanitized audit actions/details for privilege-review trigger and decision using existing governance history; verify events identify membership/person/account where available, trigger, actor, decision and rationale without secrets or unnecessary PII.
- [ ] 4.2 Emit or derive review triggers for appointment revoke, replacement, office change and term conclusion without assigning or revoking software roles; verify `Person`, `User`, `Affiliate`, `User.personId` and all `GovernanceMembership` rows remain unchanged except the authorized governance lifecycle transition.
- [ ] 4.3 Expose authorized unresolved/completed review status derived from governance transitions and review audit evidence; verify no linked account, retained access, role-change required and unresolved outcomes.
- [ ] 4.4 Implement the protected privilege-review decision path so a required access reduction invokes the existing role-change contract and session safeguards; verify unauthorized reviewer `403`, independently legitimate access retention and audit-failure behavior.
- [ ] 4.5 Add concurrency/idempotency and failure tests proving appointment history survives a failed access adjustment, duplicate review does not create contradictory outcomes and no governance office is mapped automatically to a software role.
- [ ] 4.6 Update CP-04 matrix rows and checkpoint rollback; verify R1, R2 and R3 are traceable to tests and current contracts.

## 5. CP-05 — Reconcile current and historical documentation

- [x] 5.1 Update root, frontend and backend READMEs only where existing files need current authority pointers; verify no full capability matrix is copied and no absent README is invented solely for this task.
- [x] 5.2 Align root/local AGENTS guidance, `docs/README.md`, canonical identity/RBAC contracts and `docs/modules/institutional-board.md` with approved functional responsibilities, executable catalog, appointment lifecycle, affiliation review and R1–R3; verify instructions do not grant access or replace code contracts.
- [x] 5.3 Mark superseded UserRequest, historical numeric RBAC references and earlier contradictory OpenSpec statements as historical where required while preserving files and task evidence; verify no historical artifact is deleted or falsely marked completed.
- [x] 5.4 Record related CU V2 identifiers only where immutable evidence exists, otherwise mark mapping `NOT_VERIFIED`; verify no CU catalog entry is used as implementation proof.
- [x] 5.5 Reconcile statuses and links among `align-six-role-rbac-v2-access`, `reconcile-institutional-access-contract-v1`, `account-person-linking-v1`, `complete-person-first-identity-ownership-v1`, `reconcile-rbac-v2-authorization-contract` and this successor without archiving them; verify implemented, historical, partial and pending states remain distinct.
- [x] 5.6 Update CP-05 matrix, affected-document list and rollback; verify `acceptance-matrix.md` remains the only complete status matrix.

## 6. CP-06 — Certify and prepare main integration decision

- [ ] 6.1 Inspect package scripts and environment impact before running checks; produce an approved non-destructive command plan and verify no command performs reset, truncate, drop, migration deployment, seed reinitialization, RBAC apply/sync or writes current PostgreSQL.
- [ ] 6.2 Run focused backend unit/controller/HTTP suites for canonical grants, guards, Secretariat, appointments, affiliation, role change, sessions, audit, legacy compatibility and privilege review; record exact commands/counts as `PASSED` or `FAILED`.
- [ ] 6.3 Run focused frontend suites for navigation, routes, dashboard, Events, Volunteering, institutional board, affiliation requests and role-aware actions; verify deep links, no protected-content flash, keyboard semantics and relevant responsive behavior.
- [ ] 6.4 Run applicable non-destructive backend/frontend typecheck, no-fix lint, builds and frontend architecture checks; record generated artifacts/warnings and clean only files created by this change when safe.
- [ ] 6.5 Validate this OpenSpec change strictly, inspect all artifact references and update task/matrix evidence without marking a task complete solely because code exists.
- [ ] 6.6 For any data-affecting certification, request separate human authorization with identified current-development database, backup/recovery plan, exact writes and post-checks; otherwise record it `NOT_EXECUTED` and do not substitute a disposable environment.
- [ ] 6.7 Review `git diff --check`, status, accidental files, secrets, PII, protected `.archify/`, checkpoint preservation and `origin/main...HEAD`; verify no unapproved schema/data operation, privilege expansion, historical deletion or unrelated cleanup entered scope.
- [ ] 6.8 Complete all role/operation matrix rows and issue one evidence-backed `GO` or `NO-GO`; verify `GO` requires every mandatory gate passed, no unexplained baseline drift and accepted residual risks.
- [ ] 6.9 Prepare PR description, checkpoint file lists, test evidence, risks and rollback notes for target `main`; verify no commit, push, merge, rebase or squash occurs without separate authorization.

## Workflow follow-up

- With explicit authorization, create small reversible commits after inspecting each staged checkpoint; preserve existing checkpoint ancestry.
- Open a reviewed Pull Request toward `main` only after CP-06 returns `GO`; never merge automatically.
- Evaluate any development-database reset only as a separate future operation after verification and backup of data that must be preserved.
- Propose physical legacy-column removal as a separate change only after zero-reader/writer certification and approved migration/rollback evidence.
- Archive or sync OpenSpec only through a separate explicitly authorized workflow after implementation and certification are accepted.
