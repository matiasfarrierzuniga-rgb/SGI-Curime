## Why

The frontend baseline is complete, but its architectural decisions remain proposed and the code is still organized mainly by horizontal technical layers. A controlled consolidation is needed to establish reusable `app`, `features`, and `shared` boundaries while preserving current behavior and keeping each migration reviewable, testable, and reversible.

## What Changes

- Establish an incremental frontend architecture governed by vertical feature slices and lightweight internal layers.
- Define and validate `app`, `features`, and `shared` ownership and dependency-direction rules.
- Migrate a frontend foundation without changing routes, authentication semantics, HTTP contracts, or visual behavior.
- Migrate Auth as the first security/session slice, including a single session owner and public feature API.
- Migrate Users as the reference slice for server state, validation, forms, and tables, adopting new tooling only where evidence justifies it.
- Establish Roles as a minimal catalog and authorization-policy boundary, without inventing a CRUD UI.
- Add architecture conventions, boundary checks, testing conventions, and CI-ready verification gates after the pilot slices prove the pattern.
- Keep Inventory, Affiliates, remaining public modules, broad CSS migration, router replacement, Zustand, and Tailwind outside initial scope.
- Preserve existing runtime behavior and require small commits/PRs with move and behavior changes separated where practical.

## Capabilities

### New Capabilities

- `architecture/frontend-slice-governance`: Defines frontend ownership boundaries, dependency direction, public feature APIs, migration gates, and enforcement expectations for the consolidated architecture.

### Modified Capabilities

- `architecture/baseline-documentation`: Extends the approved baseline from an audited target-state proposal into an incremental consolidation plan, while preserving the existing evidence and Phase 0 scope boundary.

## Impact

- Affects frontend source organization under `frontend/src`, route composition, provider boundaries, authentication/session ownership, role policy consumption, test setup, lint architecture checks, and CI verification.
- May introduce or evaluate TanStack Query, Zod, TanStack Form, and TanStack Table incrementally; React Router, Axios, React, TypeScript, and Vite remain initially.
- Requires coordinated import/path changes during migrations but no intended API or persisted-data contract changes.
- Requires OpenSpec governance artifacts and conventions; implementation remains a later apply phase.
