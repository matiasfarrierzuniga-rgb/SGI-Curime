## Why

El shell ERP concentra toda la navegación autenticada, pero su composición actual se comprime en móvil, puede desbordar la subnavegación dentro del rail compacto y usa estados visuales con contraste insuficiente. Este cambio eleva calidad, legibilidad y coherencia institucional sin modificar comportamiento, autorización ni arquitectura.

## What Changes

- Refine `ErpLayout` as a visual-only, presentation-focused change using existing semantic tokens.
- Recompose mobile header so breadcrumb, user identity, role, and navigation trigger remain usable without horizontal overflow from 320px.
- Improve expanded and compact sidebar density, grouping, active/hover/focus states, contextual inventory subnavigation, lower actions, and compact-label affordances.
- Align header and content geometry across tablet and desktop while preserving current content maximum width and layout breakpoint model.
- Unify sidebar and mobile Sheet branding with current Curime lockup conventions.
- Retain discreet width, margin, color, background, and interactive-state motion while honoring reduced-motion preferences.

## Capabilities

### New Capabilities

None. This change introduces no functional capability.

### Modified Capabilities

None. This change does not alter user-visible functional requirements, routes, authorization, or contracts; `skip_specs: true` records the presentation-only scope.

## Impact

- Primary code: `frontend/src/app/layouts/ErpLayout.tsx`.
- Optional structural regression coverage: `frontend/src/app/layouts/ErpLayout.test.tsx`.
- Reference only: ERP navigation, shared UI primitives, `PageHeader`, and `tailwind.css`.
- No changes to APIs, backend, dependencies, router, guards, auth, roles, capabilities, navigation data, route behavior, or outlet pages.
