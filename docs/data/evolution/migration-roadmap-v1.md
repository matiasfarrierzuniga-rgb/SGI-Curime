---
title: SGI-Curime Database Migration Roadmap v1
status: ACCEPTED
target_version: v1
---

# SGI-Curime Database Migration Roadmap v1

## 1. Purpose

Define la secuencia segura para evolucionar el modelo Current reconciliado (baseline `5713e9121f223a14db8b3f7fe4201422e654f0ce`) hasta el **Target Data Model v1** aceptado, respetando los nueve gates canónicos y las decisiones cerradas `TM-D01..TM-D13`.

- Depende de `evolution/current-target-gap-matrix.md` para el detalle elemento por elemento.
- No introduce entidades Target nuevas.
- No reabre decisiones ni gates.
- No implementa base de datos; es el plan de secuencia de implementación.
- No asume que la infraestructura llegue a `CURRENT` en una sola publicación; prefiere ondas pequeñas revisables.

`MIGRATION_WAVES_TOTAL=13` (`DB-0..DB-12`)

## 2. Canonical migration pattern

Cada cambio sigue el patrón expand → migrate/backfill → verify → enforce → cleanup:

1. **EXPAND** — agregar estructura compatible (columnas/tablas/enums aditivas).
2. **APPLICATION COMPATIBILITY** — desplegar código capaz de leer/escribir representación antigua y nueva donde sea necesario.
3. **BACKFILL** — poblar estructuras nuevas con datos existentes, mediante scripts/reportes revisables.
4. **VERIFY** — ejecutar consultas de reconciliación y gates.
5. **TARGET-FIRST APPLICATION** — conmutar writers/readers al Target.
6. **ENFORCE** — aplicar `NOT NULL`, `UNIQUE`, `FK`, `CHECK`, índices parciales, invariantes financieras, singleton, pricing e identidad; sólo tras pasar el gate correspondiente.
7. **CLEANUP** — retirar campos/enums legacy sólo después de estabilización y cero lectores/escritores legacy.

**La migración destructiva nunca precede a la validación exitosa de un gate.** No hay big-bang.

## 3. Dependency principles

- Padres antes que hijos: identidad antes que FKs; miembros antes que convocatorias; convocatorias antes que asistencia/justificaciones.
- Un gate se pasa antes de imponer su constraint y antes de su limpieza destructiva.
- DB-3 (RBAC) respeta dependencia con DB-4 (gobernanza): se quita la semántica de cargo de `Role` sólo cuando exista estructura de gobernanza o un camino de transición compatible.
- DB-8 depende de DB-7: las FKs de movimiento financiero (Payment/Donation/Disbursement) requieren `FinancialAccount` y el reshape aditivo de `FinancialMovement`.
- DB-10 depende de las semánticas vigentes de inventario; nunca reinterpretar cantidades sin algoritmo.
- DB-11 depende de todas las ondas de backfill previas: sólo se enforcean constraints cuyos gates pasaron.
- Ningún `REMOVE` destructivo ocurre antes de DB-12 salvo que se demuestre seguro y gated.

## 4. Waves

### DB-0 — Baseline Reconciliation

**Status: COMPLETE** (no repetir migración)

- La regresión de `schema.prisma` se reconcilió quirúrgicamente sin crear migración nueva.
- 3 migraciones existentes pendientes se auditaron (aditivas) y aplicaron.
- Estado final: **23/23 migraciones aplicadas**, 0 pendientes, base reconciliada.
- Reconciliado vía **PR #90**; merge baseline `5713e9121f223a14db8b3f7fe4201422e654f0ce`.
- Evidencia completa en `evolution/database-audit-2026-09.md` (HISTORICAL).

### DB-1 — Organization Foundation

**Depende:** DB-0 · **Gate:** — · **First implementation wave: DB-1**

- EXPAND: crear `OrganizationProfile` (tabla singleton).
- Cerrar enforcement singleton (`TM-D01` Option B: fila/clave fija + constraint DB) antes del DDL final.
- Población inicial de atributos institucionales puede requerir configuración manual; cerrar `NB-04` antes de DDL.
- No proliferar `organizationId`.

### DB1_PRE_IMPLEMENTATION_GATE (documental, no modifica Target)

DB-1 **no se declara implementation-ready** hasta cerrar:

