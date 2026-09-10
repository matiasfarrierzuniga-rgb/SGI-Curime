## Context

See `proposal.md` for motivation. `ErpLayout` owns authenticated shell presentation, its local responsive state, and recursive rendering of already-filtered navigation. The shell uses three established ranges: mobile below `md` (768px) with a Sheet, compact rail from `md` through 1439px, and expanded sidebar at `xl` (1440px) and above. Existing `tailwind.css` semantic tokens are visual source of truth.

The implementation must preserve current `getErpNavigation` output, routes, guards, auth flow, Sheet behavior, `Outlet`, active-link rules, and accessible names. No shared component, token, route, or capability change is required.

## Goals / Non-Goals

**Goals:**

- Deliver a cohesive, responsive ERP shell from 320px through 1440px+ with no horizontal overflow caused by shell chrome.
- Give header, sidebar, and main content a shared geometry while retaining the 1280px content cap.
- Make compact rail navigation and active Inventory subnavigation fit and remain understandable through pointer and keyboard interaction.
- Use existing semantic tokens to create AA-appropriate visual contrast and clearly visible focus states.
- Adapt Curime branding from `AccessLayout` within `ErpLayout`, without introducing a branding abstraction.

**Non-Goals:**

- No functional shell redesign, breakpoint model change, route reorganization, data or authorization change.
- No page-level restyling inside `Outlet`, shared primitive changes, Tailwind token additions, dependency additions, or legacy stylesheet cleanup.
- No decorative animation; global reduced-motion behavior remains authoritative.

## Decisions

### Keep changes local to `ErpLayout`

Use Tailwind utility changes and limited local markup changes in `ErpLayout.tsx`. Update `ErpLayout.test.tsx` only when accessible structure or an existing invariant needs coverage.

This preserves the stable `app -> features -> shared` direction and keeps shell-specific appearance out of generic primitives. Changing `button`, `badge`, `sheet`, or `tailwind.css` would broaden risk without a demonstrated shared-system deficiency.

Alternative considered: extend shared primitives or define new shell tokens. Rejected because current semantic token set and primitives can express required states, while shared changes affect unrelated surfaces.

### Compose header by information priority on small screens

Retain navigation trigger, current location, user name, and role. Rearrange or wrap header metadata at mobile widths so identity is not permanently removed and each line has a bounded/truncatable width. Let the more descriptive institutional line remain secondary and appear only where space permits.

At `md` and above, preserve a single compact header row with aligned shell offsets. Use `min-w-0`, shrink/truncate boundaries, and breakpoint-specific layout rather than reducing touch target size.

Alternative considered: hide role or breadcrumb on mobile. Rejected because both provide relevant contextual information; responsive reflow preserves them without overflow.

### Preserve three-range navigation model and adapt compact content

Keep Sheet below `md`, compact rail from `md` to `xl`, and expanded sidebar from `xl`. Compact links retain existing accessible text and `title`, but add a lightweight local visual label on hover/focus using CSS positioning or a similarly local presentation treatment.

When compact, render active child links as icon-sized contextual controls aligned within rail instead of retaining desktop indentation. Expanded and Sheet navigation retain current readable nested list treatment. This changes only presentation; `groupActive`, child paths, active semantics, and navigation data remain untouched.

Alternative considered: expand sidebar at `lg` or remove contextual children in compact mode. Rejected because it alters established responsive model or removes reachable navigation context.

### Use semantic surface states with visible focus

Replace low-contrast gold-on-deep navigation combinations with existing semantic foreground/background pairs. Active state should distinguish selection through surface, border, and/or weight while maintaining normal-text contrast. Hover must remain subordinate to active. Preserve explicit `focus-visible` outlines using available focus/ring tokens and sufficient offset against sidebar and surface backgrounds.

Alternative considered: retain accent fill and change only typography. Rejected because current accent/foreground combination is not reliable for AA small navigation text.

### Make navigation density intentional

Reduce vertical group gaps and normalize section-heading rhythm. Separate workspace navigation from public-site and logout actions with a stable lower divider and visual hierarchy; keep both actions full touch targets. Make sidebar brand block compact enough to protect navigation viewport while following current `C / CURIME / Asociación` visual language at widths that permit it.

Alternative considered: reduce labels or remove section headings. Rejected because role-filtered navigation still benefits from scanable group structure.

### Align shell geometry from common sidebar widths

Derive header content offset and main left margin from same compact/expanded sidebar width values already used by shell. Preserve main `max-w-[1280px]`; only adjust internal gutters and padding so breadcrumb and outlet headers share a visual axis.

Alternative considered: set a separate header container max width. Rejected because it creates a second alignment system and weakens relationship to dynamic rail width.

## Risks / Trade-offs

- [Header reflow changes visual reading order] → Keep semantic navigation and user text order logical; verify at 320px and 375px with long names and roles.
- [Compact contextual links may become visually dense] → Use fixed icon-control dimensions, no indentation, labels on hover/focus, and preserve accessible text.
- [Semantic colors can still fail contrast in opacity variants] → Restrict text to known high-contrast foreground tokens; manually inspect active, hover, focus, and disabled states.
- [Local markup changes could regress Sheet/navigation tests] → Retain role names, aria attributes, skip target, link labels, handlers, and test critical invariants.
- [Sidebar/header transition can cause perceived movement] → Limit transitions to width, margin, and color/background; rely on existing reduced-motion override.

## Migration Plan

1. Apply presentation changes only in `ErpLayout.tsx`; add focused assertions in `ErpLayout.test.tsx` only if structural semantics change.
2. Manually review shell at 320px, 375px, 768px, 1024px, 1280px, and 1440px+ with long user/role values and active Inventory child routes.
3. Run focused layout test and project verification after Daniel reviews changes.
4. Roll back by reverting the isolated shell commit; no migration, persisted state, API, or data rollback is needed.
