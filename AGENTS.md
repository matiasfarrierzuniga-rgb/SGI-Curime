# SGI-Curime Agent Orchestrator

## Purpose

Coordinate the repository skills so that SGI-Curime keeps its current technical architecture intact while raising the quality of the frontend substantially.

The architecture is considered stable. The current improvement objective is **frontend UI/UX quality**, not architectural redesign.

A technically correct interface that still looks unfinished is not considered complete when the task is explicitly visual.

This file defines which guidance leads, which guidance constrains, and how conflicts are resolved. It does not replace the detailed skills or `frontend/CONVENTIONS.md`.

---

## Sources of truth

Use the following precedence for repository work:

1. The user's explicit task and scope.
2. Authoritative backend contracts, domain rules and capability rules.
3. This `AGENTS.md` for skill orchestration.
4. `frontend/CONVENTIONS.md` for the existing frontend architecture, tooling, design tokens and implementation conventions.
5. Relevant local SGI skills under `.agents/skills/`.
6. External/global skills as specialists or reviewers when available.

When two instructions conflict, prefer the source with higher authority and preserve the narrower explicit task contract.

Do not invent backend endpoints, domain states, capabilities, business rules, routes or fields.

---

## Architecture is stable

Do not refactor, reorganize or redesign the existing frontend architecture unless the user explicitly asks for it or a change is strictly required to preserve correctness.

Preserve:

- `app -> features -> shared` dependency direction;
- current feature boundaries;
- TanStack Query server-state ownership;
- existing routing and capability behavior;
- established shared UI boundaries;
- current backend/frontend contracts.

`sgi-development-foundation`, `sgi-frontend-architecture` and `frontend/CONVENTIONS.md` act as **guardrails** that protect the current architecture.

They are not the primary drivers of visual work.

Interpret "prefer the smallest change" as:

> Avoid unnecessary behavioral, architectural and cross-module changes.

It does **not** mean minimizing legitimate visual improvements inside the requested frontend scope.

---

## Primary objective for frontend work

When the task is about frontend appearance, UI polish, interaction design, responsive behavior or visual quality, the agent should actively improve the interface rather than merely preserve the status quo.

The main areas of improvement are:

- composition;
- visual hierarchy;
- typography;
- spacing and rhythm;
- layout proportions;
- responsive behavior;
- forms and field grouping;
- buttons and action hierarchy;
- tables and information density;
- empty, loading, success and error states;
- hover, focus, active and disabled states;
- iconography;
- dialogs, popovers and overlays;
- clarity and consistency between modules;
- perceived product quality.

Frontend quality is part of the acceptance criteria for visual tasks.

---

## Skill routing for visual frontend work

### Primary design authority

Lead with:

- `sgi-frontend-design`

This skill defines the SGI-Curime visual identity and should be the primary local design authority.

### Visual refinement specialists

When available, complement with:

- `design-taste-frontend`
- `improve-ui`
- `ui-ux-pro-max` for critique or additional UX review

These skills may improve composition, hierarchy, density, proportions and interaction quality, but must remain inside SGI-Curime's established identity and technical boundaries.

### Validation guardrails

Validate the resulting interface with:

- `sgi-responsive-accessibility`
- `baseline-ui`

These are reviewers and quality guardrails, not the product's creative directors.

Design first within SGI's identity; validate afterward for accessibility, consistency and UI quality.

---

## Forms and data-entry UX

For forms, inputs, DatePicker, validation or submission UX, use:

- `sgi-forms-validation`
- `sgi-frontend-design`
- `sgi-responsive-accessibility`

For visual refinement, also use `design-taste-frontend` and `improve-ui` when available.

Preserve validation behavior and backend semantics while improving:

- grouping;
- labels and supporting text;
- field density;
- input affordances;
- date/time controls;
- action placement;
- inline errors;
- loading/submission feedback;
- mobile usability.

---

## Dashboard, AppShell and navigation

Use `sgi-dashboard-ux` when the task affects:

- dashboard composition;
- ERP/AppShell presentation;
- sidebar or topbar;
- module grouping;
- authenticated navigation;
- capability/role visibility.

Keep the existing routing and authorization architecture intact while allowing substantial visual improvements to shell composition, navigation clarity and responsive behavior.

Do not invoke this skill for isolated controls or unrelated feature screens when navigation is not part of the task.

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

---

## Motion

Use `fixing-motion-performance` only when animation already exists, is being introduced, or motion performance is explicitly part of the task.

Motion should communicate state, feedback or spatial relationship. Avoid animation that exists only as decoration.

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

External references and prototypes may be used to study layout, hierarchy, spacing, density, proportions and interaction patterns while preserving SGI behavior, accessibility and branding constraints.

---

## Visual freedom inside a stable architecture

Never confuse architectural stability with visual conservatism.

For an explicitly visual task, the agent may improve substantially inside the affected presentation scope:

- DOM composition within the existing feature/component boundary;
- Tailwind utility composition;
- spacing and visual rhythm;
- typography and hierarchy;
- responsive layouts;
- field grouping;
- buttons and action hierarchy;
- tables and content density;
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
2. Identify the actual visual problems before proposing changes.
3. Define the intended hierarchy, composition and responsive behavior.
4. Determine only the skills relevant to that task.
5. Preserve behavior, contracts and current architecture.
6. Implement the visual improvement to the depth requested by the task.
7. Review desktop, tablet and mobile composition.
8. Review relevant hover, focus, active, disabled, loading, empty and error states.
9. Validate keyboard usability, semantics, contrast and focus behavior.
10. Confirm consistency with SGI design tokens and neighboring screens.
11. Report remaining visual debt separately instead of expanding scope silently.

Do not stop after superficial class changes if the requested visual problem remains unresolved.

---

## Definition of done for visual work

An explicitly visual frontend task is complete only when:

- requested behavior remains correct;
- the existing architecture remains intact;
- responsive behavior is intentional;
- accessibility is preserved;
- established design tokens are respected;
- hierarchy is clearly improved;
- spacing and alignment are coherent;
- action priority is visually understandable;
- relevant interaction states are polished;
- the result feels intentional and production-ready rather than like an unfinished generic template.

Engineering correctness alone is not sufficient for a visual task.

---

## Testing and validation

Follow `sgi-development-foundation` and `frontend/CONVENTIONS.md` for relevant quality gates.

When the user explicitly states that they will execute tests themselves, do not run the project test suites automatically. Instead, identify the focused tests and verification commands they should execute.

Do not expand a visual task into unrelated fixes merely because validation reveals pre-existing debt. Report unrelated findings separately unless they block correctness of the requested change.

---

## Scope discipline

Improve boldly **inside the requested frontend scope** and conservatively **outside it**.

Do not redesign unrelated modules, refactor stable architecture or introduce new dependencies unless the task explicitly requires it.

The default goal for current frontend work is:

> Preserve the architecture. Improve the experience. Raise the visual quality.

---

## Cooperative agent team (multi-agent operating system)

This repository runs inside the global multi-agent architecture (see
`~/.config/opencode/MULTI-AGENT.md` and the global agents under
`~/.config/opencode/agents/`). The sections above remain the authoritative
sources of truth for frontend work. This section adds the team routing and
does not rewrite them.

### Roles

| Agent | Role | Primary ownership in this repository |
|---|---|---|
| `terra` | Tech Lead | coordination, sequencing, contract integrity, escalation. Not a universal implementer. |
| `pulse` | Scrum Master | reads reports and git state; reports evidence-backed status. Never edits code. |
| `atlas` | Database | `backend/prisma` schema, migrations, relations, constraints, indexes. |
| `forge` | Backend | `backend/` NestJS controllers, services, DTOs, APIs, authorization, business rules. |
| `pixel` | Frontend | `frontend/` React/TypeScript, UI, UX, accessibility, forms, TanStack Query (uses the frontend skills below). |
| `sentinel` | QA | review, regression, test case design, evidence review. Never runs the project test suite. |

### Routing

- **Direct mode:** Daniel talks to a single specialist directly (e.g. `@pixel`) for a
  small single-domain task. No orchestrator needed.
- **Orchestrated mode:** Daniel routes an objective through `terra` when it crosses
  domains (e.g. schema + API + UI). Terra selects the minimal specialist set from the
  table above and follows the global `orchestration` skill.
- Specialists must honor the precedence in "Sources of truth" above. This AGENTS.md
  still wins for frontend-specific routing and skill selection.

### Domain-specific skill selection

Specialists pick the relevant local and global skills, never all of them:

- Atlas: no local SGI skill exists; use `agent-report` and `handoff`, plus global
  protocol skills.
- Forge: `sgi-development-foundation` for repository safety and conventions.
- Pixel: the frontend skills routed in this AGENTS.md (`sgi-frontend-design`,
  `sgi-frontend-architecture`, `sgi-forms-validation`, `sgi-dashboard-ux`,
  `sgi-responsive-accessibility`, `sgi-development-foundation`) and `frontend/CONVENTIONS.md`.
- Sentinel: `sgi-development-foundation` for quality gates; see the Sentinel rule below.

### Sentinel rule (critical)

Daniel executes the project test suites personally. Sentinel inspects tests, designs
test cases, prepares exact commands, and analyzes results Daniel provides. Sentinel
does **not** execute the suite automatically. Validation vocabulary:
`NOT_EXECUTED | PASSED | FAILED | NOT_APPLICABLE`. Never claim `PASSED` without
evidence of a real run. This reinforces the "Testing and validation" section above.

### Reports and evidence

- Every participating agent produces an Agent Report (protocol `agent-report`).
- Operational evidence lands in `.opencode/reports/<YYYY-MM-DD>/` (git-ignored).
- Persistent documentation is handled separately/manual with explicit human approval.
- Contradictions between reports are marked `UNRESOLVED` and raised to Daniel. They
  are never resolved silently.

### Human authority

Daniel remains the final authority. Agents escalate (stop and ask) on destructive
changes, major scope expansion, architectural contradictions, irreversible actions,
credential needs, or any decision Daniel reserves for himself. No micro-approval for
trivial actions.
