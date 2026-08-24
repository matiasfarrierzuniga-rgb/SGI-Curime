# SGI-Curime Frontend Conventions

Governance for the `app / features / shared` architecture. These rules are enforced by
`npm run check:architecture` and reviewed in every pull request.

## Layer ownership

| Layer      | Owns                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `src/app`  | Bootstrap providers, router composition, layouts, global status pages |
| `src/features/<domain>` | Domain API access, models, hooks, UI screens, route contributions |
| `src/shared` | Domain-neutral HTTP client, UI primitives, lib utilities, session storage, security policy, test setup |
| Legacy roots (`pages/`, `services/`, `types/`, `components/`, `content/`) | Transitional only; code migrates feature by feature |

## Dependency direction (enforced)

- `shared -> features | app`: forbidden
- `feature -> app`: forbidden
- `feature -> other feature`: only through the target's `index.ts` public API
- `app -> feature`: only through the feature's `index.ts`
- Tests (`*.test.*`) may import or mock internals; they are exempt from the scan

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
| Forms | TanStack Form | Form lifecycle (pilot phase) |
| Tables | TanStack Table | Headless table logic (pilot phase) |
| Styling | Tailwind CSS 4 | Utility-first CSS with institutional tokens |
| UI Primitives | shadcn/ui | Accessible base components in `shared/ui/` |

## Styling & Design Tokens

### Tailwind CSS

- Tailwind v4 with `@tailwindcss/vite` plugin (CSS-first config).
- Tokens defined in `src/tailwind.css` using `@theme` directive.
- Legacy `src/index.css` preserved during transition; new code uses Tailwind utilities.

### Design Tokens

Institutional palette (Curime / Nicoya / Guanacaste):

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand-deep` | `#174c5b` | Deep Teal — primary dark |
| `--color-brand-primary` | `#287b7b` | Teal — primary |
| `--color-brand-soft` | `#75b5a6` | Soft Teal — secondary |
| `--color-brand-accent` | `#e7c477` | Warm Gold — accent |
| `--color-brand-ivory` | `#f7f5ed` | Warm Ivory — background |
| `--color-brand-ink` | `#123b47` | Dark ink — text |

### Typography

- **DM Serif Display**: headlines, display, institutional messaging (`--font-display`)
- **DM Sans**: body, UI, navigation, inputs, buttons, tables (`--font-body`)
- Loaded via Google Fonts in `index.html` with `display=swap` to prevent CLS.

### Semantic tokens

Background/surface, foreground, border, focus, success/warning/danger/info states
are all defined as Tailwind theme tokens. Single source of truth in `src/tailwind.css`.

## shadcn/ui

Components live in `src/shared/ui/`. They are:
- Generic, presentational, accessible, typed, composable.
- Never contain business logic or domain-specific code.
- Imported by features as `@/shared/ui/button`, `@/shared/ui/dialog`, etc.

Initial set: Button, Input, Label, Dialog, Sheet, Card, Badge, Alert, Skeleton.
Add more under demand only.

**Incorrect**: `shared/ui/UserTable`, `shared/ui/LoginForm` — these belong to features.

## Zod

- Installed and available for runtime validation.
- Convention: API response → Zod schema → typed model → feature consumption.
- Forms: TanStack Form → Zod schema → validated values → API.
- No bulk migration of existing DTOs; pilot on next feature.

## Validation & verification gates

```bash
npm run verify   # lint + architecture check + tests + build
git diff --check # no whitespace errors
```

Manual smoke checklist for structural phases: login, protected routes, role-restricted
routes, deep links, public portal rendering.

## Accessibility

All UI must meet WCAG 2.2 AA:
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

Foundation must work at: 320px, 375px, 768px, 1024px, 1440px.
Mobile-first approach. Tailwind breakpoints available as theme tokens.

## Delivery rules

- One migration phase = one branch = one PR; move commits stay separate from behavior commits.
- Rollback point: last verified commit before the phase.
- Product defects discovered mid-migration become separate backlog items unless required
  to preserve an architecture contract here.

## Adopting new tooling

Requires: a named pilot consumer, measured duplication pain the tool removes, before/after
behavior notes, and its own OpenSpec change if it replaces an existing mechanism broadly.
