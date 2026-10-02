# SGI-Curime Copilot Instructions

## Scope and sources of truth

Work only within the requested scope. Do not introduce unrelated cleanup, refactors, dependencies, features, or architectural changes.

Before changing code, inspect the relevant existing implementation and reuse established repository patterns.

Do not invent backend endpoints, fields, domain states, capabilities, permissions, routes, or business rules. Existing code and repository contracts are authoritative.

## Architecture

SGI-Curime has a stable V1 architecture. Preserve existing frontend/backend contracts and feature boundaries unless the task explicitly requires a structural change.

The canonical identity model is:

- `Person` represents the person and is the canonical identity.

- `User` represents authenticated system access and is optional relative to `Person`.

- `Affiliate` represents institutional affiliation and is distinct from authenticated access.

Do not collapse these concepts or assume that every Person or Affiliate requires a User.

Authorization must use the repository's existing permission/capability contracts. Do not introduce authorization decisions based only on role names when an existing permission or capability contract applies.

Keep public-site behavior and authenticated ERP behavior clearly separated.

## Database and Prisma

The V1 relational model is consolidated.

Do not modify the Prisma schema, create migrations, or alter persistent relationships merely to simplify frontend or implementation work.

Database-model changes require explicit task scope and concrete functional evidence.

## Frontend

Preserve the established `app -> features -> shared` architecture and the dependency rules documented in `frontend/CONVENTIONS.md`.

Do not add new code to legacy frontend roots unless the task explicitly qualifies for an existing documented exception.

Reuse existing shared UI primitives, design tokens, feature APIs, hooks, and patterns when they fit the requirement.

Do not duplicate server state outside the established TanStack Query ownership model.

## Changes and review discipline

Prefer the smallest coherent change that fully solves the requested problem.

Do not expand scope to fix unrelated debt discovered during implementation or review. Report unrelated findings separately.

Treat cosmetic polish as non-blocking unless it causes a concrete functional, accessibility, responsive, or contract regression.

Pay particular attention to:

- authentication and authorization behavior;

- identity boundaries between Person, User, and Affiliate;

- API and frontend/backend contract changes;

- routing and protected-route behavior;

- unexpected Prisma or migration changes;

- regressions in existing behavior;

- unnecessary duplication;

- missing or inadequate tests for changed behavior;

- security or data-loss risks.

Findings should identify concrete evidence and impact rather than speculative or purely stylistic concerns.

## Validation

Use the repository's existing verification mechanisms appropriate to the changed scope.

For frontend changes, `npm run verify` is the primary consolidated verification command.

For backend changes, use the applicable build, unit, and integration/e2e checks documented by the repository and PR template.

Always distinguish between checks that were actually executed and checks that were only recommended.

Never claim that a test, build, runtime behavior, or CI check passed without evidence from an actual execution.

Repository instructions and Copilot output are guidance, not merge authority. Final acceptance depends on repository contracts, executable evidence, CI, and human review when required.
