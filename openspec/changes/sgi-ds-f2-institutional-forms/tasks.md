# Tasks

## 1. Shared DS-F2 contract

- [x] 1.1 Confirm the shared-control acceptance matrix for `FormField`, `Input` and `Select` against current tokens and neighboring primitives; verify no API, route, capability or backend contract is changed.
- [x] 1.2 Add focused tests for label association, descriptions, errors, required semantics, invalid state, disabled state, keyboard focus and minimum touch target; verify assertions use accessible roles/names/descriptions.
- [x] 1.3 Reconcile only necessary primitive classes/props with the acceptance matrix; verify existing consumers compile and no feature imports violate architecture boundaries.

## 2. Perfil institucional pilot

- [x] 2.1 Define the feature-local Zod schema and typed form values for the existing nullable profile fields; verify valid values, blank optional values and invalid email behavior match current API expectations.
- [x] 2.2 Integrate React Hook Form into the four-step profile editor using shared `FormField`, `Input`, `Select` and `Textarea`; verify step navigation, back navigation, cancel/reset and accessible focus remain functional.
- [x] 2.3 Preserve normalization and payload mapping at the feature boundary; verify one successful submission sends the existing `UpdateInstitutionalProfileInput`, converts blanks to `null`, and does not fabricate legal data.
- [x] 2.4 Extend `InstitutionalProfilePage` tests for validation, single submit, loading/disabled, API error, success, permission restriction and keyboard-accessible field messages; verify no request is sent for invalid input.

## 3. Institutional follow-up backlog

- [x] 3.1 Register the Azure DevOps-ready PBIs below as follow-up work without implementing them in this change; verify each has an owner, acceptance criteria and dependency on DS-F2 where applicable.
- [x] 3.2 Record remaining status evidence: Junta backend/frontend functional but domain validation pending; Asambleas workflow functional but native/manual forms remain; Afiliados CRUD functional but backend role guard differs from frontend capability; verify these are not marked complete by the design-system pilot.

## Sprint Backlog — Azure DevOps export

| Epic | Feature | PBI | Task | Responsable | Prioridad | Criterios de aceptación | Dependencias |
|---|---|---|---|---|---|---|---|
| SGI Design System | DS-F2 | DS-F2-01 Shared form controls | Contract + tests for FormField/Input/Select | Daniel Marchena | P0 | Labels, descriptions, errors, required, focus, disabled and invalid states pass accessible tests | None |
| SGI Design System | DS-F2 | DS-F2-02 Profile pilot | Migrate Perfil institucional to RHF + Zod | Daniel Marchena | P0 | Four steps, nullable payload, permissions, loading/error/success and no duplicate submit preserved | DS-F2-01 |
| Junta Directiva | Nombramientos | JD-01 | Adopt shared controls in term/appointment forms | Daniel Marchena | P1 | Create/edit period and appointment preserve person-first rules, accessible errors and existing API payloads | DS-F2-01; board contract validation |
| Asambleas | Convocatorias | ASM-01 | Adopt shared controls and schema validation in assembly form | Daniel Marchena | P1 | Create/edit, quorum rules, convocations and attendance preserve current state transitions and accessible errors | DS-F2-01; assembly API |
| Afiliados | Gestión de afiliados | AFF-01 | Adopt shared controls in filters/edit modal | Daniel Marchena | P1 | Search, filters, edit validation, duplicates and cache invalidation preserve current behavior | DS-F2-01; resolve backend capability contract |
| Información institucional | Perfil institucional | ORG-01 | Capture and validate approved institutional data | Daniel Marchena | P1 | Only consciously confirmed values are saved; empty remains `null`; no public-site defaults or legal inference | DS-F2-02; ADI confirmation |

## Workflow follow-up

- Daniel runs focused frontend tests, architecture check and build during VERIFY; results must be reported as `NOT_EXECUTED`, `PASSED` or `FAILED` with evidence.
- Review implementation and verification before any APPLY or ARCHIVE decision.

## VERIFY evidence — 2026-10-30

- `1.1–2.4`: focused DS-F2 tests passed (3 files, 16 tests); architecture check and production build passed.
- `AppRoutes.test.tsx`: passed 59/59 in three consecutive isolated executions with one worker and `fileParallelism=false`. The earlier full parallel run failed five non-stable cases: audit deep-link denial, dashboard capability, authenticated public return, ventures summary, and affiliate requests empty state. No DS-F2 diff touches `AppRoutes`, its tests, routing, capabilities, services, or ERP shell; classify as test-suite interference/timing, `NOT_VERIFIED` for the full suite rather than a DS-F2 regression.
- Whole-suite serialized diagnostic is also invalid as a project gate: 80 files / 457 tests failed due cross-file mock leakage and unmocked HTTP (including `useAuth`/`QueryClient` provider failures and Axios 401/404), outside DS-F2. No unrelated corrective changes applied.
- P1 status remains pending: Junta uses manual local form state in `frontend/src/features/institutional-board/ui/InstitutionalBoardPage.tsx`; Asambleas uses native/manual controls in `frontend/src/features/assemblies/ui/AssembliesAdminPage.tsx`; Afiliados uses frontend route capability `adm.affiliates.read` in `frontend/src/app/router/AppRoutes.tsx`, while backend `backend/src/affiliates/affiliates.controller.ts` uses `@Roles('Administrador')`.
