# SGI-Curime Frontend Conventions

Governance for the `app / features / shared` architecture. These rules are enforced by
`npm run check:architecture` and reviewed in every pull request.

## Layer ownership

| Layer      | Owns                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `src/app`  | Bootstrap providers, router composition, layouts, global status pages |
| `src/features/<domain>` | Domain API access, models, hooks, UI screens, route contributions |
| `src/shared` | Domain-neutral HTTP client, UI primitives, lib utilities, session storage, security policy, test setup |
| Legacy roots (`pages/`, `services/`, `types/`, `components/`, `content/`) | `NO_NEW_CODE`; migrate feature by feature |

## Dependency direction (enforced)

- `shared -> features | app`: forbidden
- `feature -> app`: forbidden
- `feature -> other feature`: only through the target's `index.ts` public API
- `app -> feature`: only through the feature's `index.ts`
- Tests must respect feature public APIs and must not import or mock feature internals

## Legacy zones

`src/pages`, `src/services`, `src/types`, and `src/components` are legacy zones. New code must not be added there.

Allowed exceptions: urgent bug fixes, security fixes, temporary compatibility work, or an explicit module migration. Document the exception in its pull request.

## Feature structure

Folders exist only when they carry real responsibility:

```
features/<domain>/
├── api/        HTTP communication (transport objects only)
├── model/      types, schemas, domain helpers
├── hooks/      React coordination (e.g. TanStack Query wrappers)
├── ui/         presentation components and screens
├── routing/    guards the router consumes (auth feature)
└── index.ts    public API - the ONLY externally importable path
```

## Naming

- Files: PascalCase for components, camelCase for everything else.
- API modules: `<domain>.api.ts` exporting a single service object.
- Query keys: exported per feature as `<domain>Keys`.

## Technology stack

| Concern | Tool | Responsibility |
|---------|------|----------------|
| Framework | React 19 | UI rendering |
| Language | TypeScript 6 | Type safety |
| Build | Vite 8 | Bundling, HMR |
| Routing | React Router 7 | Navigation, layouts, route guards (TanStack Router target — separate epic) |
| Server State | TanStack Query 5 | API data, caching, invalidation |
| Client State | Zustand | UI-only ephemeral state (no server state duplication) |
| HTTP | Axios | Transport via `shared/api/httpClient.ts` |
| Runtime Validation | Zod | Schema contracts, API response validation, form validation |
| Forms | React Hook Form + Zod | Active form lifecycle and client-side schema validation |
| Tables | TanStack Table | Headless table logic (pilot phase) |
| Styling | Tailwind CSS 4 | Utility-first CSS with institutional tokens |
| UI Primitives | Base UI / local shadcn-compatible components | Accessible local components in `shared/ui/` |

## Visual source of truth and scope

`src/tailwind.css` is the executable technical source of truth for current visual
tokens, typography, breakpoints, modern base styles and shared global utilities.
This document records its contract for people; it must not introduce conflicting
values. `src/index.css` is a legacy compatibility layer, not a source for new
visual work. `src/main.tsx` imports `tailwind.css` before `index.css`, so a legacy
global selector can override the modern layer by cascade.

DS-F1 is documentation and governance only. It does not certify current consumers
as accessible, responsive, or migrated. Requirements in this section apply to new
components and consumers deliberately adopted in a later scoped change. Existing
CSS, aliases and consumers remain until their migration has evidence.

## Identity, tokens and visual contexts

### Nicoya Contemporáneo baseline

The institutional baseline is implemented in `src/tailwind.css`.

| Brand role | Token | Current value | Use |
| --- | --- | --- | --- |
| Institutional green | `--color-brand-green` | `#2f4a38` | Stable Curime identity |
| Institutional red | `--color-brand-red` | `#b03a2e` | Stable Curime identity |
| Maize / ochre | `--color-brand-maize` | `#c98a2d` | Stable Curime identity |
| Institutional brown | `--color-brand-brown` | `#4a2f1a` | Stable Curime identity |
| Ivory | `--color-brand-ivory` | `#faf4ea` | Stable Curime identity |

Brand tokens do not communicate success, warning, error, selection or disabled
state. Use semantic tokens for foreground, background, surface, border, focus,
interaction and status; use contextual/component tokens only after those layers.

```text
brand identity → semantic meaning → public / access / ERP context → component
```

Public surfaces preserve institutional assets and compatible public aliases.
Access surfaces preserve clear, task-oriented contrast and form feedback. ERP may
use its contextual canvas, navigation, action and focus tokens, while retaining the
same Curime identity and semantic status meanings. Context does not create domain,
route, capability, or authorization semantics.

Compatibility aliases `brand-deep`, `brand-primary`, `brand-soft`, `brand-accent`,
`brand-ink` and `brand-sage` remain supported. Do not rename, remove or reinterpret
them as a DS-F1 documentation change.

### Existing visual scales

Reference `src/tailwind.css` instead of copying every token value into page code:

