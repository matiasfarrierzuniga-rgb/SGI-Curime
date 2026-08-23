# Frontend Consolidation — Follow-ups and Retrospective

Recorded by the `consolidate-frontend-architecture` change. Items here are deliberately
OUT of its scope and require their own OpenSpec change or backlog decision.

## Deferred product / UX defects (evidence from phase-0 audit)

- Inventory alerts links carry `highlight` query params no destination page consumes.
- Internal home copy says profile data is editable; Profile implements password change only.
- `.field-error` class has no CSS definition.
- Disabled-button contrast (~3.0) below AA.

## Deferred migrations

- Inventory feature slice (items/loans/movements/alerts/reports/dashboard/categories),
  including relocating affiliate query contracts out of inventory ownership.
- Affiliation backoffice screens (API endpoints already exist unused).
- Public site split of `pages/public/PublicPages.tsx` into a `public-site` feature.
- Profile, user-requests, audit, and remaining legacy roots (`pages/`, `services/`,
  `types/`, `components/public`, `content/`) into feature-owned slices.

## Deferred technical decisions

| Topic | Status | Revisit trigger |
| --- | --- | --- |
| URL-backed filters/pagination (Users first) | Deferred: changes navigation behavior, which consolidation phases must not do | Product approves back-button/deep-link UX change |
| Zod schemas | Deferred: single-consumer value today | ≥2 features need shared schema contracts or backend drift bites |
| TanStack Form | Deferred: one form consumer | Second complex form lands in a migrated feature |
| TanStack Table | Deferred: one table consumer | Table complexity grows beyond sorting-free lists |
| Zustand | Not adopted | Demonstrated cross-feature client state pain |
| TanStack Router | Postponed | Separate ADR after all slices exist |
| Tailwind / token convergence | Out of scope for structural migration | Dedicated UI-phase proposal |
| Forbidden-page policy (`/403` redirect vs inline render) | Preserved inline render | Router-experience proposal |
| Anonymous-only guard for login/register | Preserved current behavior | Router-experience proposal |
| Code splitting / lazy routes | Not started | After remaining slices migrate |

## Architecture-skill alignment

The local `sgi-frontend-architecture` skill still documents horizontal organization. It
must be updated only through an approved follow-up decision, now that CONVENTIONS.md and
the boundary checker are the operative source of truth.

## Retrospective (consolidation run)

- Foundation + Auth + Users + Roles + enforcement landed as five reversible commits with
  green gates at every step (`npm run verify`, `git diff --check`).
- Session single-writer landed in the Auth commit: httpClient now only emits
  `auth:unauthorized`; AuthProvider remains the sole storage writer.
- TanStack Query pilot required `server.deps.inline` under Vitest to keep a single React
  instance; convention recorded in CONVENTIONS.md.
- Rule changes after this point go through a new OpenSpec change / ADR update, never
  silent edits to CONVENTIONS.md or the checker.
