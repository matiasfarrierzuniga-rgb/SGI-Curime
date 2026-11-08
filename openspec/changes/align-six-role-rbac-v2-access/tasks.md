# Tasks

## 1. Freeze authorized evidence

- [x] 1.1 Activate the APPLY skills listed in `design.md`, read root/frontend/backend instructions plus `docs/architecture/backend-layer-rules.md`, and verify branch `fix/consolidate-canonical-role-catalog`, initial HEAD `871f834`, clean worktree, and comparison with `development`; stop on drift and record actual Git evidence without switching, merging, stashing, or importing work.
- [x] 1.2 Re-run the repository's read-only canonical matrix export only against the reviewed environment, verify active-role counts `16/24/26/12/29/0` and 107 non-null assignments, and stop without editing persistence if any count or code differs.
- [ ] 1.3 Recheck every matrix row against current controllers, guard metadata, business rules, routes, screens and action controls; verify each remains classified `ALIGNED`, `MISALIGNED`, or `UNSUPPORTED` and that no V2/legacy equivalence relies only on naming.

## 2. Correct dashboard backend authorization

- [x] 2.1 Update `backend/src/admin-reports/admin-reports.controller.ts` so `GET /admin-reports/dashboard` requires `erp.dashboard.read` plus capabilities for every protected metric domain it returns, removing nominal-only authorization for that method while leaving unrelated reports unchanged; verify no canonical institutional role with dashboard-only access can retrieve unauthorized metrics.
- [x] 2.2 Update `backend/src/admin-reports/admin-reports.controller.spec.ts` with positive legacy/system-administrator fixtures and negative missing-dashboard/missing-domain capability cases; verify unauthenticated access is `401`, insufficient persisted access is `403`, and the focused Jest suite passes.
- [x] 2.3 Extend `backend/src/auth/presentation/guards/controller-capability-contracts.spec.ts` to lock exact dashboard metadata and assert reviewed V2 codes are not silently attached to legacy operations; verify the focused guard-contract suite passes.

## 3. Align shared route and navigation policy

- [x] 3.1 Update `frontend/src/app/router/AppRoutes.tsx` to protect only ERP profile route `/app/profile` with `usr.profile.read`, preserve authenticated community `/profile`, and remove `/app/roles` placeholder; verify `AppRoutes.test.tsx` covers allowed/denied deep links and no placeholder is presented as functional.
- [x] 3.2 Update `frontend/src/app/navigation/erpNavigation.ts` so Profile visibility and entry fallback match implemented routes while unsupported V2 capabilities create no destination; verify `erpNavigation.test.ts` uses exact fixtures for all six roles, removes empty groups, and preserves personal routes under their independent contracts.
- [x] 3.3 Refine `frontend/src/features/admin-dashboard/ui/AdminDashboard.tsx` and its public export only as needed to reuse approved welcome/shell presentation without exposing administrative metrics; verify `AdminDashboard.test.tsx` proves each query, card, link and action is capability-safe.
- [x] 3.4 Update `frontend/src/pages/erp/AppHomePage.tsx` to compose the shared institutional shell, financial entry, and inventory summary from real authorized data without new role-specific dashboards; verify `AppHomePage.test.tsx` covers the six canonical profiles and asserts unauthorized admin-report requests never occur.

## 4. Gate 01 — Presidency institutional

- [ ] 4.1 Validate Presidency's 16-row fixture through Sidebar, direct routes, dashboard shell, personal assemblies, profile and justifications; verify only implemented legacy/self-service surfaces appear and all unsupported V2 capabilities remain absent.
- [ ] 4.2 Add focused positive tests for `erp.dashboard.read` and `usr.profile.read`, plus negative route/action/API cases for donation approval, event approval, governance, padrón, sanction, restricted document, finance request/report and decommission capabilities; verify no similar legacy capability is accepted as a substitute.

## 5. Gate 02 — Secretariat institutional

- [ ] 5.1 Validate Secretariat's 24-row fixture through Sidebar, direct routes, shared dashboard shell and profile; verify no registry, affiliation, minutes, document, event, venture or volunteering surface appears unless an exact implemented capability exists.
- [ ] 5.2 Add focused positive tests for dashboard/profile and negative cases for every unsupported Secretariat V2 operation, distinguishing create/review/approve/update/publish/sign/certify; verify backend direct requests and frontend deep links default-deny.

## 6. Gate 03 — Treasury institutional

