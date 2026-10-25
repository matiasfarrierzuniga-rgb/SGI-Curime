# SGI-Curime Engineering Guide

## Purpose

Shared guide for every SGI-Curime agent and collaborator. It applies to backend, frontend, persistence, security, documentation, testing and requirements work.

Preserve existing contracts, architecture rules and authorized scope. Functional decisions must retain traceability to related V2 use cases, V1 evidence and OpenSpec when applicable.

Visual improvement is a priority only for tasks explicitly scoped to UI/UX or visual refinement. The existing frontend design and quality rules remain authoritative for that work.

This file defines shared guidance, precedence and constraints. It does not require delegation to specialized agents or replace detailed skills, backend rules or `frontend/CONVENTIONS.md`.

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

The default goal is:

> Preserve contracts and architecture. Deliver authorized scope. Improve visual quality boldly only inside an explicitly visual frontend task.

---

## Alcance para cualquier agente o compañero

- Trabaja con **un agente ejecutor por tarea**. No delegues automáticamente en Terra, Atlas, Forge, Pixel, Sentinel ni otros agentes históricos. Los archivos `backend/AGENTS.md` y `frontend/AGENTS.md` son **reglas por directorio**, no otros agentes.
- No nombres una rama, worktree, commit, permiso o estado de despliegue como vigente sin verificar Git, código y configuración actuales. `PROJECT-STATE.md` es evidencia operativa que puede estar desactualizada: si contradice Git, informa la discrepancia sin corregirla silenciosamente.
- Respeta `CONTRIBUTING.md`: los cambios compartidos entran por rama dedicada, revisión y Pull Request hacia `main`, no por push directo.
- Cuando el árbol contiene modificaciones o untracked ajenos, no los sobrescribas, limpies, muevas ni incorpores al cambio. No uses `reset --hard`, `clean`, `stash`, `rebase`, `merge` ni `switch` para resolver el bloqueo sin instrucción expresa y plan de preservación. Puede hacerse análisis de solo lectura aun si el árbol está sucio.
- Las fases son **EXPLORE** (inspección sin cambios), **PROPOSE** (especificación en workspace aprobado), **APPLY** (código solo con autorización expresa), **VERIFY** (evidencia de pruebas) y **ARCHIVE** (cerrar especificaciones solo cuando corresponda). No infieras permiso para APPLY a partir de una solicitud de análisis.
- Diferencia en cada informe `IMPLEMENTED`, `PROPOSED`, `PARTIAL`, `BLOCKED` y `NOT_VERIFIED`; nunca marques pruebas `PASSED` sin ejecutarlas ni afirmes que una tabla equivale a un proceso funcional completo.
- Documenta cada incremento con objetivo, alcance, exclusiones, archivos afectados, contratos API/DB, migración/rollback si aplica, pruebas y riesgos. Evita correcciones fuera de alcance.
- Nunca ejecutes migraciones, seeds, resets, backfills o suites destructivas contra datos reales sin autorización expresa, copia restaurable y entorno identificado. No imprimas datos personales, secretos, contraseñas ni tokens completos.
- Todo cambio funcional debe identificar los CU V2 relacionados, contrastarlos con código, pruebas y contratos vigentes de V1, y declarar por separado estado de especificación, implementación y validación. El catálogo V2 puede permanecer `NOT_VERIFIED` localmente hasta que su fuente inmutable se incorpore y valide.
- Un CU del catálogo V2 no prueba que exista código V1 ni aprueba una regla institucional. Conserva los identificadores originales `CU-01` a `CU-155`; enlaza los CU relacionados con reglas, OpenSpec, historias de usuario y evidencia de pruebas, indicando referencias pendientes.

## Autoridad y documentación

1. Instrucciones explícitas y alcance aprobado por el responsable del proyecto.
2. Evidencia actual de código, restricciones de base de datos, pruebas y configuración verificadas en la rama de trabajo (y `main` como referencia de integración).
3. Decisiones arquitectónicas y reglas institucionales expresamente aprobadas.
4. Este `AGENTS.md` y sus reglas especializadas en `backend/` y `frontend/`.
5. `frontend/CONVENTIONS.md`, `CONTRIBUTING.md` y documentación técnica vigente, siempre cotejadas con el código.
6. OpenSpec, especificaciones de casos de uso y documentación histórica, con su estado documental explícito.

