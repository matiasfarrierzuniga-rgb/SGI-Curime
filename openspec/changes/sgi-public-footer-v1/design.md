# Design

## Context

See `proposal.md` and `specs/public-site-footer/spec.md`. `PublicFooter` already owns four semantic regions, logo, wave, public content, session-aware links and logout. Its `public-container` width is not the requested 1200 px contract, while current grid and padding do not express requested mobile-first spacing. Shared `Button` defines `ghost` hover colors from generic muted tokens, which can resolve as a light surface on the brown footer.

## Goals / Non-Goals

**Goals:**
- Keep change local to `frontend/src/features/public-site/ui/components/PublicFooter.tsx`.
- Express 1200 px maximum content width, 28/32/40 px vertical rhythm and responsive four/two/flowing column composition using existing Tailwind tokens.
- Preserve semantic landmarks, focus affordances, touch targets, data mapping, session logic and route destinations.
- Make the logout action visually explicit for its dark institutional context without changing its callback or shared button primitive.

**Non-Goals:**
- Change `publicSiteContent`, logo asset, footer wave, global layout primitives, authentication behavior, permissions or routes.
- Add dependencies, alter backend/API contracts, or redesign public header or pages.

## Decisions

### Local responsive layout contract

Apply max width and horizontal gutters directly to the footer's inner layout rather than changing `public-container`. This limits the visual change to the authorized footer while preserving every other public surface. Use one-column mobile flow, two equal columns at tablet breakpoint, then four proportional columns at desktop.

Alternative considered: modify `public-container` globally. Rejected because it changes unrelated public pages.

### Preserve existing content ownership

Retain all values from `site` and the existing `useAuth` capability branching. Reorganize only presentation wrappers and spacing; do not replace links with static content or introduce duplicated data.

Alternative considered: define a footer-specific content map. Rejected because it risks divergence from `publicSiteContent`.

### Footer-context logout styling

Keep existing `Button` and `logout` handler, but apply an explicit local transparent/institutional background plus inverse text, hover and focus classes. This neutralizes generic `ghost` muted hover styling that can render light against `bg-brand-ink`.

Alternative considered: modify shared `ghost` variant. Rejected because shared controls in non-footer contexts could regress.

### Accessibility and density

Retain labelled navigation regions, link targets, `rel` for external social links and visible keyboard focus. Keep interactive controls at least 44 px high; compact density comes from container padding and inter-region gaps, not reduced touch targets.

## Risks / Trade-offs

- [Content labels wrap at narrow widths] → retain min-width safeguards, text wrapping and single-column mobile flow; validate at 320 px.
- [Explicit utility precedence conflicts with Button variant classes] → use local classes with sufficient specificity and inspect authenticated hover/focus/disabled states.
- [Exact brand-token appearance differs by theme] → rely on existing institutional semantic tokens instead of new colors or hardcoded values.

## Migration Plan

1. Update only `PublicFooter.tsx` composition and local classes.
2. Validate anonymous and authenticated footer states at desktop, tablet and mobile widths.
3. Roll back by reverting the localized component change; no data or API migration required.
