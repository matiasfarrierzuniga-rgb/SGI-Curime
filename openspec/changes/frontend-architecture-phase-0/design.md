## Status Legend

- **VERIFIED**: source, consumer, test, Git metadata, or command establishes fact.
- **INFERRED**: evidence supports conclusion but does not fully prove it.
- **PROPOSED**: target decision needing approval.
- **PENDING**: evidence or approval still missing.

## Current Baseline

### 0A — Verified

- Git: `main` tracks `origin/main`, HEAD `6e256e3975aab68ef73fe367cb3fa91c77b63d9f`. Thirty-two unstaged backend modifications predate this change. No staged files and no frontend modifications existed before OpenSpec change creation.
- Toolchain: Node `v24.18.0`, npm `11.16.0`. `frontend/package.json` declares React 19, TypeScript, Vite, React Router 7, Axios, Vitest, Testing Library, and OXLint.
- Validation: lint PASS; build PASS; tests PASS (24 files, 85 tests). Tests emit non-failing React `act(...)` warnings in AffiliationPage, AuthContext, and RegisterPage tests. `git diff --check` has no whitespace errors; it reports CRLF conversion warnings for pre-existing backend files.
- Bootstrap: `main.tsx` orders `BrowserRouter > ErrorBoundary > ToastProvider > AuthProvider > App`; `App.tsx` delegates to `AppRoutes`.
- OpenSpec: `openspec/config.yaml` uses `spec-driven`; archived `2026-08-14-establish-phase-0-baseline` uses proposal, specs, design, and tasks. Existing architecture skill recommends horizontal folders, creating a documented target-state gap; skill remains unchanged.

### 0B — Structural Inventory

**VERIFIED** `src/` has global bootstrap/routing/layout/auth/API/config/style folders alongside horizontal `pages`, `services`, `types`, `components`, and `utils`.

| Area | Observed responsibility | Evidence | Proposed destination | Movement risk |
|---|---|---|---|---|
| Bootstrap | Router and provider composition | `main.tsx`, `App.tsx` | `app/` | High: provider order |
| Routing | Central routes, guards, layouts, pages | `routes/AppRoutes.tsx` | `app/router/` | High: URLs and access |
| Session/auth | Context, storage, guards, API | `auth/`, `services/authService.ts`, `utils/sessionStorage.ts` | `features/auth/` plus provider boundary | High |
| HTTP/config | Axios, Bearer header, 401 event, env | `api/httpClient.ts`, `config/env.ts` | `shared/api`, `app/config` | High: session interceptor |
| Shared UI | Modal, toast, pagination, messages, confirmation | `components/*.tsx` | `shared/ui` after reuse verification | Medium |
| Public portal | Layout, content, public components/pages | `layouts/PublicLayout.tsx`, `content/`, `components/public/`, `pages/public/` | `features/public/` | High: `PublicPages.tsx` contains many screens |
| Admin | Users, requests, audit pages | `pages/admin/` | feature-owned pages | High: `UsersPage.tsx` |
| Inventory | Dashboard, CRUD, alerts, reports, types/services | `pages/inventory/`, `services/inventory*.ts`, `types/inventory.ts` | `features/inventory/` subareas | High: items/loans operations |
| Styles | All product areas in one global CSS | `index.css` | `app/styles` plus feature styles later | High |

### Horizontal Evidence

- `services/` contains auth, users/roles, account requests, affiliations, audit, public content, and inventory endpoints.
- `types/` contains common API, auth, users, requests, audit, affiliation, and inventory models; `types/inventory.ts` also defines affiliate query/options.
- `components/` mixes reusable controls with `public/PublicComponents.tsx`, which imports public content and auth.
- `utils/` mixes generic error mapping, session persistence, and person/contact validation.
- `pages/` contains auth, profile, status, public, admin, and inventory screens.

## Preliminary Hotspots

