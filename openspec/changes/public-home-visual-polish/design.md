## Context

`/` renders `LandingPage` inside `PublicLayout`, with `PublicHeader` and `PublicFooter` supplied by the `public-site` feature. Home sections are presentational and use Tailwind utilities, while `index.css` still contains legacy public primitives and global form/button rules. Several Home utilities reference names absent from the current Tailwind theme. See `proposal.md` and `specs/public-home-visual-polish/spec.md` for motivation and observable requirements.

## Goals / Non-Goals

**Goals:**

- Improve hierarchy, proportion, spacing, typography, card rhythm and responsive composition within existing public-site boundaries.
- Correct missing visual utility usage with the smallest safe token or class change.
- Preserve current links, authentication-dependent labels, menu behavior, semantics and pending-service states.
- Use checkpointed edits so each visual area can be reviewed independently.
- Keep validation manual and focused; implementation must not run test suites automatically.

**Non-Goals:**

- Changing routes, capabilities, guards, authentication, APIs, backend contracts or domain behavior.
- Adding content modules, external photography, dependencies or new public functionality.
- Migrating the legacy global stylesheet or changing the global `sm` breakpoint.
- Incorporating currently unused `ProjectsNewsSection` or `ValueStrip` into Home.

## Decisions

### Keep existing feature boundaries

Edit only `LandingPage` and its Home/header/footer components. This keeps presentation changes inside `features/public-site` and avoids touching router, auth and domain features. A broad page/layout refactor was rejected because it increases regression surface without improving the requested visual scope.

### Prefer existing tokens and utilities

Replace missing utility names with defined institutional tokens, or add only narrowly justified aliases to `tailwind.css` if class replacement would create duplication. Do not redesign the palette or introduce page-level font families. Changing `index.css` is excluded unless browser inspection proves its global cascade blocks the requested result; that finding must be reported before expanding scope.

### Use mobile-first composition with explicit narrow-phone protection

Treat 320px and 375px as mobile layouts. Do not rely on `sm` for tablet-like columns because this project defines `sm` at 375px. Use later breakpoints for two-column content where needed, and ensure hero artwork and CTAs cannot clip or collide.

### Preserve interaction contracts while restyling

Keep current `Link`, `NavLink`, `useAuth`, `aria-current`, menu button, Escape listener, focus restoration, skip link, conditional `/login` or `/app`, and all service destinations. Visual affordances may change; interaction semantics may not.

### Sequence work by reviewable checkpoint

Implement baseline, hero, services, header, institutional sections, footer/responsive pass and validation as separate checkpoints. This allows rollback to the last verified visual checkpoint and prevents unrelated public-page changes from entering the feature.

## Risks / Trade-offs

- [Missing Tailwind utilities] → Use defined token names or verify narrowly scoped aliases; inspect generated styling before proceeding.
- [Legacy `index.css` cascade] → Avoid global stylesheet edits initially; if shared Button or form styles are blocked, stop and document affected selectors before changing it.
- [Narrow viewport clipping] → Review 320px and 375px first, especially hero artwork, logo container, CTAs and footer links.
- [Header regression] → Preserve existing menu state logic and manually verify active link, Escape, focus restoration and conditional access at every header checkpoint.
- [Contrast regression] → Check primary/secondary text and maize-on-green or maize-on-ivory combinations during manual review, including focus rings.
- [Uneven card grids] → Prefer intentional grid spans or balanced layout rules without changing service order or adding fake content.

## Migration Plan

1. Apply one checkpoint at a time in the order defined in `tasks.md`.
2. Review the diff and manually inspect affected desktop/mobile widths after each checkpoint.
3. If a checkpoint regresses navigation or public behavior, revert only that checkpoint to the previous verified state; do not alter domain code.
4. Daniel runs focused tests and final verification commands after implementation, not during planning or automatic implementation.

## Open Questions

None. Remaining visual choices can be resolved within the stated identity, token and responsive constraints without changing the specification.