| Concern | Existing semantic source |
| --- | --- |
| Spacing | `spacing-ui-*`, `spacing-space-*`, page and control spacing |
| Radius | `radius-control`, `radius-surface`, `radius-overlay` |
| Borders | `border-subtle`, `border-default`, `border-strong`, `border-focus`, status borders |
| Controls | `size-control-compact`, `size-control`, `size-control-lg` |
| Elevation | `shadow-*`, `shadow-surface`, `shadow-overlay`, `shadow-elevation-*` |
| Layout | `container-max`, page spacing and header sizes |
| Breakpoints | 320, 375, 768, 1024 and 1440 px (`xs` through `xl`) |
| Motion and layers | `duration-*`, `z-nav`, `z-modal`, `z-toast` |

Reuse these values for new or migrated work. A new shared token requires a semantic
name, at least two foreseeable consumers or an approved transversal decision,
responsive evidence, compatibility review and a scoped change. A one-off value is
permitted only for a local composition that does not create reusable meaning.

## Typography

- **DM Sans** (`--font-sans`) is the interface family: navigation, controls,
  forms, tables, dialogs, reports, body copy and functional headings.
- **DM Serif Display** (`--font-heading`) is reserved for approved expressive or
  institutional display headings. A heading element alone does not authorize serif.
- Use semantic `text-*` tokens: `display`, `heading-1..3`, `body-large`, `body`,
  `body-small`, `label`, `caption` and `navigation`; avoid arbitrary page font sizes.
- Fonts currently load remotely once in `index.html` from Google Fonts with
  `display=swap`: DM Sans 400/500/600/700 and DM Serif Display. Do not add a
  third family, further remote font requests, `@font-face`, or local `font-family`
  without an approved design-system decision and performance reason.

`tailwind.css` currently assigns `--font-heading` to global `h1`, `h2` and `h3`.
This is a compatibility bridge, not permission to expand serif usage. A future
typography change must inventory consumers and migrate display versus functional
headings per consumer before changing that selector.

## Interaction, accessibility and responsive adoption

For each new or deliberately migrated interactive component, document only
applicable states, but implement them completely:

| State | Required signal and behavior |
| --- | --- |
| Default | Purpose, enabled interaction and accessible name are clear |
| Hover / active | Perceptible feedback supplements, never replaces, semantics |
| Focus visible | Keyboard focus remains visible, contrasted and unobscured; current global baseline is 3 px with 2 px offset |
| Disabled | Incompatible action is unavailable and its state is perceptible |
| Loading | Duplicate actions are prevented; busy progress is exposed through text or accessible semantics when applicable |
| Invalid | Control and error are programmatically associated; error is not color-only |

For a future component or migration, record evidence for applicable WCAG 2.2 AA
contrast, keyboard navigation and order, focus behavior, semantic HTML/labels,
responsive composition at 320/375/768/1024/1440 px, and
`prefers-reduced-motion`. `tailwind.css` already contains a reduced-motion global
rule; its presence does not certify every consumer. Keep touch targets at least
24 px and target 44 px where interaction permits.

## CSS responsibilities and legacy compatibility

| File | Ownership | Rule |
| --- | --- | --- |
| `src/tailwind.css` | Tailwind v4 import, `@theme`, institutional and semantic tokens, modern base/focus/motion rules, justified shared utilities | Source for new modern styling |
| `src/index.css` | Legacy normalization, aliases and existing global rules | No new modern styles; preserve until scoped migration |

Legacy inventory is representative, not selector-by-selector exhaustive:

| Category / critical selectors | Representative consumers | Risk | Replacement and retirement condition |
| --- | --- | --- |
| Public shell: `.container-public`, `.public-header`, `.public-nav`, `.button`, `.hero`, `.public-nav-trigger` | Legacy public routes plus `PublicHeader.tsx` for `.public-nav-trigger`; its `.public-container`, header and navigation layout are modern Tailwind equivalents | Cascade can override Tailwind/public primitives | Migrate route consumers; inspect specificity and visual baseline before removal |
| Auth/app shell: `.app-header`, `.nav`, `.container`, `.auth-page`, `.card` | `app/layouts/AppLayout.tsx`, `shared/ui/ErrorBoundary.tsx`, legacy admin pages | Layout and navigation regression | Replace each consumer with scoped layouts/utilities; validate routes and keyboard navigation |
| Forms and actions: `.form-grid`, `label`, global inputs, `button`, `.primary`, `.actions` | Legacy inventory pages including `InventoryItemsPage.tsx`, `InventoryLoansPage.tsx`, `AuditLogsPage.tsx` | Global control styling may override shared primitives | Inventory selector users; validate default, focus, disabled, invalid and submit states |
| Tables and data layout: `.table-wrap`, `table`, `.pagination`, `.detail-grid` | Inventory pages and `admin/UserRequestsPage.tsx` | Responsive overflow and table density regression | Migrate per table/layout; test horizontal access and breakpoints |
| Overlays and feedback: `.modal-*`, `.toast-*`, `.message`, `.error`, `.success` | `shared/ui/Modal.tsx` directly consumes `.modal-*`; legacy pages consume feedback classes. `shared/ui/Toast.tsx` is modern Sonner with Tailwind classes, not a `.toast-*` consumer | Dialog, focus, status or stacking regression | Confirm portal, focus, status semantics and z-index consumers before replacement |
| Status, dashboard and utility classes: `.badge`, `.stat-*`, `.alert-*`, `.report-*` | Legacy inventory/admin surfaces | State colors and layouts may drift | Map visible consumers and semantic tokens before scoped removal |

