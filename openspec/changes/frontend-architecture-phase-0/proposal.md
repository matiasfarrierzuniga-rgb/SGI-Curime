## Why

The frontend has functional coverage across public pages, authentication, administration, and inventory, but its source is organized primarily by technical layer. A verified architecture baseline is needed before any gradual migration to feature-owned vertical slices can begin safely.

## Scope

- Inspect and document the current frontend structure, feature ownership, routes, guards, authentication, HTTP services, state, UX, visual system, accessibility, forms, validation, and tests.
- Define a proposed modular frontend monolith with vertical slices and lightweight internal layers.
- Propose dependency rules, ADRs, a pilot slice, migration roadmap, and small technical backlog items.
- Preserve current behavior, HTTP contracts, authentication, dependencies, routing library, local changes, and backend source.

## Baseline Evidence

- **VERIFIED** Git: `main` tracks `origin/main` at `6e256e3975aab68ef73fe367cb3fa91c77b63d9f`. Thirty-two unstaged modifications exist only under `backend/`; no staged or frontend modifications existed before this change. They are outside this change and preserved.
- **VERIFIED** Tooling: Node `v24.18.0`; npm `11.16.0`; frontend uses React 19, TypeScript, Vite, React Router, Axios, Vitest, Testing Library, and OXLint (`frontend/package.json`).
- **VERIFIED** validation: `npm run lint` PASS; `npm run test -- --run --reporter=verbose --testTimeout=10000 --hookTimeout=10000` PASS, 24 files / 85 tests, with React `act(...)` warnings; `npm run build` PASS. `git diff --check` has no whitespace errors but prints CRLF conversion warnings for pre-existing backend files.
- **VERIFIED** current bootstrap: `frontend/src/main.tsx` composes `BrowserRouter`, `ErrorBoundary`, `ToastProvider`, and `AuthProvider`; `App.tsx` delegates to `AppRoutes`.

## Non-Goals

- No production source refactor, dependency migration, router replacement, HTTP contract change, auth/session behavior change, backend modification, commit, or push.
- No new test suite beyond baseline execution.

## Expected Outcome

Durable OpenSpec artifacts distinguish observed facts from proposed decisions and provide an evidence-backed migration sequence: Auth, Users, then Roles.

## Risks

- Existing backend worktree changes can make global Git output noisy; all new work remains scoped to `openspec/changes/frontend-architecture-phase-0/`.
- Test suite passes with asynchronous `act(...)` warnings; migration work must avoid converting those warnings into behavioral regressions.
- Architecture skill documents a horizontal organization. Its update is deferred; this change will record the gap without editing the skill.