- `NB-04`: atributos institucionales de `OrganizationProfile` y semántica de campos legales (sin inventar requisitos).
- `TM-D01` Option B: forma exacta del enforcement singleton (fila/clave fija + constraint DB) y vía de datos institucionales iniciales (configuración manual vs siembra).
- Checkpoint final de Documentation Foundation: Gap Matrix y Roadmap revisados formalmente; aprobación de iniciar DB-1.

No es un cambio de Target estructural; es un cierre de planificación previo al DDL.

### DB-2 — Identity Completion

**Depende:** DB-1 · **Gate:** `ID-01`

Fase interna estricta:

- **DB-2A EXPAND:** compatibilidad aditiva; `UserRequest.reviewedById` → FK nullable `SET NULL` (`TM-D02`); validación referencial previa.
- **DB-2B RECONCILE / BACKFILL:** mapear cada `User` y `Affiliate` a su `Person` canónica; resolver conflictos y cuarentena; no inventar matches.
- **DB-2C APPLICATION SWITCH:** writers/readers del Target.
- **DB-2D VERIFY:** cobertura de reconciliación, resolución de duplicados, cuarentena aprobada y plan de rollback.
- **DB-2E ENFORCE:** NO imponer `personId NOT NULL` al inicio; sólo tras `ID-01` con cero conflictos sin resolver. Enforcement final en DB-11.

La unicidad condicional de `Person` y su semántica null (`NB-01`) se resuelven antes de su DDL en DB-2. Los campos personales duplicados sólo se retiran en DB-12.

### DB-3 — Persisted RBAC

**Depende:** DB-2 · **Gate:** — (cumple dependencia con DB-4)

- ADD: `Permission`, `RolePermission`.
- Seed de capabilities actuales a `Permission.code`.
- Conmutar lecturas/escrituras de autorización; mantener default deny.
- El significado de gobernanza de `Role` se retira sólo después de DB-4 (estructuras de gobernanza existentes o camino de transición compatible).

### DB-4 — Governance Separation

**Depende:** DB-3 · **Gate:** `GOV-HIST-01`

- ADD: `GovernancePosition`, `GovernanceTerm`, `GovernanceMembership` (con `GovernanceTermStatus` cerrado).
- Seed de posiciones válidas.
- No fabricar membresías históricas: mapeo desde roles actuales es `MANUAL`/`VERIFY`, nunca inferencia (`TM-D06` Option C rechazada).
- Agregar partial unique `(termId, positionId, seatNumber) WHERE endedAt IS NULL` en SQL explícito cuando los datos pasen validación.
- `Affiliate.roleId` y acoplamiento de convocatorias con `Role` se marcan para deprecación (REMOVE en DB-12).

### DB-5 — Assemblies Normalization

**Depende:** DB-4 · **Gates:** `ASM-DATE-01`, `ASM-ATT-01` (+ `GOV-HIST-01` para membresías de convocatoria)

- ADD: `AssemblyCall`, `AssemblyMinute`, `AssemblyResolution`.
- ALTER: `Assembly` (`date → scheduledAt`, `heldAt?`, tipo enum); `AssemblyConvocation` (`governanceMembershipId?`, `positionNameSnapshot?`); `AssemblyAttendance` (`convocationId` UQ); `AbsenceJustification` (`attendanceId` UQ).
- Secuenciar padres antes que FK hijos: convocatorias → asistencia → justificaciones.
- No inventar llamadas, actas ni resoluciones históricas (`MANUAL`/`VERIFY`).
- `JUSTIFIED` se depreca durante conversión auditada (nunca conversión silenciosa) y se retira en DB-12.
- Cerrar editorial de `AssemblyMinute` (`NB-03`) antes de su DDL en DB-5.

### DB-6 — Reservations Hardening

**Depende:** DB-5 · **Gate:** `RES-STATUS-01` (sólo prepara; enum cleanup en DB-12)

- Preservar `FREE`/`FIXED`: `FREE => price NULL` sin cargo pagable; `FIXED => price > 0 CRC` con `FinancialCharge.amount` como congelamiento.
- Auditar código de aplicación que hoy exige pricing `FIXED` positivo; habilitar aprobación FREE sin cargo (`NB-09`).
- Mover comportamiento de aplicación hacia el workflow final de cuatro estados.
- No retirar `CONFIRMED`/`COMPLETED` todavía: deprecar; el gate `RES-STATUS-01` desbloquea su remoción en DB-12.