| ID | Status | Area | Evidence | Impact |
|---|---|---|---|---|
| FE-ARCH-001 | VERIFIED | Routing | `routes/AppRoutes.tsx` composes all pages/layouts/guards | URL and authorization regression risk |
| FE-ARCH-002 | VERIFIED | Auth provider | `auth/AuthContext.tsx` restores session and reacts to HTTP 401 | Session boundary risk |
| FE-ARCH-003 | VERIFIED | Global styles | `index.css` contains public/admin/inventory/shared selectors | Coupled visual changes |
| FE-ARCH-004 | VERIFIED | Users page | `pages/admin/UsersPage.tsx` owns user operations, roles and validation | Multi-concern migration risk |
| FE-ARCH-005 | VERIFIED | Inventory loans | `InventoryLoansPage.tsx` consumes inventory and affiliates services | Cross-domain dependency |
| FE-ARCH-006 | VERIFIED | Public pages | `pages/public/PublicPages.tsx` contains ten screens plus internal home | Low cohesion, high movement risk |
| FE-ARCH-007 | VERIFIED | Service/type layers | Horizontal multi-domain `services/` and `types/` | Ownership ambiguity |
| FE-ARCH-008 | VERIFIED | Inventory items | `InventoryItemsPage.tsx` orchestrates CRUD, stock changes, detail/history and six UI regions | Highest page movement/test risk |
| FE-ARCH-009 | VERIFIED | Roles policy | `Administrador` / `Gestor de Inventario` literals appear in routes, layout and public home | Policy change is distributed |
| FE-ARCH-010 | VERIFIED | Inventory model | `types/inventory.ts` includes categories, stock, loans, alerts, reports and affiliate query types | Accidental cross-feature ownership |

## Feature Map — 0C

| Feature | Routes / guard | Owned API and model | Ownership | Tests / key gap |
|---|---|---|---|---|
| Public site | `/`, institutional, content, contact; public | Local content and `publicContentService` | Feature-owned content/UI; app-owned PublicLayout | Public pages covered; “coming soon” modules are not features |
| Auth | `/login`, activation, recovery/reset; public | `authService`, `types/auth`, context/storage | Feature-owned; guards are auth-to-router boundary | Context, guards, login covered; activation/recovery lack dedicated tests |
| Profile | `/profile`; authenticated | auth password endpoint | Feature-owned | Covered; current screen changes password only |
| Users | `/admin/users`; Administrador | `usersService`, `types/users` | Feature-owned page composition | Covered; page combines list/detail/edit/role/status concerns |
| Roles | No route; no CRUD | `rolesService`, role types | Ambiguous shared catalog | Used by Users and User Requests; literals duplicated in app/layout/public home |
| User requests | `/register`, `/admin/user-requests`; public/Admin | `userRequestsService`, request types | Feature-owned public/admin composition | Covered |
| Affiliation | `/afiliacion`; public | `affiliateRequestsService`, types | Feature-owned public flow; admin is ambiguous | Covered public submit; API exposes unused admin endpoints |
| Audit | `/admin/audit-logs`; Administrador | `auditLogsService`, audit types | Feature-owned | Covered |
| Inventory | seven `/inventory/*`; Admin/Gestor | inventory services/types | Feature-owned with subareas | All page areas covered except reports; loans import affiliates |

### Ownership Findings

- **VERIFIED shared**: Axios transport/error mapping, generic pagination/modal/confirm/toast/status UI, person/contact normalization where reused across register/users/affiliation.
- **VERIFIED app-owned**: bootstrap providers, router composition, layouts, global status pages, global error boundary.
- **VERIFIED ambiguous**: roles is a catalog, not current CRUD feature; inventory model owns affiliate types; public home lives in `PublicPages.tsx`; affiliation backoffice has API but no page.
- **VERIFIED defect candidate, not fixed**: inventory alerts links include `highlight` query parameters that item/loan destination pages do not consume.
- **VERIFIED product mismatch, not fixed**: internal home says profile data can be updated, while Profile implements password change only.

## Dependency Map and Hotspots — 0D

```text
main.tsx
  -> BrowserRouter / ErrorBoundary / ToastProvider / AuthProvider
  -> App
    -> AppRoutes
      -> layouts + auth guards + pages
        -> services + auth + shared UI + utils + feature types
          -> httpClient -> env + session storage
```

