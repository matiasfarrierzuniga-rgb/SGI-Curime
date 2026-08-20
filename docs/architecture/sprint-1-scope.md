# Sprint 1 Scope

## Goal

Establish SGI-Curime official reference architecture using `Users`, `Roles`, and `Auth` as executable examples.

Backend target: Layered Architecture inside existing modular monolith.

Frontend target: Vertical Slices by feature with small internal layers.

## Current Branch

```text
docs/sprint1-architecture-definition
```

ETAPA 0 se completó en `docs/phase-0-baseline` (commit `49505bc`, pushed). La rama de trabajo para ETAPA 1 es `docs/sprint1-architecture-definition`, creada desde ese commit.

Current working tree contains untracked opencode files only:

```text
.agents/
.opencode/
skills-lock.json
```

Do not include those in product commits unless explicitly requested.

## In Scope

- Capture current backend/frontend baseline.
- Define backend layer rules.
- Define frontend slice rules.
- Introduce minimal architecture foundation.
- Migrate Users backend as reference module.
- Migrate Roles backend with minimal ceremony.
- Migrate Auth backend enough to establish Login architecture and ports.
- Create Auth frontend slice.
- Create Users frontend reference slice.
- Keep Roles frontend minimal.
- Add or move tests around migrated responsibilities.
- Add lightweight architecture dependency enforcement.
- Extend CI without replacing it unnecessarily.
- Document reference templates and ADRs after implementation proves them.

## Out Of Scope

Do not implement during Sprint 1:

```text
Affiliates migration
Assemblies migration
Inventory migration
Payments migration
Documents migration

microservices
RabbitMQ
Redis
Event Sourcing
full CQRS
Nx
global generic repository
ORM replacement
full API redesign
full visual redesign
```

## Contracts To Preserve

Backend HTTP contracts relevant to Sprint 1:

```text
POST  /auth/login
POST  /auth/activate-account
POST  /auth/forgot-password
POST  /auth/reset-password
PATCH /auth/change-password
GET   /auth/me
GET   /auth/admin-test

GET   /users
GET   /users/:id
PATCH /users/:id
PATCH /users/:id/role
PATCH /users/:id/activate
PATCH /users/:id/deactivate
PATCH /users/:id/unlock

GET   /roles
```

Preserve:

- routes;
- HTTP methods;
- status codes;
- response shapes;
- authentication;
- authorization;
- audit behavior;
- critical transactions;
- current business rules;
- frontend/backend integration.

## Baseline Validation Summary

Backend:

```text
npm ci                                      PASS
npx prisma generate --config prisma.config.ts PASS
npm run build                              PASS
npm test -- --runInBand                    PASS, 15 suites / 107 tests
npx prisma validate --config prisma.config.ts PASS
npx eslint "{src,apps,libs,test}/**/*.ts" FAIL, 221 issues
```

Frontend:

```text
npm ci                  PASS
npm run lint            PASS
npm run build           PASS
npm test -- --run       PASS, 21 files / 78 tests
```

Docker:

```text
docker compose config       PASS
docker compose up postgres  FAIL, Docker daemon unavailable
```

## Pre-Existing Failures

```text
PRE-EXISTING FAILURE: backend lint red before Sprint 1 refactor.
PRE-EXISTING FAILURE: backend e2e full suite needs DATABASE_URL for app.e2e-spec.ts.
PRE-EXISTING FAILURE: Docker daemon unavailable, PostgreSQL container cannot start.
PRE-EXISTING RISK: backend npm audit reports 4 vulnerabilities.
```

## Stage 1 Proposed Files

Architecture Definition should update/create only documentation first:

```text
docs/architecture/backend-layer-rules.md   ✅ created
docs/architecture/frontend-slice-rules.md  ✅ created
docs/architecture/sprint-1-scope.md        ✅ updated
```

Optional cleanup if team agrees:

```text
docs/architecture/current-state.md
docs/architecture/gap-analysis.md
```

## Stage 1 Expected Commits

Committed so far:

```text
docs(architecture): capture sprint one baseline  (49505bc)
```

Pending for this stage:

```text
docs(architecture): define backend layered rules
docs(architecture): define frontend slice rules
```

No code migration should start before architecture rules are agreed.

## Stage 1 Validation

ETAPA 1 is documentation-only. No backend or frontend code changed.

| Check | Result |
| --- | --- |
| `git status --short --branch` | Clean except untracked opencode files. |
| `git diff --check` | No whitespace errors. |
| Backend/frontend build, lint, tests | Unchanged from baseline (no code touched). |

## Stage 1 Definition of Done

- [x] Backend layered rules documented (`backend-layer-rules.md`).
- [x] Frontend slice rules documented (`frontend-slice-rules.md`).
- [x] Sprint 1 scope updated with ETAPA 0 results and current branch.
- [ ] Rules reviewed and approved by team.
- [ ] Committed to `docs/sprint1-architecture-definition`.

## Backlog Reference (plan section `#75`)

Priority P0 for next stages:

```text
ARCH-03   Dependency rules defined                (this stage)
BE-USR-01 Layered Users structure                 P0
BE-USR-02 User domain model                       P0
BE-USR-03 UserRepository contract                 P0
BE-USR-04 PrismaUserRepository                    P0
BE-USR-05..11 Users use cases                     P0
BE-ROLE-01..03 Roles repository/use case          P0
BE-AUTH-01..04 Auth structure/ports/Login         P0
FE-ARCH-01 app/features/shared                    P0
FE-AUTH-01 Auth slice                             P0
FE-USER-01..03 Users slice                        P0
TEST-01..04 Domain/Application/E2E/frontend tests P0
```

## Stop Conditions

Do not advance to deep migration if:

- backend build fails;
- relevant tests fail beyond documented baseline failures;
- working tree includes uncontrolled product changes;
- HTTP contracts become unclear;
- administrator continuity transaction safety cannot be preserved;
- Docker/database validation is required but unavailable.
