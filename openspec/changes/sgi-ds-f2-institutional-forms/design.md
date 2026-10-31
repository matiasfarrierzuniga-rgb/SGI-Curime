# Design

## Context

See `proposal.md` for motivation. The repository already defines institutional tokens in `frontend/src/tailwind.css`, shared `Input`, `Select`, `Textarea`, `FormField` and Base UI `Field` primitives. React Hook Form, Zod and the resolver are installed and used by several features, while `InstitutionalProfilePage` still coordinates its four-step form with local state and a manual email check. Junta, Asambleas and Afiliados have working verticals but remain heterogeneous form consumers.

## Goals / Non-Goals

**Goals:**

- Make the shared field/control semantics explicit and testable.
- Use Perfil institucional as the lowest-risk pilot because its API, capability boundary, payload mapping and focused tests already exist.
- Preserve current user-visible flow and server contract while improving validation consistency.
- Produce an Azure DevOps-ready follow-up backlog for the three remaining institutional verticals.

**Non-Goals:**

- No backend or database changes.
- No new capability, endpoint, route, role or institutional rule.
- No automatic migration of every legacy/native form in this increment.
- No inference of legal data, board appointments, assembly outcomes or affiliate status.

## Decisions

### Preserve shared primitive boundaries

Keep controls in `frontend/src/shared/ui/` and keep domain schemas, hooks and form composition in `frontend/src/features/institutional-profile/`. Do not move business validation into shared UI.

### Use native registration for the pilot

Use React Hook Form registration for native `Input`, `Select` and `Textarea`; reserve a controller abstraction for controls that cannot expose a compatible ref/value contract. This minimizes code and avoids a new generic form wrapper.

### Keep nullable mapping at the feature boundary

Zod validates user input; the feature mapper continues to trim text, normalize email and convert blank optional values to `null`. The API payload remains unchanged.

### Treat other institutional forms as sequenced work

Junta Directiva, Asambleas and Afiliados receive separate PBIs after DS-F2. This avoids mixing form migration with board/assembly domain rules and keeps the existing backend authorization mismatch for Afiliados visible as a dependency.

### Verification before completion

Focused Vitest tests, architecture check, build and manual keyboard/responsive review are required. Test results remain `NOT_EXECUTED` until Daniel runs them; no result is pre-certified.

## Risks / Trade-offs

- **RHF/Zod changes validation timing** → preserve current step transitions and assert no duplicate submit, payload shape or lost values in tests.
- **FormField and Base UI `Field` coexist** → document the pilot boundary and avoid a broad rename/refactor.
- **Existing pages use local class overrides** → remove only redundant control-base styles in the pilot; defer unrelated cleanup.
- **Backend authorization differs for Afiliados** → keep its migration as a separate PBI; DS-F2 does not change guards.

## Migration Plan

1. Add or refine focused shared-control tests and only the smallest contract-preserving primitive changes.
2. Add the Profile institutional schema/registration and preserve the current mapper/API boundary.
3. Run focused tests, architecture check and build in an isolated APPLY workspace.
4. Roll back by reverting the frontend change; no migration or data rollback is required.

## Open Questions

- Exact migration order for Junta, Asambleas and Afiliados after this pilot is a sprint-planning decision; it does not alter this change's contract.
