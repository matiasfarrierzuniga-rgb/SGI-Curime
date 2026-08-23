# Frontend AS-IS

This document is the current frontend source of truth. The original horizontal
inventory is retained below as historical baseline evidence; the repository has
since received Foundation/Auth/Users/Roles consolidation in separate commits.
Phase 0 documentation does not authorize additional production moves.

## Scope

Baseline verified on branch `docs/frontend-architecture-phase-0` at closure review.

## Stack

- Framework: React 19.
- Build tool: Vite 8.
- Language: TypeScript 6.
- Router: React Router 7.
- HTTP client: Axios.
- Lint: Oxlint.
- Tests: Vitest + Testing Library + jsdom.

## Current Structure

Historical pre-consolidation structure under `frontend/src/`:

```text
frontend/src/
├── api/
├── auth/
├── components/
├── config/
├── content/
├── layouts/
├── pages/
├── routes/
├── services/
├── test/
├── types/
└── utils/
```

Current source also contains committed boundaries:

```text
frontend/src/
├── app/                 App, layouts, router
├── features/
│   ├── auth/            api, model, routing, ui, public index
│   ├── users/           api, hooks, model, ui, public index
│   └── roles/           api, model, public index
└── shared/              api, config, lib, security, session, ui
```

Legacy roots remain transitional. No new empty feature layers are required.

## Current Dependency Shape

Typical flow:

```text
routes/pages
  ↓
services
  ↓
api/httpClient
  ↓
backend HTTP
```

Auth state lives under `frontend/src/auth/`. API-specific clients live under `frontend/src/services/`. Types live under `frontend/src/types/`.

## Routing Current State

`frontend/src/routes/AppRoutes.tsx` owns public routes, protected app routes, admin routes, and inventory routes.

Relevant Sprint 1 routes:

```text
/login
/register
/activate-account
/forgot-password
/reset-password
/profile
/admin/users
```

Protected admin users route requires role `Administrador` through `RoleRoute`.

## Auth Frontend Current State

Files relevant to auth:

```text
frontend/src/auth/AuthContext.tsx
frontend/src/auth/ProtectedRoute.tsx
frontend/src/auth/RoleRoute.tsx
frontend/src/pages/LoginPage.tsx
frontend/src/pages/ForgotPasswordPage.tsx
frontend/src/pages/TokenPasswordPage.tsx
frontend/src/services/authService.ts
frontend/src/types/auth.ts
frontend/src/utils/sessionStorage.ts
```

`AuthContext` currently:

- Reads/writes session through `sessionStorageService`.
- Calls `authService.login` and `authService.me`.
- Clears session on `auth:unauthorized` event.
- Exposes `user`, `token`, `isAuthenticated`, `isLoading`, `login`, `logout`.

`authService` maps to backend endpoints:

```text
POST  /auth/login
GET   /auth/me
POST  /auth/activate-account
POST  /auth/forgot-password
POST  /auth/reset-password
PATCH /auth/change-password
```

`api/httpClient.ts` injects Bearer token from session storage and clears session on HTTP 401.

## Users Frontend Current State

Files relevant to Users:

```text
frontend/src/pages/admin/UsersPage.tsx
frontend/src/services/usersService.ts
frontend/src/services/rolesService.ts
frontend/src/types/users.ts
frontend/src/pages/admin/UsersPage.test.tsx
```

`UsersPage` currently concentrates:

- data fetching;
- role fetching;
- filters;
- pagination state;
- selected user state;
- modal state;
- edit form state;
- role change;
- activate/deactivate/unlock actions;
- table rendering;
- detail modal rendering;
- toast notifications.

`usersService` maps to backend endpoints:

```text
GET   /users
GET   /users/:id
PATCH /users/:id
PATCH /users/:id/role
PATCH /users/:id/activate
PATCH /users/:id/deactivate
PATCH /users/:id/unlock
```

`rolesService` maps to:

```text
GET /roles
```

## Shared UI Current State

Reusable UI is under `frontend/src/components/`:

```text
ConfirmDialog
ErrorBoundary
Modal
Pagination
StatusMessage
Toast
```

These are candidates for future `shared/ui` if they remain domain-neutral.

## Tests Available

Frontend has 27 passing test files and 101 tests. Tests cover auth context/routes, login/profile/status pages, users page, admin pages, inventory pages, public pages, HTTP client, shared utilities, and boundary-facing components.

## Architecture Baseline Gaps

These IDs describe the pre-consolidation Phase 0 audit, not instructions to
refactor in this change:

| ID | Gap | Current status |
| --- | --- | --- |
| P0-01 | No physical `app/features/shared` boundaries. | Resolved by pre-existing Foundation commits. |
| P0-02 | Auth distributed across horizontal folders. | Auth slice established; legacy consumers remain transitional. |
| P0-03 | `UsersPage` concentrated responsibilities. | Users slice established; remaining complexity is follow-up work. |
| P0-04 | Feature APIs lived in global `services/`. | Auth/Users/Roles APIs moved; other domains remain transitional. |
| P0-05 | Feature types lived in global `types/`. | Reference slices own relevant models; other domains remain transitional. |
| P0-06 | No consistent feature public APIs. | Auth/Users/Roles expose `index.ts`. |
| P0-07 | Dependency rules were not automated. | `check:architecture` and conventions are committed. |

## Validation Results

| Check | Result |
| --- | --- |
| `npm ci` | Passed. |
| `npm run lint` | Passed. |
| `npm run build` | Passed. |
| `npm test -- --run` | Passed: 27 files, 101 tests. |

## Pre-Existing Failures

No frontend validation failure after reinstalling dependencies with `npm ci`.

## Architecture Risks

- No Vertical Slice layout exists yet.
- `AppRoutes.tsx` imports all pages directly from horizontal folders.
- `UsersPage` is too broad for reference architecture; it mixes API, state, mutations, modal orchestration, and UI.
- Feature-specific services and types are global under `services/` and `types/`.
- `shared` boundary does not exist yet.
- Auth provider ownership is undecided: may belong in future `features/auth/model` or app provider composition depending on dependency direction.
