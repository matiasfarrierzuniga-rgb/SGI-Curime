# SGI-Curime Agent Orchestrator

## Purpose

Coordinate the repository skills so that SGI-Curime keeps strong engineering discipline while also producing a polished, distinctive and modern frontend.

A technically correct interface that still looks unfinished is not considered complete when the task is explicitly visual.

This file defines **which guidance leads**, **which guidance constrains**, and **how conflicts are resolved**. It does not replace the detailed skills or `frontend/CONVENTIONS.md`.

---

## Sources of truth

Use the following precedence for repository work:

1. The user's explicit task and scope.
2. Authoritative backend contracts, domain rules and capability rules.
3. This `AGENTS.md` for skill orchestration.
4. `frontend/CONVENTIONS.md` for frontend architecture, tooling, design tokens and implementation conventions.
5. Relevant local SGI skills under `.agents/skills/`.
6. External/global skills as specialists or reviewers when available.

When two instructions conflict, prefer the source with higher authority and preserve the narrower explicit task contract.

Do not invent backend endpoints, domain states, capabilities, business rules, routes or fields.

---

## Core invariant skills

For code changes, always preserve the contracts defined by:

- `sgi-development-foundation`
- `sgi-frontend-architecture` when frontend structure or dependencies are affected

These are **engineering guardrails**, not creative directors.

Interpret "prefer the smallest change" as:

> Prefer the smallest behavioral and architectural change necessary to satisfy the task.

It does **not** mean minimizing legitimate visual work when the task explicitly requests a redesign, visual refinement or UI polish.

A visual task may substantially change composition, spacing, typography, responsive layout and presentation inside the approved scope while keeping behavior and architecture unchanged.

---

## Skill routing by task type

Do not treat every available skill as equally relevant to every task. Activate only the guidance needed for the current task.

### Visual design, styling or UI polish

Lead with:

- `sgi-frontend-design`

Complement, when available, with:

- `design-taste-frontend`
- `improve-ui`
- `ui-ux-pro-max` for critique or additional UX review

Validate with:

- `sgi-responsive-accessibility`
- `baseline-ui`

For these tasks, visual quality is part of the acceptance criteria.

### Frontend architecture or refactoring

Lead with:

- `sgi-development-foundation`
- `sgi-frontend-architecture`
- `frontend/CONVENTIONS.md`

Use design skills only if the task also changes presentation.

### Forms and data-entry UX

Use:

- `sgi-forms-validation`
- `sgi-frontend-design`
- `sgi-responsive-accessibility`

For visual refinement, also use `design-taste-frontend` and `improve-ui` when available.

Form behavior, validation and backend contracts remain authoritative; visual improvement must not silently change business semantics.

### Dashboard, AppShell or navigation

Use `sgi-dashboard-ux` when the task affects:

- dashboard composition;
- ERP/AppShell;
- sidebar or topbar;
- module grouping;
- authenticated navigation;
- capability/role visibility.

Do not invoke it for isolated controls or unrelated feature screens when navigation is not part of the task.

### Motion and animation

Use `fixing-motion-performance` only when animation already exists, is being introduced, or motion performance is explicitly part of the task.

Motion must communicate state, hierarchy or spatial relationship. Avoid decorative animation without product value.

---

## Role of baseline-ui

`baseline-ui` is a **quality guardrail**, not the product's art director.

Use it to detect:

- inconsistent spacing;
- weak hierarchy;
- excessive decoration;
- poor responsive behavior;
- inaccessible interactions;
- visual noise;
- inconsistent components.

Do not let generic baseline recommendations erase SGI-Curime's established visual identity or force every interface into a neutral generic SaaS appearance.

Design first within SGI's identity; then use baseline and accessibility guidance to validate the result.

---

## SGI-Curime visual identity

`frontend/CONVENTIONS.md` and the established Tailwind theme tokens are the source of truth for the visual system.

Preserve the institutional Curime / Nicoya / Guanacaste identity.

Typography:

- DM Sans for interface, controls, navigation, forms, tables and body content.
- DM Serif Display for approved display headings and expressive institutional headings.
- Use `--font-sans` and `--font-heading` as semantic sources of truth.
- Do not introduce another font without an explicit design-system decision.

Prefer:

- clear hierarchy;
- confident typography;
- intentional whitespace;
- balanced proportions;
- restrained borders;
- purposeful elevation;
- consistent iconography;
- meaningful accent color;
- polished interaction states;
- strong desktop, tablet and mobile composition.

Avoid:

- generic template appearance;
- making every section a card;
- excessive rounded containers;
- arbitrary one-off styles that bypass tokens;
- unnecessary gradients, glassmorphism or neon;
- decorative motion without purpose;
- copying another product's visual identity literally.

External references and prototypes may be used to study layout, hierarchy, spacing, density and interaction patterns while preserving SGI behavior, accessibility and branding constraints.

---

## Architecture versus visual freedom

Never confuse architectural stability with visual conservatism.

For an explicitly visual task, the agent may improve substantially within the affected presentation scope:

- DOM composition inside the presentation layer;
- Tailwind utility composition;
- spacing and rhythm;
- typography and hierarchy;
- responsive layouts;
- field grouping;
- buttons and action hierarchy;
- visual states;
- icons;
- supporting copy when it does not alter domain semantics;
- shared UI primitives when genuine reuse justifies them.

Do not silently change:

- backend contracts;
- API behavior;
- server-state ownership;
- TanStack Query semantics;
- capabilities or authorization;
- route semantics;
- domain rules;
- feature dependency boundaries.

---

## Visual task workflow

For frontend visual work:

1. Inspect the current screen/component and nearby shared primitives before editing.
2. Identify the visual problems and intended hierarchy.
3. Determine which skills actually apply.
4. Preserve behavior, contracts and feature boundaries.
5. Implement the visual improvement to the depth requested by the task.
6. Review desktop, tablet and mobile composition.
7. Review relevant hover, focus, active, disabled, loading, empty and error states.
8. Validate keyboard usability, semantics, contrast and focus behavior.
9. Confirm consistency with design tokens and neighboring SGI screens.
10. Report remaining visual debt separately instead of expanding scope silently.

Do not stop after superficial class changes if the requested visual problem remains unresolved.

---

## Definition of done for visual work

An explicitly visual frontend task is complete only when:

- requested behavior remains correct;
- architecture and feature boundaries remain valid;
- responsive behavior is intentional;
- accessibility is preserved;
- established design tokens are respected;
- hierarchy is clearly improved;
- spacing and alignment are coherent;
- action priority is visually understandable;
- interaction states are polished where relevant;
- the result no longer looks like an unfinished generic template.

Engineering correctness alone is not sufficient for a visual task.

---

## Testing and validation

Follow `sgi-development-foundation` and `frontend/CONVENTIONS.md` for relevant quality gates.

When the user explicitly states that they will execute tests themselves, do not run the project test suites automatically. Instead, identify the focused tests and verification commands they should execute.

Do not expand a visual task into unrelated fixes merely because validation reveals pre-existing debt. Report unrelated findings separately unless they block correctness of the requested change.

---

## Scope discipline

Improve boldly **inside the requested scope** and conservatively **outside it**.

Do not redesign unrelated modules, migrate unrelated architecture or introduce new dependencies unless the task explicitly requires it.

When a task is primarily visual, visual ambition is allowed and expected as long as behavior, accessibility, architecture and SGI's identity remain protected.