- [ ] 6.1 Validate Treasury's 26-row fixture and preserve financial dashboard, charges, payment recording, movements, DINADECO read and donation CRUD actions exactly according to legacy capabilities; verify Sidebar and direct routes expose no V2-only reconciliation, receipt, period-lock, expense, ledger, CxC or maintenance operation.
- [ ] 6.2 Extend focused financial/donation tests for allowed read/create/update/cancel/payment operations and denied delete, approval, receipt, verification, reversal, reconciliation and period-lock operations; verify calculations and financial services are unchanged.
- [ ] 6.3 Verify Treasury entry selects existing financial composition when both required read capabilities exist and falls back safely for partial fixtures; run focused `FinancialDashboardPage`, `FinancialPage`, `FinancialMovementsPage`, `DinadecoAnnualReportPage`, `DonationsPage`, and navigation tests.

## 7. Gate 04 — Institutional Operator

- [ ] 7.1 Validate Operator's 12-row fixture and preserve read-only inventory dashboard/routes plus profile; verify reservation lifecycle, handover, stall assignment, event proposal, expense request, inventory writes/decommission, loan writes and maintenance remain absent or denied.
- [ ] 7.2 Extend inventory/navigation tests to prove `inv.inventory.read` allows GET/report surfaces but canonical Operator cannot reach legacy role-guarded mutations through `inventory.item.manage` or `inventory.loan.manage`; verify no new dashboard or endpoint mapping is introduced.

## 8. Gate 05 — System Administrator

- [ ] 8.1 Validate System Administrator's 29-row fixture across administrative dashboard, users, account requests, read-only institutional modules, finance, inventory, reservations, audit and volunteering; verify each action follows its split legacy capability rather than broad `system.*` codes.
- [ ] 8.2 Extend user-management tests for read/update/role-change/lifecycle/unlock separation, non-assignable roles, own-account continuity and privilege-escalation denial; verify direct API negatives remain `403` and frontend actions match backend capabilities.
- [ ] 8.3 Verify `usr.roles.read` retains its backend read contract while `/app/roles` no longer presents a placeholder, and verify `system.audit.read`, `system.identity.manage`, `system.maintenance.operate`, and `system.rbac.manage` expose no substituted route or operation.

## 9. Gate 06 — Community User

- [ ] 9.1 Validate the zero-assignment Community User fixture through ERP admission, Sidebar absence, `/mi-comunidad`, community profile/services, public volunteering and direct institutional API requests; verify ERP and institutional endpoints deny without granting any capability.
- [ ] 9.2 Extend `InternalErpRoute.test.tsx` and relevant community route tests for restored sessions, direct `/app/*`, `/inventory/*`, `/admin/*`, no protected-content flash, and preserved public volunteering without account; verify all focused tests pass.

## 10. Cross-role verification and integration decision

- [x] 10.1 Run focused backend controller/guard suites, then backend build and non-mutating focused lint commands; record exact commands/results as `PASSED`, `FAILED`, or `NOT_EXECUTED` and do not run seeds, migrations, resets, backfills, PostgreSQL-mutating tests, or lint commands that apply fixes.
- [ ] 10.2 Run focused frontend tests for routes, navigation, dashboards and affected screens, then `npm run verify` under repository test policy; validate keyboard/focus/semantics and `320/375/768/1024/1440` layouts, recording pre-existing failures separately without fixing unrelated debt.
- [ ] 10.3 Inspect final diff against `development` and checkpoint evidence; verify no changes under `backend/prisma/**`, no grant/catalog expansion, no identity/affiliation/accounting changes, no fictional data, no unsupported V2 route, and no unrelated source file.
- [ ] 10.4 Produce final execution evidence in the delivery response: updated 107-row status summary, corrected access, reused screens, unsupported capabilities, tests/results, modified files, regression risks and rollback command/commit reference; verify no capability is marked functional when its route returns `403` or its operation is absent.
- [ ] 10.5 Declare GO only if all six role gates, negative authorization cases, builds, focused checks and scope review pass; otherwise declare NO-GO with blockers and leave integration to `development` untouched.

## Workflow follow-up

- After human review accepts a GO result, create one implementation commit only if explicitly authorized; inspect staged diff first and do not push.
- Open a reviewed Pull Request toward `development` or the repository's then-authorized integration target; never merge automatically.
- Archive or sync this OpenSpec change only through a separate explicitly requested workflow after implementation evidence is accepted.