- **VERIFIED** routes directly import public, auth, admin, and inventory pages, layouts, and auth guards (`routes/AppRoutes.tsx`). This is central composition with high fan-out, not a confirmed defect.
- **VERIFIED** `AuthContext.tsx` coordinates login, persisted session restoration through `/auth/me`, logout and HTTP 401 reaction. Provider ordering and session semantics make it high movement risk.
- **VERIFIED** `UsersPage.tsx` combines resource fetching, filters, pagination, user detail/edit, role assignment, status mutations, validation, modal/confirm/toast coordination.
- **VERIFIED** `InventoryItemsPage.tsx` combines item CRUD, category load, stock entry/exit/adjustment, history/detail, error mapping and six rendered UI regions. It is the most complex observed frontend page.
- **VERIFIED** `InventoryLoansPage.tsx` imports inventory and affiliate service concerns; admin-only affiliate selection is an explicit cross-feature dependency.
- **VERIFIED** `types/inventory.ts` includes `AffiliateOption`/affiliate query contracts, while `affiliatesService.ts` imports them. This is accidental inventory ownership.
- **VERIFIED** list-oriented pages repeat local `loading/error/busy`, filters, pagination, ISO date conversion, modals and toasts. Repetition alone does not justify an abstraction; extract only after at least two concrete migration consumers require stable behavior.
- **VERIFIED** no direct TypeScript import cycle was confirmed by static inspection.
- **VERIFIED** `Modal`, `ConfirmDialog`, `Pagination`, and `StatusMessage` are UI-focused; they are not current intelligence hotspots. `AppLayout` combines navigation policy and logout, but remains moderate impact at current size.

### Finding Format

ID: FE-ARCH-008  
Severity: Critical  
Status: Verified  
Area: Inventory items  
Evidence: `pages/inventory/InventoryItemsPage.tsx`  
Finding: One page owns inventory resource, stock mutation, history, validation, error translation, and multiple dialogs.  
Impact: High regression and movement cost.  
Recommendation: Future inventory migration separates feature-local UI/state only after contracts are characterized.  
Phase: Remaining Feature Migration

ID: FE-ARCH-009  
Severity: High  
Status: Verified  
Area: Authorization policy  
Evidence: `routes/AppRoutes.tsx`, `layouts/AppLayout.tsx`, `pages/public/PublicPages.tsx`  
Finding: Role names are repeated literals.  
Impact: Policy change can diverge across route, navigation, and home composition.  
Recommendation: Future app/feature boundary centralizes role policy without changing current authorization behavior.  
Phase: Architecture Enforcement

ID: FE-ARCH-011  
Severity: Medium  
Status: Verified  
Area: Router authorization  
Evidence: `routes/AppRoutes.tsx:25`, `layouts/AppLayout.tsx`, `pages/public/PublicPages.tsx`, `pages/LoginPage.tsx`  
Finding: Role literals are dispersed; post-login redirect hardcodes `/admin/users` vs `/profile`; nav, guards, cards stay consistent today. Backend `@Roles(...)` remains the real enforcement.  
Impact: Silent typo risk and distributed policy edits.  
Recommendation: Future boundary introduces shared role constants and a permission matrix consumed by nav/guards/cards without changing behavior.  
Phase: Architecture Enforcement

ID: FE-ARCH-012  
Severity: Low  
Status: Verified  
Area: Route experience  
Evidence: `auth/RoleRoute.tsx`, `routes/AppRoutes.tsx:67`, `components/ErrorBoundary.tsx`, `pages/LoginPage.tsx`  
Finding: `RoleRoute` renders ForbiddenPage inline while `/403` exists unused by guards; catch-all 404 renders outside layouts; authenticated users can open login/register (no anonymous-only guard); ErrorBoundary uses `<a href>` full reload; single bundle has no code splitting.  
Impact: Inconsistent error surfaces; minor UX/size inefficiencies; none are defects blocking migration.  
Recommendation: Decide one forbidden policy and optional anonymous-only guard during target routing definition; consider feature-level route modules before any data-router migration.  
Phase: Architecture Enforcement