### DB-7 — Treasury Foundation

**Depende:** DB-6 · **Gate:** — (prepara `FIN-ORIGIN-01`)

- ADD: `FinancialAccount`.
- ALTER aditivo de `FinancialMovement`: `accountId` (nullable inicialmente si se requiere), `status POSTED/VOIDED`, `reversalOfId`, `originType`, metadata de void.
- Backfill de cuentas y clasificación; los 2 movimientos `MANUAL` con `sourceId=NULL` reciben asignación deliberada de cuenta, nunca origen reserva/donación (`TM-D10`).
- `POSTED` inmutable: protección de aplicación/DB (`FIN-R04/R05`).
- No remover `source`/`sourceId` todavía.

### DB-8 — Financial Relations

**Depende:** DB-7 · **Gates:** `FIN-ORIGIN-01`, `FIN-DON-01`

- FKs explícitas de movimiento: `Payment.movementId`; `Donation.originalMovementId`; relación de `Disbursement` si la dependencia con DB-9 exige introducción escalonada.
- Semánticas de reversa/void vía `FinancialMovement.reversalOfId`.
- Consolidación a `FinancialMethod` compartido con compatibilidad escalonada (`NB-06`).
- Compatibilidad de `source/sourceId` se mantiene hasta migrar todos los writers/readers.
- Matching de donaciones revisado: primero FK existente, luego matching heurístico con revisión, cuarentena para sin resolver (`TM-D11`); cero donaciones actuales.

### DB-9 — Funding and Expenses

**Depende:** DB-8 · **Gate:** — (enforcement en DB-11)

- ADD: `Expense`, `ExpenseDocument`, `Disbursement`, `FundingAllocation`.
- Implementar `ExpenseStatus` cerrado (`TM-D04`); `Expense` = autorización/registro formal, `Disbursement` = ejecución.
- Funding dividido: `incomeMovementId` nullable, **no** UNIQUE (`TM-D08`); `amount > 0`; sin tabla `FundingSource`.
- Cerrar enforcement de disponibilidad/agregación (`NB-05`).

### DB-10 — Inventory Ledger

**Depende:** DB-9 · **Gates:** `INV-LEDGER-01`, `INV-LOAN-01`

- Introducir `quantityDelta` firmado y `OPENING_BALANCE`.
- Definir algoritmo de opening balance y backfill seguro; **no** reinterpretar simplemente cantidades unsigned.
- `currentQuantity` permanece proyección de cantidad disponible.
- FKs de `InventoryLoan` (checkout/return/cancellation) sólo con evidencia (`INV-LOAN-01`); sin evidencia quedan null/quarantine.

### DB-11 — Constraint Enforcement

**Depende:** DB-1..DB-10 (backfills y app switches previos) · **Gates:** los ya pasados

Aplicar enforcement final sólo de constraints cuyos gates pasaron:

- `NOT NULL`, `UNIQUE`, `FK`, `CHECK`;
- índices parciales (membresía activa);
- invariantes financieras, singleton, pricing, identidad;
- `onDelete` según matriz `TM-D09` y `onUpdate CASCADE`.

Esta onda puede dividirse físicamente en varias migraciones de constraint.

### DB-12 — Legacy Cleanup

**Depende:** DB-11 estabilizado · **Gates:** `ID-01`, `ASM-DATE-01`, `GOV-HIST-01`, `ASM-ATT-01`, `FIN-ORIGIN-01`, `FIN-DON-01`, `INV-LEDGER-01`, `INV-LOAN-01`, `RES-STATUS-01`

**Final cleanup wave.** Sólo después de estabilización y cero lectores/escritores legacy:

- retirar duplicados de identidad/contacto aprobados;
- retirar acoplamiento de gobernanza de security `Role` y `Affiliate.roleId`;
- retirar claves/campos antiguos de Assembly/asistencia/justificación;
- retirar `source`/`sourceId` genérico de `FinancialMovement`;
- retirar `Donation.reversalMovementId`;
- retirar representación legacy de cantidad de inventario;
- retirar `CONFIRMED`/`COMPLETED` del enum de reserva tras `RES-STATUS-01`;
- retirar código/estructuras de compatibilidad obsoletos;
- retirar `IdentityReconciliationManifest` sólo cuando el ciclo de reconciliación esté formalmente completo y ya no se requiera retención.