Before any CSS modification or removal, create or approve a separate change that
identifies affected selector/token, consumers, visual and accessible evidence,
rollback, and sufficient selector-level inventory. DS-F1 does not change CSS.

## Component governance

Architecture remains `app → features → shared`; no folder moves follow from this
taxonomy.

| Category | Responsibility | Preferred location | Examples in current tree |
| --- | --- | --- | --- |
| Primitive | Generic accessible typed control without domain logic | `shared/ui` | `button`, `input`, `dialog`, `field` |
| Reusable pattern | Composition with stable transversal contract and demonstrated reuse | `shared/ui` when evidence exists | `PageContainer`, `StatusBadge`, `Pagination` |
| Brand | Institutional presentation without business logic | `shared/ui/brand` plus official assets | Curime greca pattern, divider and brand accent |
| Domain | Domain data, states, permissions or business rules | `features/<domain>` | Reservation, financial and affiliate UI |
| App composition | Providers, router and global layouts | `app` | `AppProviders`, routes, layouts |

Before creating a primitive, shared pattern, variant or prop, document: user
problem, demonstrated consumers, public API, states, keyboard/accessibility,
responsive behavior, compatibility, focused tests and acceptance criteria. Reuse
an existing `shared/ui` contract when it fits; do not create generic abstractions
to conceal domain logic. Base UI is preferred where it already supplies interaction
semantics. Local shadcn-compatible components are editable project code, not a
second runtime library. Lucide remains the usual functional icon source.

Families such as DatePicker, CalendarView, DataTable, Dialog, feedback and shell
remain governed by their own approved scopes; this document does not define their
future APIs or migrations.

### Governance and gradual adoption

For frontend work, follow explicit approved scope and implemented contracts first,
then repository `AGENTS.md`, `frontend/AGENTS.md`, this document, and applicable
OpenSpec artifacts. `AGENTS.md` files define authority and safety boundaries;
`CONVENTIONS.md` defines frontend architecture and visual adoption rules; OpenSpec
defines approved requirements and evidence for one increment. An OpenSpec proposal
does not replace an implemented contract or authorize an unrelated component API.

Adopt foundations per consumer: record baseline, affected files, accessibility and
visual evidence, validation, compatibility impact, rollback, and retirement of any
legacy selector. Keep each component family in its own approved scope. This does
not modify either `AGENTS.md` file.

## Forms

**React Hook Form + Zod** is the active form pattern. React Hook Form owns client
form lifecycle; Zod schemas validate client input through the installed resolver.
Backend contracts remain the source of truth for domain validation. Existing
evidence includes `useForm` with `zodResolver` in reservations, donations and
financial features.

TanStack Form is historical documentation or a future evaluation, not an active
standard. Do not run a parallel migration. Evaluating another form tool requires a
separate OpenSpec proposal, named pilot consumer, measured duplication/problem,
compatibility plan, before/after behavior evidence, and an exit or adoption path.
`FormField`, controls, schemas, payloads and screens do not change through this
governance document.

## Validation & verification gates

```bash
npm run verify   # lint + architecture check + tests + build
git diff --check # no whitespace errors
```

Manual smoke checklist for structural phases: login, protected routes, role-restricted
routes, deep links, public portal rendering.

## Accessibility

New or deliberately migrated UI must satisfy applicable WCAG 2.2 AA. Existing
consumers require their own scoped validation; this document is not retroactive
certification.

- Keyboard navigation, visible focus, focus management.
- Color contrast 4.5:1 normal / 3:1 large text.
- Semantic HTML, landmarks, labels, error messages.
- `aria-*` only when native semantics insufficient.
- Touch targets ≥ 44px recommended, ≥ 24px minimum.
- `prefers-reduced-motion` support via CSS and Tailwind tokens.

## SEO (public pages only)

- `<html lang="es">` set.
- Unique `<title>` and `<meta name="description">` per public route.
- Heading hierarchy: single `<h1>`, logical nesting.
- Semantic HTML for crawlability.
- No SEO overhead for `/admin/*`, `/app/*`, `/inventory/*`.

## Responsive

New or migrated foundation work must demonstrate 320px, 375px, 768px, 1024px and
1440px. Use a mobile-first approach and Tailwind breakpoint tokens. Existing
surfaces are not certified by this statement.

## Delivery rules

- One migration phase = one branch = one PR; move commits stay separate from behavior commits.
- Rollback point: last verified commit before the phase.
- Product defects discovered mid-migration become separate backlog items unless required
  to preserve an architecture contract here.

## Adopting new tooling

Requires: a named pilot consumer, measured duplication pain the tool removes, before/after
behavior notes, and its own OpenSpec change if it replaces an existing mechanism broadly.