ID: FE-ARCH-010  
Severity: High  
Status: Verified  
Area: Model ownership  
Evidence: `types/inventory.ts`, `services/affiliatesService.ts`  
Finding: Affiliate query models are owned by inventory types.  
Impact: Feature boundary remains coupled after service migration.  
Recommendation: Relocate only during coordinated affiliation/inventory migration after all consumers are verified.  
Phase: Remaining Feature Migration

ID: FE-ARCH-013  
Severity: High  
Status: Verified  
Area: Session ownership  
Evidence: `api/httpClient.ts`, `auth/AuthContext.tsx`, `utils/sessionStorage.ts`  
Finding: Token has dual owners: `httpClient` clears storage directly on 401 while `AuthContext` owns React state and logout; storage is actually `localStorage` despite the `sessionStorage.ts` filename, persisting a plain JWT across browser sessions. Failed login (401) also triggers the global unauthorized event.  
Impact: Momentary state/storage divergence; misleading naming; JWT in localStorage is an accepted-but-notable XSS surface; redundant pre-login logout is benign.  
Recommendation: Target boundary makes `AuthProvider` sole mutation owner of session storage; httpClient only emits the event or reads via injected getter. Rename/storage semantics revisited in auth migration; no source change in this phase.  
Phase: Auth Pilot

## Auth Audit — 0F

- **VERIFIED** session lifecycle: login persists `{token,user}`, restore reads storage then revalidates `/auth/me` under `isLoading`, logout clears storage and state without server-side invalidation (`auth/AuthContext.tsx`, `utils/sessionStorage.ts`).
- **VERIFIED** 401 flow: `httpClient` clears storage and emits `auth:unauthorized`; `AuthContext` listens and logs out. Two writers exist today.
- **VERIFIED** consumers of `useAuth`: LoginPage (login + hardcoded post-login redirect), AppLayout (role nav + logout), ProfilePage (read user), guards.
- **VERIFIED** direct authService consumers bypassing context are acceptable local-effect flows: ProfilePage changePassword, ForgotPasswordPage, TokenPasswordPage activate/reset.
- **VERIFIED** target ownership split: app-owned provider keeps single-writer session lifecycle; feature-owned nav visibility, route role config, post-login redirect derived from shared role constants; authService stays pure transport.

## State and Services Audit — 0G

ID: FE-ARCH-014  
Severity: High  
Status: Verified  
Area: State management  
Evidence: ~10 list pages, `api/httpClient.ts`, all table pages  
Finding: No server cache layer; every navigation refetches, lookups (roles/categories) reload per mount, invalidation is manual post-mutation. Table pagination/search/filters live in `useState` not URL, losing back-button/deep-link. Role derivation duplicated in four independent definitions. Form validation runs in two regimes (`formValidation.ts` vs ad-hoc notify checks). Two fetch styles coexist (`useCallback+effect` vs inline `active` flag without AbortController).  
Impact: Divergent behavior across features; higher migration cost per page; UX gaps are product decisions to confirm, not defects to fix now.  
Recommendation: Target rules below govern future slices; introduce shared lookup cache only when two migrated consumers exist; URL state adopted per-feature during migration.  
Phase: Architecture Enforcement

### Verified State Inventory

- **Server**: 12 HTTP services over single axios client; thin `.data` wrappers; `publicContentService` is local mock (no HTTP). Reads via effect on `[filters,page]`; writes via async handler + toast + manual reload.
- **Session**: storage + React state duality (FE-ARCH-013); no token expiry/refresh handling client-side.
- **Forms**: per-field `useState` or form-object spread; anti-double-submit via ref/`busy`; only Register/Users/Affiliation use `formValidation.ts`.
- **URL**: minimal — news slug, reset token param, `state.from` redirect. No query-param state anywhere else.
- **Local/persistence**: single localStorage key `sgi-curime-session`; pages never touch window.storage directly (good precedent).
- **Derived**: no `useMemo/useReducer`; derivations cheap today except duplicated role logic.