Ninguna limpieza destructiva por el simple hecho de que Target diga que el campo está deprecado.

## 5. Gate matrix

Definiciones canónicas de los documentos Target (blocks/evidence/exit). `MIGRATION_GATES_COUNT=9`:

| Gate | Wave | Blocks | Evidence required | Exit criterion | Destructive action unlocked |
| --- | --- | --- | --- | --- | --- |
| `ID-01` | DB-2 (enforce DB-11) | `User.personId`/`Affiliate.personId` NOT NULL UNIQUE; remoción de duplicados. | Cobertura de reconciliación, decisiones de duplicados, cuarentena aprobada, rollback. | Cada registro mapea a `Person` canónica o cuarentena aprobada con rollback validado. | Enforcement de identidad (DB-11); retiro de campos duplicados y del manifiesto (DB-12). |
| `ASM-DATE-01` | DB-5 | `heldAt` backfill/enforcement que infiera ocurrencia histórica. | Extracto fresco de fechas y estado; excepciones. | `date → scheduledAt`; `heldAt` sólo con evidencia explícita; excepciones en cuarentena. | Enforcement temporal; retiro de `Assembly.date` (DB-12). |
| `GOV-HIST-01` | DB-4 | Membresías históricas inferidas de security roles. | Mapeo rol↔cargo y snapshots preservados. | Toda membresía tiene evidencia; filas sin mapeo conservan snapshot sin membresía fabricada. | Creación de `GovernanceMembership`; retiro de `Affiliate.roleId` y acoplamiento `Role` en convocatorias (DB-12). |
| `ASM-ATT-01` | DB-5 | FKs nuevas de asistencia/justificación sin mapeo de padres completo. | Reportes de convocatorias, asistencia, justificaciones y excepciones `JUSTIFIED`. | Toda fila enlazada tiene padres verificados; incompletas en cuarentena o fuera de enforcement. | Enforcement de `convocationId`/`attendanceId` (DB-11); retiro de `JUSTIFIED` y claves compuestas (DB-12). |
| `FIN-ORIGIN-01` | DB-8 (enforce DB-11) | Retiro de `source`/`sourceId` genérico. | Clasificación de origen y correspondencia Payment/Donation/Disbursement. | Todo movimiento es manual válido o tiene exactamente un origen verificado; excepciones en cuarentena. | `Payment.movementId` NOT NULL (DB-11); retiro de `source`/`sourceId` (DB-12). |
| `FIN-DON-01` | DB-8 | `Donation.originalMovementId` NOT NULL; retiro de reversa redundante. | Validación FK, matching revisado, excepciones. | Cada donación retenida tiene evidencia original/reversa; sin resolver en cuarentena; cero movimientos fabricados. | Enforcement `originalMovementId` (DB-11); retiro de `reversalMovementId` (DB-12). |
| `INV-LEDGER-01` | DB-10 | Ledger firmado / `currentQuantity` antes de backfill de opening balance. | Algoritmo aprobado, reporte de conversión, saldos no negativos. | Saldos reconstruidos compatibles con cantidad disponible; sin saldo negativo sin resolver. | Enforcement `quantityDelta`/`currentQuantity >= 0` (DB-11); retiro de representación legacy (DB-12). |
| `INV-LOAN-01` | DB-10 | FKs históricas de préstamo sin evidencia. | Reporte evidencia y lista de enlaces nullable/sin resolver. | Sólo enlaces con evidencia; sin soporte quedan null o cuarentena. | Enforcement de FKs de movimiento para filas nuevas (DB-11). |
| `RES-STATUS-01` | DB-6 prep / DB-12 cleanup | Remoción destructiva de `CONFIRMED`/`COMPLETED`. | Auditoría readers/writers, tests actualizados, estado persistido, revisión de remoción de compatibilidad. | Sin lectores, escritores, tests ni filas que dependan de estados legacy; migración de enum aprobada. | Remoción del enum legacy de `Reservation` (DB-12). |

`MIGRATION_GATES_MAPPED=YES`

## 6. Physical migrations

No se exige una migración física por onda.

- Una onda puede contener múltiples migraciones pequeñas.
- Preferir migraciones pequeñas, revisables, reversibles/forward-fix, dependency-safe.
- **Estimación NON-BINDING (NO contractual): planning estimate only, may change during implementation.** El conteo exacto depende de la granularidad de revisión y no es un compromiso.

