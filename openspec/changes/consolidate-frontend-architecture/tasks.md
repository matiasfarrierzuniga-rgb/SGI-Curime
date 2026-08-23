## 1. Baseline And Foundation

- [x] 1.1 Confirm Phase 0 artifacts, proposed ADR direction, current branch/worktree scope, and pre-phase validation baseline.
- [x] 1.2 Define `app`, `features`, and `shared` directory responsibilities and record any intentional exceptions.
- [x] 1.3 Create the initial foundation boundaries for app bootstrap, router composition, layouts, shared transport, shared UI, and shared utilities without changing runtime behavior.
- [x] 1.4 Move composition and shared modules in isolated commits, updating imports without mixing product behavior changes.
- [x] 1.5 Verify existing public, authentication, protected, role-restricted, not-found, and deep-link routes after Foundation migration.
- [x] 1.6 Run frontend lint, build/type validation, automated tests, and `git diff --check`; record results and rollback point.

## 2. Auth Vertical Slice

- [x] 2.1 Inventory Auth consumers and establish feature contracts for auth API, types, provider, guards, and pages before moving files.
- [x] 2.2 Move Auth transport and model ownership into the Auth feature while preserving login, restore, logout, activation, recovery, and reset contracts.
- [x] 2.3 Move protected and role route guards behind the Auth feature public API and preserve current authorization outcomes.
- [x] 2.4 Make the Auth provider the sole session-storage mutation owner while retaining current 401 event behavior and provider composition semantics.
- [x] 2.5 Centralize role constants and permission derivation for guards, navigation, cards, and post-login redirects without changing allowed roles.
- [x] 2.6 Expose only documented Auth public exports and update app routing/provider imports to avoid feature-internal paths.
- [x] 2.7 Add or close critical Auth coverage for forgot-password, activation/reset flows, session restoration, unauthorized handling, and post-login routing.
- [x] 2.8 Run Auth smoke checks plus lint, build/type validation, tests, and `git diff --check`; record rollback point and unresolved product defects separately.

## 3. Users Reference Slice

- [x] 3.1 Inventory Users service, models, role lookups, page consumers, and mutation flows; define feature API and cross-feature role contract.
- [x] 3.2 Move Users API and model code into a feature-owned boundary without changing endpoint payloads or error mapping.
- [x] 3.3 Split Users page composition into cohesive filters, table, detail/edit, role, status, and feedback responsibilities only where current behavior remains equivalent.
- [x] 3.4 URL-backed filters/pagination: evaluated and deferred - adopting them changes navigation/back-button behavior, which this behavior-preserving phase forbids; recorded as follow-up.
- [x] 3.5 Measured: ~10 list pages repeat manual fetch/loading/error/invalidation; roles lookup refetched per mount; two validation regimes; form/table libraries would each have a single consumer with no duplication relief.
- [x] 3.6 TanStack Query piloted in Users only (list/detail/mutations + transitional shared roles lookup); invalidation via usersKeys.all after every mutation; app QueryClient defaults retry=1, staleTime 30s, no focus refetch; vitest deps.inline configured.
- [x] 3.7 Zod/TanStack Form/TanStack Table pilots: evaluated and deferred - single consumer each, existing mechanisms pass all gates; adoption criteria recorded for follow-up work.
- [x] 3.8 Add coverage for Users detail/edit, role assignment, status mutations, loading/error states, and dialog/confirmation flows.
- [x] 3.9 Run Users smoke checks plus lint, build/type validation, tests, and `git diff --check`; record rollback point and pilot outcomes.

## 4. Minimal Roles Boundary

- [ ] 4.1 Define Roles catalog types, service contract, and public exports based on existing backend responses and current consumers.
- [ ] 4.2 Move Roles API/model ownership without creating a CRUD page or artificial UI layers.
- [ ] 4.3 Replace direct internal role imports and duplicated literals with the documented Roles/security public contract.
- [ ] 4.4 Test role lookup consumers, permission derivation, navigation visibility, route guards, and post-login redirect behavior.

## 5. Architecture Enforcement

- [ ] 5.1 Write frontend conventions covering naming, ownership, public APIs, dependency direction, shared extraction, state, forms, schemas, and tests.
- [ ] 5.2 Implement an actionable boundary check for forbidden app/shared/feature imports and feature-internal imports.
- [ ] 5.3 Add validation for feature public API usage and document intentional cross-feature contracts.
- [ ] 5.4 Add architecture checks to the frontend verification command set and prepare CI integration without changing unrelated pipelines.
- [ ] 5.5 Validate the migrated Auth, Users, and Roles paths against conventions and fix only boundary violations within this scope.
- [ ] 5.6 Run full lint, build/type validation, automated tests, architecture checks, smoke checks, and `git diff --check`; publish final evidence and rollback guidance.

## 6. Follow-On Governance

- [ ] 6.1 Record remaining Inventory, Affiliates, public-site, token, accessibility, and test gaps as separate follow-on work rather than expanding this migration.
- [ ] 6.2 Document criteria for proposing router, styling, global-state, or broad tooling replacement as separate changes.
- [ ] 6.3 Review the migration retrospective and update architecture rules only through an approved follow-up decision.
