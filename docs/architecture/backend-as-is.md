# Backend AS-IS

## Scope

Baseline captured for Sprint 1 reference architecture work on branch `docs/phase-0-baseline`.

## Stack

- Runtime: Node.js `v24.18.0` in current environment.
- Framework: NestJS 11.
- Language: TypeScript 5.7.
- ORM: Prisma 7 with generated client output at `backend/generated/prisma`.
- Database: PostgreSQL via `@prisma/adapter-pg`.
- Auth: JWT through `@nestjs/jwt` and `passport-jwt`; passwords with `bcrypt`.
- Tests: Jest unit tests and Jest e2e tests.

## Current Module Shape

Backend is a NestJS modular monolith using feature folders directly under `backend/src/`:

```text
backend/src/
├── auth/
├── users/
├── roles/
├── prisma/
├── audit/
├── user-requests/
├── affiliate-requests/
├── affiliates/
├── assemblies/
├── absence-justifications/
├── sanctions/
├── admin-reports/
├── inventory-*/
└── app.module.ts
```

`backend/src/app.module.ts` imports all feature modules directly. No `backend/src/modules/` or layered folder layout exists yet.

## Current Dependency Shape

Current common flow:

```text
HTTP Controller
  ↓
Nest Service
  ↓
PrismaService
  ↓
PostgreSQL
```

Services currently mix application orchestration, business rules, Prisma queries, transactions, audit calls, and HTTP exceptions.

## Prisma Location

- Prisma schema: `backend/prisma/schema.prisma`.
- Prisma config: `backend/prisma.config.ts`.
- Prisma service: `backend/src/prisma/prisma.service.ts`.
- Generated client: `backend/generated/prisma` after `npx prisma generate --config prisma.config.ts`.
- Datasource provider: PostgreSQL.

Core models relevant to Sprint 1:

```text
Role
User
AuditLog
AccountActivationToken
PasswordResetToken
UserRequest
```

## Users Current State

Files:

```text
backend/src/users/
├── dto/
├── users.controller.ts
├── users.module.ts
├── users.service.spec.ts
└── users.service.ts
```

`UsersService` currently owns:

- Prisma `UserWhereInput`, `UserSelect`, transactions, and unique constraint handling.
- Filtering by name, email, identification, status, role, blocked state.
- Pagination.
- Safe user projection and blocked-state derivation.
- User lookup and update.
- Role change.
- Activation/deactivation/unlock.
- Administrator continuity rule.
- Serializable transactions for demotion/deactivation safety.
- Audit logging.
- Nest HTTP exceptions.

Critical rule present:

```text
The last active administrator cannot be deactivated or demoted
```

Risk: this rule is currently private service logic coupled to Prisma transaction client and Nest exceptions.

## Roles Current State

Files:

```text
backend/src/roles/
├── roles.controller.ts
├── roles.module.ts
├── roles.service.spec.ts
└── roles.service.ts
```

`RolesService` directly queries Prisma for active roles:

```text
findActive -> prisma.role.findMany({ where: { isActive: true } })
```

Roles module is small and good candidate to demonstrate minimal Layered Architecture ceremony.

## Auth Current State

Files:

```text
backend/src/auth/
├── account-activation.service.ts
├── account-lockout.policy.ts
├── auth.controller.ts
├── auth.service.ts
├── decorators/
├── dto/
├── guards/
├── interfaces/
├── password-recovery.service.ts
├── password-reset-token-delivery.service.ts
└── strategies/
```

`AuthService.login` current flow:

```text
find user by email with role
 ↓
reject missing / non-ACTIVE / missing passwordHash
 ↓
reject temporary lock
 ↓
reset expired lockout
 ↓
bcrypt.compare password
 ↓
on failure increment attempts and possibly lock account
 ↓
sign JWT
 ↓
reset failedLoginAttempts and lockedAt, update lastLoginAt
 ↓
audit
 ↓
return { accessToken, user }
```

Auth services currently depend directly on:

- `PrismaService`
- `JwtService`
- `bcrypt`
- `AuditService`
- Nest HTTP exceptions

`account-lockout.policy.ts` already contains policy-like logic, but it lives directly under `auth/`, not `domain/policies/`.

## HTTP Contracts To Preserve

Relevant Sprint 1 endpoints:

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

Auth/Users/Roles protected routes use `JwtAuthGuard`; admin routes also use `RolesGuard` with role name `Administrador`.

## Tests Available

- Unit tests under `backend/src/**/*.spec.ts`.
- E2E tests under `backend/test/`.
- Current full backend unit test result: 15 suites passed, 107 tests passed.
- Current e2e result: 11 suites passed, 1 suite failed because `DATABASE_URL` is not configured for `app.e2e-spec.ts`.

## Validation Results

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 4 npm audit vulnerabilities reported: 1 low, 3 high. |
| `npx prisma generate --config prisma.config.ts` | Passed. |
| `npm run build` | Passed. |
| `npm test -- --runInBand` | Passed: 15 suites, 107 tests. |
| `npx prisma validate --config prisma.config.ts` | Passed. |
| `npx eslint "{src,apps,libs,test}/**/*.ts"` | Failed: 221 problems, mainly Prettier formatting and unsafe any lint rules. |
| `npm run test:e2e -- --runInBand` | Failed: `app.e2e-spec.ts` requires `DATABASE_URL`; 11 suites passed, 1 failed. |
| `docker compose config` | Passed. |
| `docker compose up -d postgres` | Failed: Docker CLI exists, Docker daemon pipe unavailable. |

## Pre-Existing Failures

```text
PRE-EXISTING FAILURE: backend lint has 221 issues before Sprint 1 refactor.
PRE-EXISTING FAILURE: backend e2e full suite requires DATABASE_URL for app.e2e-spec.ts.
PRE-EXISTING FAILURE: Docker daemon is not running, so PostgreSQL container cannot start.
PRE-EXISTING RISK: npm audit reports 4 backend vulnerabilities.
```

## Architecture Risks

- Domain concepts are not isolated from Prisma/NestJS yet.
- Users business rules are coupled to `UsersService` and Prisma transaction client.
- Auth login use case is coupled to `AuthService`, `PrismaService`, `JwtService`, `bcrypt`, and audit.
- HTTP exceptions exist inside services rather than Presentation translation.
- No architecture enforcement exists yet.
- Backend lint baseline is red before refactor.