Justificación por categoría de migración (rango plausible):

| Categoría | Rango | Onda principal |
| --- | ---: | --- |
| EXPAND (tablas/columnas aditivas) | ~12–15 | DB-1/3/4/5/7/9/10 |
| ALTER / FK (reshape de relaciones) | ~8–10 | DB-2/5/7/8/10 |
| ENUM (aditivos y conversiones) | ~4–6 | DB-5/8/10/12 |
| CONSTRAINT (NOT NULL/UNIQUE/CHECK/índices parciales) | ~6–10 | DB-11 |
| CLEANUP (retiro de legacy) | ~4–8 | DB-12 |

Total plausible: **35–50 migraciones físicas pequeñas**. No crear una obligación de producir N migraciones; una onda no es una migración. Los scripts de reconciliación/backfill son de datos, se ejecutan aparte y no se cuentan como schema migrations.

## 7. Backfill scripts

- Separar **schema migrations** de **data reconciliation/backfill scripts**.
- Todo backfill que infiera o transforme historia debe ser explícito y auditable (script/reporte revisable).
- No ocultar mutaciones significativas de datos dentro de SQL de migración opaco cuando un script/reporte es más seguro.
- Idempotencia preferible y verificación repetible.

## 8. Rollback / forward fix

- El rollback destructivo en producción puede ser inseguro después de transformaciones de datos.
- Preferir: backup/checkpoint, expand-first, backfill idempotente donde sea práctico, consultas de verificación y estrategia forward-fix.
- No se promete rollback automático completo de cada migración.

## 9. Non-blocking review follow-ups

Cada ítem (`NB-01..NB-09`) de `docs/data/target-model-review.md` recibe disposición. **Si alguno revelara una contradicción de diseño Target, STOP y reportar blocker; no alterar Target automáticamente.**

| NB ID | Disposition | Affected wave | Required action |
| --- | --- | --- | --- |
| `NB-01` | `RESOLVE_BEFORE_DB2` | DB-2 | Decidir semántica null / unicidad condicional de `Person` antes de su DDL. No bloquea DB-1. |
| `NB-02` | `TRACK_DURING_IMPLEMENTATION` | DB-0/DB-11 | Mantener contrato de consumidor: `entityType/entityId` y snapshots nunca son FK de dominio. |
| `NB-03` | `RESOLVE_BEFORE_DB5` | DB-5 | Cerrar cardinalidad/lifecycle editorial de `AssemblyMinute` antes de su DDL. No bloquea DB-1. |
| `NB-04` | `RESOLVE_BEFORE_DB1` | DB-1 | Confirmar atributos institucionales de `OrganizationProfile` sin inventar requisitos legales. Único ítem que bloquea DDL de DB-1. |
| `NB-05` | `RESOLVE_BEFORE_DB9` | DB-9 | Definir enforcement de disponibilidad/agregación de `FundingAllocation` antes de su DDL. No bloquea DB-1. |
| `NB-06` | `TRACK_DURING_IMPLEMENTATION` | DB-8 → DB-12 | Compatibilidad escalonada de enums financieros; sin swap directo. |
| `NB-07` | `TRACK_DURING_IMPLEMENTATION` | DB-11 | SQL migrations/partial UQ/CHECK/triggers como parte de primera clase del plan. |
| `NB-08` | `TRACK_DURING_IMPLEMENTATION` | DB-6 → DB-12 | Ejecutar auditoría readers/writers/datos ante `RES-STATUS-01`. |
| `NB-09` | `TRACK_DURING_IMPLEMENTATION` | DB-6 | Cambio de aplicación para aprobar reserve FREE sin cargo pagable. |

`NON_BLOCKING_ITEMS_MAPPED=9` · `NON_BLOCKING_ITEMS_COUNT=9` · `RESOLVE_BEFORE_DB1={NB-04}` · `RESOLVE_BEFORE_DB2={NB-01}` · `RESOLVE_BEFORE_DB5={NB-03}` · `RESOLVE_BEFORE_DB9={NB-05}` · `TRACK_DURING_IMPLEMENTATION=5 (NB-02, NB-06, NB-07, NB-08, NB-09)`

## 10. Traceability

