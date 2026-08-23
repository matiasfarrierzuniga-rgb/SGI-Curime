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

## Server state (TanStack Query)

- Features own their queries/mutations in `hooks/`; UI never calls services directly.
- Every mutation invalidates its feature key root (`<domain>Keys.all`) on success.
- App defaults: `retry: 1`, `staleTime: 30_000`, `refetchOnWindowFocus: false`.
- Vitest requires `server.deps.inline: ['@tanstack/react-query']` (already configured).

## Forms & validation

- Validation lives in `shared/lib/formValidation.ts` until a schema pilot justifies Zod.
- Never duplicate validators; import from shared lib.
- Double-submit guard: `busy` state or ref; disabled buttons must keep labels informative ("Guardando…").

## Session security policy

- Role names come from `shared/security/roles.ts` constants — never inline literals.
- Guards, navigation, cards, and post-login redirect derive from those helpers.
- Only `AuthProvider` writes session storage. The HTTP layer reads the token and emits
  `auth:unauthorized`; it must not clear storage itself.

## Shared extraction criteria

A module moves to `shared/` only with two concrete consumers and domain-neutral behavior.
No speculative abstractions, no barrels except feature `index.ts`.

## Verification gates (per phase / PR)

```bash
npm run verify   # lint + architecture check + tests + build
git diff --check # no whitespace errors
```

Manual smoke checklist for structural phases: login, protected routes, role-restricted
routes, deep links, public portal rendering.

## Delivery rules

- One migration phase = one branch = one PR; move commits stay separate from behavior commits.
- Rollback point: last verified commit before the phase.
- Product defects discovered mid-migration become separate backlog items unless required
  to preserve an architecture contract here.

## Adopting new tooling (Zod, TanStack Form/Table, Zustand, router or styling replacement)

Requires: a named pilot consumer, measured duplication pain the tool removes, before/after
behavior notes, and its own OpenSpec change if it replaces an existing mechanism broadly.
