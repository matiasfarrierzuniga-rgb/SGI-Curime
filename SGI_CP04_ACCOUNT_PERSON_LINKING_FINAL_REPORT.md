# SGI CP-04 — Account Person Linking Final Report

## Estado Git

- Rama: `feat/p0-governance-inventory-rbac-v2-3`.
- HEAD inicial: `f55f3fc7e44b7caa89cb9596a6923d4154c77b23`.
- CP-03: preservado en `f55f3fc`.
- Estado al redactar: cambios CP-04 sin checkpoint todavía; `.archify/` permanece untracked y fuera de alcance.

## Contrato implementado

- Endpoint: `POST /identity/account-person-links`.
- Autorización: `system.identity.manage`, declarado en `capability-policy.ts` y concedido al rol canónico `ROLE_SYSTEM_ADMIN` en `canonical-role-grants.ts`.
- DTO: `userId`, `personId`, `verificationMethod = ADMINISTRATIVE_REVIEW`, `evidenceReference` máximo 120 y `reason` máximo 500.
- Actor: se resuelve exclusivamente desde sesión autenticada; ningún actor, rol o permiso llega desde navegador.
- Errores: validación `400`, guard de sesión/capacidad `401/403`, inexistentes `404`, vínculo o carrera `409`.
- Reintento idéntico: `409`; no se declara idempotente porque una vinculación existente no se transfiere ni se revalida silenciosamente.

## Implementación

- Backend: `LinkAccountPersonUseCase`, repositorio Prisma serializable, `updateMany` condicionado por `personId: null`, verificación de cuenta/Persona y error `P2002`/`P2034` mapeado a conflicto.
- Auditoría: `USER_PERSON_LINKED`, módulo `IDENTITY`, actor, cuenta, Persona, método, referencia y motivo se escriben dentro de la misma transacción. Contraseñas, tokens e identificaciones completas no se almacenan en details.
- Integridad: operación escribe solamente `User.personId`; no escribe `Affiliate`, `GovernanceMembership`, rol, permisos, correo, estado, sesiones o datos de Person.
- Frontend: listado de cuentas conserva cuentas sin Persona; acción `Vincular Persona` aparece únicamente desde `actions.linkPerson`. Dialog Base UI busca Personas sin cuenta vinculada, exige selección, referencia y motivo, y refresca TanStack Query tras éxito.
- Flujo Persona sin cuenta: no crea solicitud ni cuenta. La orientación a UserRequest/aprobación queda pendiente de una acción/ruta administrativa ya existente y confirmada.

## Matriz Person-first

| Requisito | Evidencia | Estado |
| --- | --- | --- |
| Unicidad User–Person | `User.personId Int? @unique` Prisma | IMPLEMENTED; sin migración |
| Cuenta sin vínculo | condición `personId: null` y `updateMany` | IMPLEMENTED |
| Persona existente | `person.findUnique` | IMPLEMENTED |
| Conflictos | lectura de ambos lados, serializable, `P2002/P2034` → `409` | IMPLEMENTED; certificación PostgreSQL pendiente |
| Auditoría atómica | `tx.auditLog.create` tras update, misma transacción | IMPLEMENTED; integración DB pendiente |
| Migración histórica | no ejecutada ni requerida | NOT_APPLICABLE |

## Base de datos

- Cambio de esquema: **No**. La relación única nullable ya existe.
- Migración pendiente: **No**.
- Escritura en BD real: **No ejecutada**.
- Certificación PostgreSQL de concurrencia: `PENDING_DB_AUTHORIZATION`. Ejecutar solamente contra instancia desechable restaurable; no se autoriza `prisma migrate`, seed, backfill ni reconciliación contra datos reales.

## Validación ejecutada

- Backend build: **PASSED** — `npm.cmd run build`.
- Backend focal users: **PASSED** — 16 suites, 98 pruebas; una suite/skipped y 8 tests skipped existentes.
- Frontend focal Users: **PASSED** — 10/10.
- Frontend lint: **PASSED** con warnings Fast Refresh existentes.
- Frontend arquitectura: **PASSED**.
- Frontend build: **PASSED**; advertencia de bundle mayor a 500 kB existente.
- OpenSpec strict: **PASSED**.
- Revisión visual navegador y breakpoints 320/375/768/1024/1440: **NOT_EXECUTED**.
- Pruebas HTTP `401/403`, auditoría-fallo y concurrencia PostgreSQL: **PENDING_DB_AUTHORIZATION** / pendientes en tareas OpenSpec.

## Estado historias

- US-ACCOUNT-LINK-01: **PARTIAL** — cuentas sin Persona visibles y selección segura disponible; estado de cuenta dentro de Junta Directiva no se añadió para no convertirla en segundo módulo de cuentas.
- US-ACCOUNT-LINK-02: **PARTIAL** — endpoint, guard, validación, conflicto, transacción y auditoría implementados; falta certificación HTTP y PostgreSQL.
- US-ACCOUNT-LINK-03: **PARTIAL** — no se crea sistema paralelo; falta enlazar orientación UI a un contrato administrativo existente confirmado.
- US-ACCOUNT-LINK-04: **PARTIAL** — Dialog explica separación; falta revisión visual manual.

## Riesgos y exclusiones

- `BOARD-UI-02 — Corregir flujo Sustituir nombramiento`: pendiente, no modificado.
- Person-first Stage C sigue incompleto; CP-04 no reconcilia masivamente ni vuelve obligatorio `User.personId`.
- No hay transferencia de cuentas ni asignación de permisos por afiliación o cargo.
- CU V2 relacionados: identidad/cuentas y afiliación; catálogo inmutable local sigue `NOT_VERIFIED`.

## OpenSpec

- Cambio: `openspec/changes/account-person-linking-v1/`.
- Artefactos completos y `openspec validate --strict` aprobado.
- Tareas: 1/10 completa. Implementación presente queda **PARTIAL** hasta completar cobertura HTTP, concurrencia DB, UI focal y revisión visual.