Una propuesta de OpenSpec no sustituye un contrato implementado ni modifica decisiones institucionales por sí misma. El catálogo de **155 casos de uso V2** corresponde a la especificación documental V2, no a 155 funcionalidades implementadas en V1. Preserva los identificadores CU y no mezcla estados de ambos repositorios.

## Contrato transversal de identidad y registro comunitario

Antes de tocar `/register`, `UserRequest`, `Person`, `User`, `Role`, `Permission`, `AccountActivationToken`, correo o autenticación, lee **`docs/decisions/community-account-registration.md`**. Es un **contrato objetivo en estado PROPUESTO**, no evidencia de que el comportamiento ya cambió.

- **Comportamiento actual verificado en V1 (baseline PR #114):** el `/register` público genera `UserRequest(PENDING)`; una revisión con `usr.user-requests.review` aprueba, resuelve una `Person` existente y crea `User(INACTIVE)` más token; la activación establece contraseña y permite iniciar sesión. La aprobación puede bloquearse si la `Person` no existe o es ambigua.
- **Cambio objetivo sujeto a OpenSpec y aprobación:** registro comunitario abierto con nombre, correo, contraseña, verificación de correo y activación **sin aprobación administrativa de una cuenta básica**.
- Verificar un correo demuestra control del buzón, **no identidad legal, afiliación a la ADI, cargo en Junta Directiva ni autorización sobre otras personas o recursos**.
- `Person` (identidad física), `User` (acceso), `Affiliate` (afiliación), `Role`/`Permission` (autorización), `Venture` (emprendimiento), `VolunteerApplication` (postulación) y relaciones de negocio tienen responsabilidades diferentes.
- La cuenta comunitaria no obtiene capacidades de administración del ERP. Las aprobaciones de afiliación, publicación de emprendimientos, representación institucional y permisos privilegiados son procesos independientes.
- El voluntariado debe permitir participación sin cuenta, según su contrato funcional; una cuenta puede facilitar el seguimiento, no ser requisito.
- El modelo V1 actual exige `User.identification` y tiene una ruta de reconciliación `Person` con limitaciones: **no inventar identificaciones, no enlazar automáticamente a un `Person`/`Affiliate` por coincidencia de nombres/correo/cédula y no modificar Prisma o migraciones sin cambio aprobado**.
- Las solicitudes `UserRequest` históricas, las cuentas actuales, tokens/sesiones válidos, seeds, roles y permisos administrativos deben preservarse. No reutilizar el registro público para crear un usuario administrador.

## Integridad entre frontend y backend

- Asegura tres niveles para operaciones protegidas: visibilidad/acciones frontend, rutas frontend y **control de autorización en API**. Ocultar un botón no constituye protección.
- Los permisos efectivos se derivan en servidor de la persistencia. No confíes en `roleId`, `permissionCodes` o identidad enviada por el navegador para conceder acceso.
- Conserva la arquitectura frontend `app -> features -> shared` y las pautas de `frontend/CONVENTIONS.md`. Para código NestJS y Prisma, aplica `backend/AGENTS.md`.
- Un incremento transversal se certifica con casos positivos, negativos, rutas directas, duplicados, concurrencia, tokens vencidos y compatibilidad. Identifica explícitamente pruebas no ejecutadas.

## Trabajo compartido

- Los archivos `AGENTS.md` deben versionarse y revisarse por PR para que todos los compañeros reciban las mismas reglas. No incluyas secretos ni rutas personales en ellos.
- Si detectas conflicto entre el `AGENTS.md` raíz existente, instrucciones globales locales del agente, documentación o estado real, señala la contradicción y propone un cambio mínimo, sin borrar silenciosamente decisiones anteriores.
- El usuario decide el avance entre fases. Una autorización de escritura documental no autoriza construir, migrar ni desplegar.