### Proposed Ownership Rules (target, no code change)

| Domain | Owner | Rule |
|---|---|---|
| Server data | feature service over httpClient | Components never fetch directly; explicit invalidation after mutation |
| Session | AuthProvider | Single identity/token owner; storage passive; httpClient emits events only |
| Forms | owning component | Dies on unmount; validation via extended `formValidation.ts`, never copied |
| URL | Router | Shareable state (filters/page/search) in searchParams during migration |
| Storage | session util | Only module touching localStorage; rename when semantics change |
| Derived | render compute | Never store computables; centralize role/label helpers in shared module |

ID: FE-ARCH-015  
Severity: Medium  
Status: Verified  
Area: Design system  
Evidence: `index.css`, `types/inventory.ts` labels, shared components  
Finding: Tokenization is low: 51 distinct hex values; private app ignores public-area tokens (hardcoded blue-gray palette vs institutional green); spacing tokens barely used; three label sources (inventory label maps, dashboard statLabel, StatusBadge hardcoded); mixed radii/z-index/scales; zero inline styles in TSX (good).  
Impact: Visual changes require broad edits; public/private divergence grows per feature migrated without a token contract.  
Recommendation: Target defines semantic tokens (status colors, surfaces, borders, radius, z-index) before feature migrations consume styles; label dictionaries consolidated to one owner.  
Phase: Design System Consolidation

ID: FE-ARCH-016  
Severity: Medium  
Status: Verified  
Area: Feedback consistency  
Evidence: auth pages (`StatusMessage`, inline field errors) vs admin/inventory pages (toasts, global validation messages); `UserRequestsPage.tsx` status badges without tone; date formatting with/without `'es-CR'`; alerts `highlight` links unconsumed; skip-link only in PublicLayout; pagination prev/next only; affiliate search admin-only without debounce; toast warning/info kinds unused.  
Finding: Two coexisting feedback regimes and several small UX gaps.  
Impact: Inconsistent user experience across zones; each gap is small but compounds during migration.  
Recommendation: Target UX conventions decide one regime per concern during slice rules; individual fixes belong to product backlog, not this phase.  
Phase: Architecture Enforcement

## UX and Design System Audit — 0H–0I

- **VERIFIED critical flows**: public visitor (static content, affiliation form with onBlur field errors, no toasts in public zone), request→approval (public RegisterPage + admin UserRequestsPage approve-with-role/reject-with-reason via modals+confirm), auth (login/forgot/activate/reset), inventory (dashboard stats, items CRUD+stock entry/exit/adjust with conflict mapping, movements read-only, loans create/return/cancel, alerts, reports).
- **VERIFIED transversal mechanisms**: Toast (auto-dismiss 5s, alert/status roles), Modal (Escape/overlay close blocked when busy, focus restore, scroll lock, no full focus-trap), ConfirmDialog (danger variant), StatusMessage (auth only), uniform "Cargando X…" `aria-live` loading, button progress text; centralized error translation in `utils/errors.ts`.
- **VERIFIED design tokens**: `:root` palette (institutional green/tan), spacing scale, radius, shadow, container — consumed almost exclusively by public zone; private app hardcodes its own blue-gray palette; no semantic status tokens.
- **VERIFIED shared visual API**: Modal/ConfirmDialog/Toast/StatusMessage/Pagination props stable and UI-focused; PublicComponents provides SEO/header/footer/cards/badges for the portal.

## Accessibility, Forms, and Testing Audit — 0J–0L

