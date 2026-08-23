## Context

The frontend currently bootstraps through `main.tsx`, centralizes all route composition in `routes/AppRoutes.tsx`, and distributes domain services and types across horizontal folders. Public, authentication, administration, and inventory screens are operational, but Auth has dual session-storage writers, role names are repeated, and several pages combine fetching, mutations, validation, and presentation. `frontend-architecture-phase-0` documented these facts and proposed vertical slices, but its ADRs remain proposed.

The design must preserve React 19, TypeScript, Vite, React Router, Axios, current URLs, backend contracts, and runtime behavior while creating a path for independently reviewable feature migrations.

## Goals / Non-Goals

**Goals:**

- Establish `app`, `features`, and `shared` as ownership boundaries without a big-bang rewrite.
- Make feature public APIs and dependency direction reviewable and enforceable.
- Use Auth to validate provider/session boundaries and Users to validate a complete feature pattern.
- Keep Roles small and policy-focused rather than inventing a screen that the product does not have.
- Introduce query, schema, form, or table tooling only through bounded pilots with measurable benefit.
- Provide verification, rollback, and delivery conventions for every migration phase.

**Non-Goals:**

- No immediate source refactor, dependency installation, route-library replacement, CSS rewrite, or state-library replacement.
- No behavior changes to authentication, authorization, HTTP contracts, persisted data, or product workflows.
- No migration of Inventory, Affiliates, or all public screens in the initial reference sequence.
- No claim that a proposed ADR is accepted until an explicit approval and implementation phase exist.

## Decisions

### 1. Use vertical slices with optional internal layers

Features own their API, model, hooks, UI, routing contribution, and public API only when those responsibilities exist. Empty ceremonial folders are forbidden. This preserves cohesion without imposing a fixed template on small features.

Alternative rejected: retain only horizontal folders. It matches the current code but leaves ownership ambiguity and makes domain migrations cross-cutting.

### 2. Keep current router and transport initially

BrowserRouter/declarative Routes and Axios remain in place through Foundation, Auth, Users, and Roles. Routes move toward feature route contributions, but TanStack Router is deferred. The existing HTTP client remains the transport boundary while session ownership is clarified.

Alternative rejected: simultaneous router, HTTP, and folder migration. Too many failure dimensions for a first architectural reference.

### 3. Make AuthProvider the session lifecycle owner

The Auth pilot will preserve current login, restoration, logout, and 401 outcomes while moving storage mutation responsibility behind one owner. The HTTP layer may read a token through a boundary and emit unauthorized events, but it will not become a second session-state owner. Role constants and a permission matrix belong in a shared security boundary consumed by guards, navigation, and redirects.

Alternative rejected: introduce a new global state library first. Existing React context is sufficient for the bounded session state; replacement would expand scope without solving ownership by itself.

### 4. Use Users as reference slice

Users follows Auth because it exercises list fetching, filters, pagination, role lookup, detail/edit flows, status mutations, validation, dialogs, and toast coordination. Server-state tooling, schemas, form tooling, and table tooling are optional pilots inside Users, each introduced separately after baseline behavior is characterized.

Alternative rejected: use Roles as the full reference. Roles currently has no CRUD screen and cannot validate the required UI and server-state patterns.

### 5. Enforce boundaries after patterns stabilize

A lightweight architecture check and conventions document land after Foundation and pilot slices establish real paths. Enforcement checks import direction, forbidden internal imports, and public API usage. It must fail with actionable file and dependency information.

Alternative rejected: enforce a large rule set before the first move. Premature rules would encode assumptions before real migration consumers expose necessary exceptions.

### 6. Deliver phases as reversible PRs

Sequence: Foundation, Auth, Users, Roles, then enforcement. Each phase has a baseline, isolated commits where practical, automated checks, manual smoke checks, and a rollback point. Product fixes discovered during migration become separate work unless required to preserve the architecture contract.

## Risks / Trade-offs

- **[Provider/session regression]** Auth movement can alter initialization or 401 timing → preserve provider order, add lifecycle tests, and keep an explicit rollback commit.
- **[Boundary overengineering]** Too many exports or folders can slow delivery → require named consumers and optional layers; reject abstraction without concrete reuse.
- **[Tooling churn]** Query/Form/Table adoption can create parallel patterns → pilot one consumer at a time and document exit criteria before expanding.
- **[Cross-feature coupling]** Loans and affiliate data cross current boundaries → declare contracts explicitly and defer relocation until both consumers are mapped.
- **[Incomplete safety net]** Password flows and complex mutation paths have test gaps → close critical pilot coverage before declaring Auth or Users migrated.
- **[Visual drift]** Public and private token systems differ → leave broad visual convergence outside structural migration and preserve existing CSS behavior.
- **[Rollback complexity]** Path moves can create noisy diffs → separate moves from behavior changes, validate after each migration unit, and keep PR scope phase-sized.

## Migration Plan

### Foundation boundary notes (recorded during implementation)

- `config/env.ts` moved to `shared/config/env.ts`, not `app/config/` as the Phase 0 paper tree sketched: `shared/api/httpClient` consumes it, and the dependency rules forbid `shared -> app`. This is an intentional, standing exception.
- `@/*` path alias introduced (`tsconfig.app.json` paths + Vite `resolve.alias`) so cross-boundary specifiers stay depth-stable during later migrations.
- `features/` scaffolded with `.gitkeep`; populated by the Auth phase.
- `utils/` directory dissolved entirely (errors, formValidation, sessionStorage all shared-owned).

1. Confirm Phase 0 artifacts and approve the proposed ADR direction.
2. Create Foundation boundaries and move only app-owned, shared, and composition code; run build, lint, tests, route smoke checks, and deep-link checks.
3. Migrate Auth in bounded commits: contracts/service, guards, provider, pages, public API, and session-event ownership; close critical test gaps.
4. Migrate Users as reference slice; measure whether query/schema/form/table pilots reduce concrete duplication before expanding them.
5. Establish minimal Roles contract and central policy consumers without adding a CRUD UI.
6. Add conventions and architecture checks based on observed migrated paths; integrate checks into CI-ready validation.
7. Migrate remaining domains only through separate proposals or explicitly approved follow-on phases.

Rollback for each phase is the last verified pre-phase commit or the preceding feature boundary. No database migration, persisted-data format change, or backend coordination is expected.

## Open Questions

- Which exact CI runner and branch protection configuration will host architecture checks can be decided during enforcement without changing feature contracts.
- Whether Users benefits enough from each TanStack pilot can be decided after baseline measurements; no pilot is mandatory if existing mechanisms satisfy the use case.
