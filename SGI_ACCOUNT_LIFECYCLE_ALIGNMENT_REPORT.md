# SGI Account Lifecycle Alignment Report

## Estado

- **Estado del incremento:** IMPLEMENTED — documentación y gobernanza.
- **Código funcional y base de datos:** sin cambios.
- **HEAD inicial:** `ebfdaaa39590bc9129c3435c3b24d790beea23f6`.
- **Rama:** `feat/p0-governance-inventory-rbac-v2-3`.
- **CP-03 preservado:** `f55f3fc`.
- **CP-04 preservado:** `ebfdaaa`.
- **`.archify/`:** untracked preexistente, excluido del checkpoint.

## Archivos inspeccionados

- Código comunitario frontend: registro, verificación, API, modelos, rutas y pruebas.
- Código comunitario backend: controller, service, DTOs, tokens, estados y pruebas.
- CP-04: controller, DTO, caso de uso, repositorio, capability, auditoría, UI y pruebas.
- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md` y `frontend/CONVENTIONS.md`.
- Decisiones y cambios: `docs/decisions/community-account-registration.md`, `docs/changes/community-email-activation-stage1.md`, `docs/changes/community-account-security.md`.
- OpenSpec: `community-account-self-service-v1`, `account-person-linking-v1`, `reconcile-institutional-access-contract-v1` y `complete-person-first-identity-ownership-v1`.

## Contradicciones corregidas

1. Frontend y backend instructions describían como futuro un formulario con nombre y contraseña durante registro; código actual usa correo solamente y establece contraseña durante verificación.
2. Guías antiguas presentaban `UserRequest`/aprobación como AS-IS del autorregistro; contrato actual separa autorregistro comunitario de compatibilidad histórica.
3. OpenSpec comunitario contenía requisitos históricos de contraseña al registro, migración y tareas incompletas sin una advertencia operativa; ahora está marcado `SUPERSEDED / HISTORICAL / PARTIAL`.
4. OpenSpec request-first conserva evidencia válida de RBAC, pero su flujo público fue marcado histórico para impedir que vuelva a imponerse aprobación administrativa.
5. CP-04 quedó explícitamente delimitado como vinculación administrativa posterior, sin dependencia de `UserRequest` para el registro comunitario.

## Contrato canónico elegido

`docs/contracts/account-lifecycle-v1.md` es la única referencia operativa vigente. Define:

- Registro por correo en `POST /community-accounts/register`, respuesta neutral y estado `PENDING_EMAIL_VERIFICATION`.
- Validación no consumidora, establecimiento de contraseña y activación mediante `validate-token` y `verify-email`.
- Reenvío controlado, tokens hash/expirables/de un solo uso, y separación de `Mi Comunidad` frente al ERP.
- Vinculación explícita posterior mediante `POST /identity/account-person-links`, capability `system.identity.manage`, evidencia administrativa, transacción y auditoría.
- Separación de `User`, `Person`, `Affiliate`, nombramientos, roles y permisos.
- `UserRequest` y activación administrativa como compatibilidad histórica, no como requisito ordinario.

## Archivos modificados

- `docs/contracts/account-lifecycle-v1.md` — nuevo contrato canónico.
- `AGENTS.md`, `frontend/AGENTS.md`, `backend/AGENTS.md` — referencias e instrucciones vigentes.
- `docs/decisions/community-account-registration.md` — marcado `SUPERSEDED / KEEP_REFERENCE`.
- `docs/changes/community-email-activation-stage1.md` — marcado `KEEP_REFERENCE / PARTIAL`.
- `docs/changes/community-account-security.md` — referencia canónica añadida.
- OpenSpec de comunidad, CP-04, acceso institucional y Person-first — estados de vigencia/supersesión añadidos sin falsificar tareas.
- Este informe.

## Documentos supersedidos y eliminaciones

- `community-account-registration.md`: conservado como decisión histórica; no eliminado porque contiene trazabilidad y evidencia única.
- `community-account-self-service-v1`: conservado como planning histórico/partial; no se marcaron tareas restantes como completadas.
- `reconcile-institutional-access-contract-v1`: request-first público marcado histórico; evidencia de RBAC conservada como referencia.
- `complete-person-first-identity-ownership-v1`: permanece `VIGENTE PARCIAL / PLANNING`; Stage C–E no se declararon completados.
- **Archivos eliminados:** ninguno. No hubo eliminación segura que aportara valor frente a preservar evidencia.

## Instrucciones corregidas

Las tres guías activas ahora ordenan consultar primero el contrato canónico y contrastarlo con código/pruebas. Ninguna exige contraseña durante el registro inicial, aprobación administrativa para autorregistro, vinculación automática, afiliación automática o permisos derivados de nombramientos.

## Estado OpenSpec

| Cambio | Clasificación | Validación |
| --- | --- | --- |
| `community-account-self-service-v1` | SUPERSEDED / HISTORICAL / PARTIAL | `openspec validate --strict`: PASSED |
| `account-person-linking-v1` | VIGENTE PARCIAL | `openspec validate --strict`: PASSED |
| `reconcile-institutional-access-contract-v1` | SUPERSEDED para registro; KEEP_REFERENCE para RBAC | NOT PASSED: warnings estructurales preexistentes sobre delta/spec; no se reescribió historia |
| `complete-person-first-identity-ownership-v1` | VIGENTE PARCIAL / PLANNING | NOT PASSED: warnings estructurales preexistentes sobre longitud de requirements; Stage C–E siguen pendientes |

Las advertencias de los dos últimos cambios no fueron causadas por el banner documental y no autorizaban alterar sus especificaciones históricas.

## Validación y no regresión

- `git diff --check`: **PASSED**.
- Referencias de agentes: **PASSED** — búsqueda no encontró instrucciones activas obsoletas en `AGENTS.md`.
- OpenSpec comunitario y CP-04 strict: **PASSED**.
- Código funcional modificado por este incremento: **NONE**.
- Pruebas de registro, verificación, autenticación y CP-04: **NOT_EXECUTED** en este incremento documental; fueron evidencia previa preservada por sus checkpoints.
- Base de datos, migraciones, seeds, reconciliación y correo real: **NOT_EXECUTED**.
- Revisión browser: **NOT_EXECUTED**.

## Pendientes reales

- Certificación PostgreSQL desechable, concurrencia HTTP/DB y revisión browser de CP-04.
- Certificación de despliegue, migraciones pendientes de incrementos funcionales previos y correo real.
- OpenSpec histórico request-first requiere futura decisión de archive/supersession formal si el flujo experimental se cierra; este incremento no fingió archive.
- Catálogo V2 y CU relacionados permanecen `NOT_VERIFIED` salvo evidencia local explícita.

## Trazabilidad final

| Proceso | Contrato canónico | Código | Tests/evidencia | Estado |
| --- | --- | --- | --- | --- |
| Registro comunitario | `account-lifecycle-v1.md` §1 | `CommunityRegistrationPage`, `CommunityAccountsController.register`, `CommunityAccountsService.register` | pruebas comunitarias previas y OpenSpec histórico | IMPLEMENTED / TESTED |
| Verificación y activación | §2 | `CommunityEmailVerificationPage`, `validate-token`, `verify-email` | pruebas de token/UX previas | IMPLEMENTED / TESTED |
| Reenvío | §2 | `resend-verification`, servicio comunitario | pruebas focales previas | IMPLEMENTED / TESTED |
| Acceso comunitario/ERP | §4 | auth, `Mi Comunidad`, capability policy | pruebas focales previas; despliegue no certificado | IMPLEMENTED / PARTIAL |
| Vinculación User–Person | §3 | `IdentityAccountLinksController`, `LinkAccountPersonUseCase`, UI Users | CP-04 tests/build previos; DB/browser pendientes | IMPLEMENTED / PARTIAL |
| Compatibilidad histórica | §5 | `UserRequest`, activación histórica y documentación marcada | evidencia OpenSpec preservada | HISTORICAL / PARTIAL |

## Checkpoint

- **Mensaje requerido:** `docs(identity): canonicalize account lifecycle and reconcile agent guidance`
- **SHA:** final checkpoint commit recorded by Git; see `git rev-parse HEAD` (reported with this deliverable).
- El checkpoint no implica despliegue, certificación de base de datos ni merge/push/PR.