- Current element → Gap acción → Migration wave → Gate → Target element está cubierto por la columna `Wave` de `current-target-gap-matrix.md` y por las secciones 4-5 de este documento.
- Todo `ADD`/`ALTER`/`BACKFILL`/`DEPRECATE`/`REMOVE` tiene onda planeada o explicación explícita.
- Todo `REMOVE` destructivo tiene precondición, gate/verificación y onda de cleanup.
- Ninguna onda destruye antes de su gate; ninguna constraint se impone sin backfill o se puebla con historia inventada.

## 11. Quality gate statements

- `ROADMAP_CONTAINS_NO_NEW_TARGET_ENTITIES=YES`.
- `ROADMAP_CONTAINS_NO_NEW_TARGET_DECISIONS=YES`.
- `NO_MIGRATION_WAVE_VIOLATES_A_GATE=YES`.
- `NO_DESTRUCTIVE_CLEANUP_PRECEDES_DB12_UNLESS_PROVEN_SAFE=YES`.
- `NO_NOT_NULL_IMPOSED_BEFORE_REQUIRED_BACKFILL=YES`.
- `NO_FK_CREATED_FROM_INVENTED_HISTORICAL_DATA=YES`.
- `NO_CURRENT_STATE_DESCRIBED_AS_TARGET=YES`.
- `NO_TARGET_STATE_DESCRIBED_AS_IMPLEMENTED=YES`.
- `NO_WHOLE_TABLE_REWRITE_PROPOSED=YES`.

## 12. Relationship to Foundation stages

- Stage 2A produjo el Target aceptado (`ACCEPTED_AND_RECONCILED`).
- Stage 2B produce Gap Matrix y este Roadmap (`READY_FOR_REVIEW`).
- El Gap Matrix y el Roadmap deben revisarse formalmente antes de un checkpoint final de Foundation y antes de iniciar DB-1.

## UPDATE: Roadmap historical; V1.1 implementation documented

This Migration Roadmap v1 is preserved as historical documentation. It records the sequencing from Frozen Target v1 (40 persistent + 1 transitional + 61 relationships) toward DB-12 legacy cleanup.

**V1.1 structural implementation:** The roadmap now documents that Frozen Target V1.1 structural contract is merged and verified at main@71aa989 (PR #102). The 49 persistent entities, 1 transitional entity, and 77 persistent Target relationships represent the completed V1.1 implementation boundary.

**Remaining deferred cleanup:** The following migration gates from the v1 roadmap remain evidence-dependent and are not yet enforced:

- `ID-01`: Person canonical mapping + duplicate-data removal (blocks: identity enforcement, duplicate retirement)
- `ASM-ATT-01`: Complete parent mapping before attendance/justification FKs (blocks: convocation/attendance/justification constraints)
- `FIN-ORIGIN-01`: Explicit-origin reconciliation before generic `sourceId` removal (blocks: Payment/Donation/Disbursement origin constraints)
- `FIN-DON-01`: Donation original/reversal evidence before redundant-field removal (blocks: Donation constraint enforcement)
- `INV-LEDGER-01`: Signed ledger + opening-balance backfill (blocks: Inventory quantity constraints)
- `INV-LOAN-01`: Evidence-backed loan-movement links (blocks: InventoryLoan FK enforcement)
- `ASM-DATE-01`: Date evidence mapping before `heldAt` backfill (blocks: Assembly date/heldAt constraints)
- `RES-STATUS-01`: Non-destructive `CONFIRMED`/`COMPLETED` removal (blocks: ReservationStatus enum cleanup)

**Roadmap status:** This v1 roadmap is historical. It documents the v1 → v1.1 transition planning. The V1.1 package `IMPLEMENTATION_STATUS=IMPLEMENTED` at main@71aa989 provides the structural contract; the deferred gates require evidence before enforcement. The v1 roadmap does not authorize Gap Matrix work or DB wave initiation — those require the refreshed V1.1 gap matrix and roadmap.

`MIGRATION_ROADMAP_V1_STATUS=HISTORICAL`
`FROZEN_TARGET_V1.1_STRUCTURAL_IMPLEMENTATION=VERIFIED_INTEGRATED_AT_main@71aa989`
`DEFERRED_GATES_REMAINING=ID-01,ASM-ATT-01,FIN-ORIGIN-01,FIN-DON-01,INV-LEDGER-01,INV-LOAN-01,ASM-DATE-01,RES-STATUS-01`
