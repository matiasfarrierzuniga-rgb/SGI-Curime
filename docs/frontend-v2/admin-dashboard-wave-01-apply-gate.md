# FE-ADM-V2 — Apply Gate / Wave 01

Status: PREPARED, NOT STARTED. This branch was created from main at `c8676ad934106510c8b4c007bf9b7bc4e61ad87b`.

## Source of truth
- Visual: the SGI-Curime Administrative Dashboard V2 wireframe explicitly approved in conversation. Original binary pending versioning; do not replace it with an approximation.
- Product/implementation proposal: draft PR #116 (`docs/frontend-admin-dashboard-v2-openspec`), containing `explore.md`, `proposal.md`, `design.md`, `tasks.md`.
- Code: the current `main` AdminDashboard, AppHomePage, ErpLayout, shared UI/tokens, and tests; use existing contracts.
- Security: PR #111 / `reconcile-institutional-access-contract-v1` owns the dashboard read capability mismatch. No guard/role migration in this visual wave.

## Wave 01 scope
- Header composition inside Dashboard, institutional welcome with an approved asset or truthful fallback.
- Four KPI cards with real values and period/meaning; keep existing API/hook/query cache.
- Attention Required: visually prioritize authorized real tasks, preserve links and empty/error states.
- Responsive 320/375/768/1024/1280/1366/1440.
- Extend focused component tests and maintain existing accessibility.

## Hard gates before edits
- [ ] Confirm local worktree has no uncommitted or untracked changes that could be overwritten.
- [ ] Inspect current branch status and PR #111 before touching permission behavior.
- [ ] Obtain and version exact approved wireframe binary (or preserve fallback and flag incomplete visual QA).
- [ ] Explicit review/approval of proposal from PR #116.
- [ ] Audit whether KPIs can be disclosed to each authorized actor; do not widen access for aesthetics.

## Out of scope
Calendar source fusion, financial dashboard, public site, role/permission controller changes, migrations, new APIs, simulated activity, charts without denominators, global search or notifications without backend support.

## Definition of Done
No invented metrics. Test loading/empty/error/401/403 and authorized navigation. Run frontend lint, architecture check, tests and build, check diffs, perform browser viewport QA, document evidence and only then open implementation PR as ready.