- **VERIFIED accessibility baseline**: public layout has skip-link + landmarks; AppLayout lacks skip-link; one h1 per page; 100% wrapping labels; live regions on loading/toast/status; `focus-visible` outline; keyboard-scrollable tables with aria-labels; contrast passes AA except disabled buttons (~3.0); field errors not programmatically linked (`aria-describedby`/`aria-invalid` missing); Modal restores focus but has no real focus trap.
- **VERIFIED forms inventory**: ~20 forms across auth/public/admin/inventory; two error-display regimes (inline per-field `role=alert` vs imperative toast checks); `formValidation.ts` mirrors backend `identity-contact.validation.ts` regex-for-regex by intent (drift risk without shared source); client password checks weaker than server secure-password policy; double-submit guards via ref in auth/public, `busy`-only in modals.
- **VERIFIED testing matrix**: Vitest + RTL + jsdom with storage/mocks setup; 22 frontend files covering utils, context, guards, most pages; untested: ForgotPasswordPage, TokenPasswordPage, InventoryReportsPage, UserRequests approve/reject flow, Items edit/deactivate, Loans insufficient-stock; no shared test-utils wrappers; act() warnings traced to real toast timers and post-await asserts without waitFor.

ID: FE-ARCH-017  
Severity: Medium  
Status: Verified  
Area: Accessibility  
Evidence: `components/Modal.tsx` (focus restore yes, real trap no), field-error spans without `aria-describedby`/`aria-invalid`, `layouts/AppLayout.tsx` (no skip-link; public layout has one), `index.css` disabled-button opacity ≈3.0 contrast, `.field-error` class has no CSS definition  
Finding: Solid baseline (landmarks, single h1 per page, wrapping labels, live regions, focus-visible outline, es lang) with four concrete WCAG gaps. No `<img>` elements exist today. Measured contrast passes AA except disabled buttons.  
Impact: Screen-reader users miss error-to-input linkage; keyboard can escape dialogs; inconsistent skip navigation between zones.  
Recommendation: Target slice rules include a11y checklist per feature migration; fixes are backlog items, not phase work.  
Phase: Architecture Enforcement

ID: FE-ARCH-018  
Severity: Medium  
Status: Verified  
Area: Testing matrix  
Evidence: 22 frontend test files, `src/test/setup.ts`, per-file manual wrappers; uncovered: ForgotPasswordPage, TokenPasswordPage, InventoryReportsPage, UserRequestsPage approve/reject flow, AuditLogs modal/filters; act() warnings traced to unmocked toast timers, fire-and-forget loads, asserts without waitFor  
Finding: Good page/util coverage with feature-level holes concentrated in password flows, reports, and mutation flows in admin; no shared test-utils; validation regex duplicated intentionally with backend (drift risk).  
Impact: Migration safety net is uneven — exactly the pages flagged as hotspots have partial coverage of their most complex flows.  
Recommendation: Roadmap adds shared render wrappers before pilot migration; close coverage gaps for the chosen pilot feature first.  
Phase: Pilot Preparation

## Target Architecture, ADRs, and Roadmap — 0M–0O

### Proposed Target Tree (PROPOSED)

```text
frontend/src/
├── app/            router/ providers/ layouts/ config/env.ts styles/tokens.css
├── features/
│   ├── auth/       api/ model/ session/AuthProvider guards/ pages/ routes.tsx index.ts
│   ├── profile/ users/ user-requests/ public-site/ affiliation/ audit/
│   └── inventory/  internal sub-slices (items, loans, movements, alerts, reports,
│                   categories, dashboard) + contracts/affiliates.ts
├── shared/         api/httpClient ui/ lib/errors lib/formValidation session/storage
│                   security/roles testing/testUtils
└── test/setup.ts
```

### Dependency Rules (PROPOSED)

| Origin → Destination | Rule |
|---|---|
| feature → shared | Allowed |
| feature → feature | Forbidden except declared `contracts/` or feature `index.ts` allowlist |
| feature → app | Forbidden; feature exports `routes.tsx`, app imports it |
| shared → feature/app | Forbidden |
| app → feature | Only via feature public API (`index.ts` / `routes.tsx`) |

Enforced via lint boundary rule in CI before first file moves.

### Anti-Ceremony Rules (PROPOSED)

1. No abstraction without ≥2 identified concrete consumers.
2. Feature service is the boundary; components never call HTTP directly.
3. No intra-feature barrels; only the public `index.ts`.
4. No server-state library until two migrated features demonstrate shared invalidation pain.
5. Tokens before component kits; shared UI stays the existing five components.
6. New shared module requires named consumer list in its PR.
7. Tests co-located; no global fixture layer.

