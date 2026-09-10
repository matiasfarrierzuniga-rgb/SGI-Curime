## 1. Shell Composition

- [x] 1.1 Refine `ErpLayout` header composition to preserve navigation trigger, breadcrumb, user name, and role without shell-originated horizontal overflow from 320px upward.
- [x] 1.2 Align header, responsive sidebar offsets, and main content gutter while retaining existing `Outlet` placement and 1280px content cap.
- [x] 1.3 Adapt sidebar and Sheet brand presentation to current Curime lockup language within the existing layout file.

## 2. Navigation Presentation

- [x] 2.1 Rebalance navigation group headings, spacing, and lower workspace actions for readable density without changing navigation data or filtering.
- [x] 2.2 Implement compact-rail presentation for links and active Inventory children that fits within 80px and exposes a local visual label on hover/focus while preserving accessible names.
- [x] 2.3 Update active, hover, and focus-visible styles with existing semantic tokens and contrast-safe foreground/background pairs.
- [x] 2.4 Limit shell motion to functional width, margin, color, background, and interaction transitions compatible with existing reduced-motion support.

## 3. Regression Coverage And Manual Validation

- [x] 3.1 Update `ErpLayout.test.tsx` only if needed to protect changed accessible structure or existing navigation, Sheet, skip-link, and logout invariants. Updated the Sheet dialog assertion for `Navegación de SGI-Curime`.
- [x] 3.2 Manually inspect 320px and 375px with long names and roles; confirm no horizontal overflow and usable Sheet navigation.
- [x] 3.3 Manually inspect 768px, 1024px, and 1280px compact rail, including active Inventory children, keyboard focus labels, and complete navigation access.
- [x] 3.4 Manually inspect 1440px+ expanded sidebar, header/content alignment, brand presentation, active/focus contrast, and reduced-motion behavior.
- [x] 3.5 Have Daniel run `npm run test -- ErpLayout.test.tsx`, `npm run verify`, and `git diff --check`; do not run them automatically as part of this change.
