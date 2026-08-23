## Why

The frontend has functional coverage across public pages, authentication, administration, and inventory, but its source is organized primarily by technical layer. A verified architecture baseline is needed before any gradual migration to feature-owned vertical slices can begin safely.

## Scope

- Inspect and document the current frontend structure, feature ownership, routes, guards, authentication, HTTP services, state, UX, visual system, accessibility, forms, validation, and tests.
- Define a proposed modular frontend monolith with vertical slices and lightweight internal layers.
- Propose dependency rules, ADRs, a pilot slice, migration roadmap, and small technical backlog items.
- Preserve current behavior, HTTP contracts, authentication, dependencies, routing library, local changes, and backend source.

## Baseline Evidence

- **VERIFIED** Git at closure review: branch `docs/frontend-architecture-phase-0`, HEAD `2d4cc77`. Thirty-two unstaged modifications exist only under `backend/`; they are outside this change and preserved.
- **VERIFIED** Tooling: Node `v24.18.0`; npm `11.16.0`; frontend uses React 19, TypeScript, Vite, React Router, Axios, Vitest, Testing Library, and OXLint (`frontend/package.json`).
- **VERIFIED** closure validation: `npm run lint` PASS with one non-failing unused-import warning in the existing architecture checker; `npm run test -- --run` PASS, 27 files / 101 tests, with existing React `act(...)` warnings; `npm run build` PASS. `git diff --check` has no whitespace errors but prints CRLF conversion warnings for pre-existing backend files.
- **VERIFIED** current bootstrap: `frontend/src/main.tsx` composes existing providers and `app/App.tsx` delegates routing to `app/router/`. Foundation/Auth/Users/Roles source changes are pre-existing commits, not Phase 0 edits.

## Non-Goals

- No production source refactor, dependency migration, router replacement, HTTP contract change, auth/session behavior change, backend modification, commit, or push.
- No new test suite beyond baseline execution.

## Expected Outcome

Durable OpenSpec artifacts distinguish observed facts from proposed decisions and provide an evidence-backed migration sequence: Auth, Users, then Roles.

## Phase 0 Closure Rule

This change is documentation and validation only. It does not install
dependencies or modify production frontend behavior. Authoritative final
decisions and Definition of Done are recorded in `design.md`.

## Risks

- Existing backend worktree changes can make global Git output noisy; all new work remains scoped to `openspec/changes/frontend-architecture-phase-0/`.
- Test suite passes with asynchronous `act(...)` warnings; migration work must avoid converting those warnings into behavioral regressions.
- Architecture skill documents a horizontal organization. Its update is deferred; this change will record the gap without editing the skill.