### ADR Summary (all Status: Proposed)

- **ADR-001 Vertical slices**: reorganize into `features/<domain>/`, migration per whole feature, one PR per slice. Mitigates FE-ARCH-004/007/008/010.
- **ADR-002 Routing**: keep BrowserRouter + declarative Routes; features export `routes.tsx`; unify forbidden policy to `/403` redirect; anonymous-only guard decided during auth migration; lazy loading only after slices exist. Mitigates FE-ARCH-001/012.
- **ADR-003 Session ownership**: AuthProvider sole writer of session; httpClient emits events only with injected token getter; post-login redirect derives from permission matrix. Mitigates FE-ARCH-013/011.
- **ADR-004 Server state**: explicit invalidation; URL searchParams adopted per-feature during migration; shared lookup cache only after two migrated consumers; single fetch style for new code. Mitigates FE-ARCH-014.
- **ADR-005 Design tokens**: semantic layer (`app/styles/tokens.css`); shared UI consumes tokens only; label dictionaries consolidated per domain during that domain's migration; visual convergence feature-by-feature. Mitigates FE-ARCH-003/015.
- **ADR-006 Roles centralization**: `shared/security/roles.ts` constants + permission matrix consumed by guards/nav/cards/post-login redirect; no behavior change; justified exception to anti-ceremony (4+ verified consumers). Mitigates FE-ARCH-009/011.
- **ADR-007 Testing conventions**: shared `testUtils.tsx` render wrapper with canonical provider order; `waitFor` for post-await asserts; mocked toast timers; feature not "migrated" until critical mutation flows covered. Mitigates FE-ARCH-018.
- **ADR-008 Migration governance**: one feature = one branch = one PR; move commits separated from behavior commits; boundary lint before first move; per-feature checklist attached to Azure DevOps work item; ADR deviations require new ADR; skill update only after ADR-001 acceptance.

### Pilot Evaluation (PROPOSED)

| Criterion | Auth | Users | Roles |
|---|---|---|---|
| Movement risk | Medium-low, bounded | High (multi-concern page) | Not a feature — catalog only |
| Leverage | Highest: enables ADR-003/006 used by all others | Low until roles centralized | Delivered inside auth pilot as contract |
| Rule validation | Exercises shared/app split, 401 event, permission matrix | Premature cache concerns | n/a |

**Recommendation: Auth pilot**, sequence: prerequisites (testUtils, roles matrix, boundary lint) → skeleton + move types/service → guards → provider → pages in separate commits → httpClient behavior commit (event-only) → redirect from matrix → close auth test gaps (ForgotPassword, TokenPassword, act warnings) → retrospective updates checklist template. Users second; Roles ships as part of Auth pilot prerequisites.

### Migration Roadmap (PROPOSED, ascending risk)

1. Scaffolding: app/shared tree, roles.ts + matrix, testUtils, boundary lint, initial tokens.css (mitigates 009/011/018).
2. Auth pilot (002/013).
3. Profile + User requests (007).
4. Public site split of PublicPages.tsx (006).
5. Audit (isolated).
6. Users after lookup-cache evidence (004/014).
7. Affiliation coordinated with #8 for affiliate contracts (010/016).
8. Inventory ascending: categories → movements → alerts → dashboard/reports → loans → items last (005/008/010).
9. App consolidation: full tokens, optional code splitting, architecture skill review (003/015).

Per-feature checklist template (pre-migration baseline, consumer inventory, cross-contract declaration, move commits separated, verification gates, Azure DevOps attachment, rollback check) recorded for backlog use. Product defects found (alerts highlight unconsumed, home-vs-profile mismatch) route to product backlog, not this migration.

## Open Questions

- PENDING: user approval converts ADR-001..008 from Proposed to Accepted; pilot Auth recommendation awaits sign-off.
- PENDING: shared UI boundary, feature public APIs, and pilot choice require full dependency map and approval.
