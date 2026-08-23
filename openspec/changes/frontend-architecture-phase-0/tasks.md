## 0A — Baseline

- [x] Record Git branch, HEAD, remote, staged/unstaged/untracked work, and `git diff --check`.
- [x] Record Node/npm, package scripts/dependencies, OpenSpec schema/precedent, and local frontend skills.
- [x] Run lint, tests, and build; record results and warnings.

## 0B — Structural Inventory

- [x] Classify bootstrap, routing, layout, page, API, auth, UI, utility, style, content, and test areas.
- [x] Demonstrate horizontal domain mixing with files and consumers.
- [x] Record likely target location and movement risk without moving source.

## 0C — Feature Map

- [x] Map routes, pages, services, models, components, validation, state, tests, permissions, and endpoints by feature.
- [x] Classify feature-owned, shared, app-owned, page-composition, and ambiguous code.

## 0D — Dependencies and Hotspots

- [x] Map imports, cross-domain dependencies, authorization spread, duplicated helpers, cycles, and page orchestration.
- [x] Rank hotspots by responsibility, fan-in/out, change frequency, impact, testability, and movement difficulty.

## 0E-0L — Focused Audits

- [x] Inventory router routes, layouts, guards, roles, forbidden and not-found behavior.
- [x] Map auth, session persistence, 401, logout, consumers, and proposed ownership.
- [x] Classify HTTP services and server/session/form/URL/local/derived state.
- [x] Document critical UX flows and design tokens/components.
- [x] Document accessibility, forms/validation, and testing matrix.

## 0M-0O — Target and Governance

- [x] Define proposed target tree, dependency rules, vertical-slice convention, shared policy, and anti-ceremony rules.
- [x] Propose ADR-001 through ADR-008 with unapproved decisions marked Proposed.
- [x] Evaluate Auth, Users, Roles pilot order; create migration roadmap and Azure DevOps-ready backlog.

## Final Validation

- [x] Validate OpenSpec artifacts, re-run required checks as appropriate, inspect Git state, and report scope boundaries.

## Closure Constraints

- [x] Phase 0 remains documentation and validation only.
- [x] No dependency installation, router migration, UI redesign, or production source move is authorized by this change.
- [x] Future Foundation -> Auth -> Users -> Roles order is explicit.
- [x] Validation results are recorded only after commands execute; unchecked gates remain blockers.
