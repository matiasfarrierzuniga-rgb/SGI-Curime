---
title: SGI-Curime Target Data Model v1 — Decision Register
status: PROPOSED
target_version: v1
review_source: target-model-review.md
---

# Target Data Model v1 — Decision Register

## Purpose

Este registro convierte la revisión formal de Target v1 en decisiones trazables y accionables. Registra resoluciones aprobadas sin modificar el contrato Target ni autorizar migraciones.

Una decisión de diseño `CLOSED` puede mantener un migration gate: la estructura final está decidida, pero todavía no es seguro imponerla o migrarla. Recommendations not explicitly marked `Decision` remain proposals for review, not adopted decisions.

## Review status

Fuente: [`target-model-review.md`](./target-model-review.md).

| Gate | Review status |
| --- | --- |
| `G1_DOMAIN_SEMANTICS` | `PASS_WITH_NOTES` |
| `G2_RELATIONAL_DESIGN` | `BLOCKED` |
| `G3_INTEGRITY` | `BLOCKED` |
| `G4_TRANSITION_SAFETY` | `BLOCKED` |
| `G5_IMPLEMENTABILITY` | `PASS_WITH_NOTES` |

Cross-check: `BLOCKERS_EXTRACTED=17`, `DECISIONS_EXTRACTED=13`, `NON_BLOCKERS_EXTRACTED=8`.

### Classification audit

Previous summary reported `ENGINEERING_DECISIONS=2`, `BUSINESS_DECISIONS=7` and `MIXED_DECISIONS=4`. That summary does not match the actual `Decision owner` values below. The detailed dossier is authoritative:

- `ENGINEERING_ONLY`: `TM-D01`
- `BUSINESS_ONLY`: `TM-D03`, `TM-D08`, `TM-D12`, `TM-D13`
- `MIXED`: `TM-D02`, `TM-D04`, `TM-D05`, `TM-D06`, `TM-D07`, `TM-D09`, `TM-D10`, `TM-D11`

`CLASSIFICATION_MISMATCH_FOUND=YES`
`CLASSIFICATION_CORRECTED=YES`

## Blocking issues

The statuses in this review extract preserve the original formal-review findings. Final Target design disposition is authoritative in `TM-D01..TM-D13`; remaining unresolved work is represented as migration gates, not an undefined Target structure.

### TM-B01 — OrganizationProfile singleton

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Organization
- **Affected entities:** `OrganizationProfile`
- **Affected documents:** `logical-model.md`, `target-model.md`, `data-dictionary.md`, `integrity-rules.md`
- **Problem:** El primary key no impide múltiples perfiles; el mecanismo singleton no está seleccionado.
- **Why it blocks Target v1:** la cardinalidad root no es enforceable ni migrable de forma determinista.
- **Current evidence:** `current-model.md` no tiene perfil institucional persistente.
- **Target statement causing issue:** `OrganizationProfile` es singleton conceptual, con enforcement pendiente.
- **Decision required:** elegir constraint singleton PostgreSQL o regla de writer confiable.
- **Candidate options:** A) índice/constraint basado en constante singleton; B) tabla con clave fija y FK/check de constante; C) sólo enforcement de aplicación.
- **Recommended option:** Opción A o B, con enforcement DB.
- **Recommendation rationale:** evita duplicados incluso fuera de la aplicación.
- **Risks:** constraint poco portable; opción C permite duplicación accidental.
- **Migration consequence:** crear o reconciliar exactamente una fila antes de imponer enforcement.
- **Requires business validation:** NO
- **Can be resolved technically:** YES
- **Must remain as transition gate:** NO
- **Status:** `OPEN`

### TM-B02 — UserRequest reviewer ownership

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Security / requests
- **Affected entities:** `UserRequest`, `AffiliateRequest`, `User`
- **Affected documents:** `logical-model.md`, `target-model.md`, `data-dictionary.md`, `current-model.md`
- **Problem:** `AffiliateRequest.reviewedById` es FK; `UserRequest.reviewedById` es scalar sin FK.
- **Why it blocks Target v1:** ownership y retención de actor difieren sin decisión explícita.
- **Current evidence:** schema actual contiene `UserRequest.reviewedById` sin relación Prisma/FK.
- **Target statement causing issue:** Target conserva `reviewedById` de `UserRequest` sin cerrar su semántica.
- **Decision required:** definir si es FK, snapshot o dato deliberadamente no referenciado.
- **Candidate options:** A) FK nullable a `User`; B) snapshot de revisor; C) mantener scalar no referenciado con contrato histórico.
- **Recommended option:** Opción A si revisor es actor vigente; B si retención histórica es prioridad.
- **Recommendation rationale:** evita referencias huérfanas y alinea ambos workflows cuando el actor es User.
- **Risks:** FK puede impedir retención/eliminación de usuarios; snapshot pierde navegación relacional.
- **Migration consequence:** mapear IDs actuales y resolver valores no existentes antes de constraint.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B03 — GovernanceTerm status

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Governance
- **Affected entities:** `GovernanceTerm`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `target-model.md`, `integrity-rules.md`
- **Problem:** `status` permanece `string` sin vocabulario ni transiciones.
- **Why it blocks Target v1:** no existe contrato estable para constraints, lifecycle o backfill.
- **Current evidence:** no hay modelo de período de Junta en Current.
- **Target statement causing issue:** estado lógico sin enum cerrado.
- **Decision required:** aceptar vocabulario y transiciones del período.
- **Candidate options:** A) enum `PLANNED/ACTIVE/CLOSED/CANCELLED`; B) catálogo de estados; C) string validado sólo por aplicación.
- **Recommended option:** Opción A, si negocio confirma semántica.
- **Recommendation rationale:** vocabulario pequeño y constraint claro.
- **Risks:** enum prematuro puede congelar estados legales incorrectos.
- **Migration consequence:** no hay backfill confiable; nuevos registros deben esperar vocabulario.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B04 — Assembly temporal replacement

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Assemblies
- **Affected entities:** `Assembly`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `target-model.md`, `current-model.md`
- **Problem:** Current `date` se reemplaza por `scheduledAt`/`heldAt` sin regla de mapeo ni tratamiento de fecha desconocida.
- **Why it blocks Target v1:** nulabilidad, status y timestamps pueden producir historia falsa.
- **Current evidence:** Current `Assembly.date` es requerido y único timestamp principal.
- **Target statement causing issue:** `scheduledAt` requerido y `heldAt` opcional.
- **Decision required:** mapear `date`, statuses y held dates.
- **Candidate options:** A) `date -> scheduledAt`, `heldAt=NULL`; B) `date -> heldAt` para completadas y `scheduledAt` para futuras; C) preservar ambos con provenance.
- **Recommended option:** Opción C conceptualmente, con regla por status y `heldAt=NULL` cuando no exista evidencia.
- **Recommendation rationale:** conserva dato sin inventar evento realizado.
- **Risks:** fecha Current no distingue programada de realizada.
- **Migration consequence:** ordenar clasificación por status y registrar excepciones.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B05 — FundingAllocation cardinality

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Finance
- **Affected entities:** `FundingAllocation`, `Expense`, `FinancialMovement`
- **Affected documents:** `conceptual-model.md`, `logical-model.md`, `target-model.md`, `data-dictionary.md`, `integrity-rules.md`
- **Problem:** `incomeMovementId UNIQUE` permite un solo allocation por ingreso, mientras multi-source permanece abierto.
- **Why it blocks Target v1:** cardinalidad y candidate keys pueden ser incorrectos.
- **Current evidence:** Current no tiene `FundingAllocation` ni `FinancialAccount`.
- **Target statement causing issue:** relación nullable unique y semántica multifuente pendiente.
- **Decision required:** definir si ingreso puede financiar múltiples gastos y si allocation requiere income FK.
- **Candidate options:** A) un ingreso -> un allocation; B) un ingreso -> N allocations, quitar UQ; C) allocation por fuente abstracta sin FK de ingreso.
- **Recommended option:** Opción B si financiación compartida es real; mantener FK explícita y retirar UQ.
- **Recommendation rationale:** modela asignación fraccionada sin referencia genérica.
- **Risks:** requiere reglas de suma, disponibilidad y doble asignación.
- **Migration consequence:** no crear UQ hasta conocer distribución de fuentes.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B06 — FK delete/update semantics

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Cross-domain relational integrity
- **Affected entities:** all entities with durable, optional, actor and ledger FKs
- **Affected documents:** `logical-model.md`, `target-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** políticas `ON DELETE`/update se difieren al roadmap.
- **Why it blocks Target v1:** ownership, retención y borrado no son parte de contrato relacional cerrado.
- **Current evidence:** Current usa `CASCADE`, `SET NULL` y `RESTRICT` según relación.
- **Target statement causing issue:** nota explícita de que acciones finales se definirán después.
- **Decision required:** clasificar cada FK durable, opcional, histórico y ledger.
- **Candidate options:** A) preservar Current por relación equivalente; B) `RESTRICT` por defecto y `SET NULL` para actores; C) política global de cascade.
- **Recommended option:** Opción B, con excepciones justificadas y nunca cascade sobre ledger.
- **Recommendation rationale:** protege historia y reduce eliminación accidental.
- **Risks:** `RESTRICT` puede requerir archivado; cascades amplias pueden destruir evidencia.
- **Migration consequence:** ordenar FKs después de backfills y probar ciclos de dependencia.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B07 — Convocation role-to-membership mapping

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Governance / assemblies
- **Affected entities:** `AssemblyConvocation`, `Role`, `GovernanceMembership`, `GovernancePosition`
- **Affected documents:** `conceptual-model.md`, `logical-model.md`, `target-model.md`, `data-dictionary.md`, `current-model.md`
- **Problem:** Current `roleId`/`roleNameSnapshot` no equivalen necesariamente a cargo de Junta.
- **Why it blocks Target v1:** conversión directa puede inventar cargos o perder snapshots históricos.
- **Current evidence:** Current convocation tiene `roleId` opcional y snapshot obligatorio.
- **Target statement causing issue:** Target elimina Role y hace membership/snapshot opcionales.
- **Decision required:** reglas de mapping, orphan handling y preservación del snapshot.
- **Candidate options:** A) mapear sólo roles con evidencia a posiciones; B) conservar snapshot sin membership; C) crear memberships inferidas.
- **Recommended option:** A cuando haya evidencia; B para restantes; nunca C sin evidencia.
- **Recommendation rationale:** preserva historia y evita falsa gobernanza.
- **Risks:** parte histórica quedará sin FK de membership.
- **Migration consequence:** crear posiciones/memberships antes de actualizar convocatorias; reportar huérfanos.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B08 — Attendance relationship migration

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Assemblies
- **Affected entities:** `AssemblyConvocation`, `AssemblyAttendance`, `AbsenceJustification`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current keys `(assemblyId, affiliateId)` cambian a `convocationId` y `attendanceId`.
- **Why it blocks Target v1:** FK nueva no puede imponerse sin mapping completo.
- **Current evidence:** Current attendance/justification usan assembly/affiliate compuestos.
- **Target statement causing issue:** asistencia requiere convocation única; justificación requiere attendance única.
- **Decision required:** orden y política para duplicate/missing/orphan rows.
- **Candidate options:** A) crear convocatorias faltantes desde attendance; B) cuarentenar filas sin match; C) conservar compatibilidad temporal con columnas legacy.
- **Recommended option:** B por defecto, A sólo con evidencia de invitación.
- **Recommendation rationale:** no fabrica invitaciones institucionales.
- **Risks:** registros históricos no migrados.
- **Migration consequence:** convocations -> attendance -> justifications, con reportes de excepciones.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B09 — JUSTIFIED attendance conversion

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Assemblies
- **Affected entities:** `AssemblyAttendance`, `AbsenceJustification`
- **Affected documents:** `logical-model.md`, `target-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current `JUSTIFIED` no es estado Target y puede carecer de justificación.
- **Why it blocks Target v1:** eliminación del enum puede perder significado o fabricar aprobación.
- **Current evidence:** `AttendanceStatus` actual contiene `PRESENT`, `ABSENT`, `JUSTIFIED`; justificación separada puede no existir.
- **Target statement causing issue:** sólo `PRESENT`/`ABSENT`; justificación separada.
- **Decision required:** conversión de cada JUSTIFIED sin evidencia asociada.
- **Candidate options:** A) convertir a ABSENT sin justificación; B) crear justificación pendiente; C) cuarentenar para revisión.
- **Recommended option:** B cuando existe motivo/evidencia; C para filas incompletas.
- **Recommendation rationale:** conserva señal de justificación sin aprobarla automáticamente.
- **Risks:** creación de filas derivadas; pendientes históricos.
- **Migration consequence:** migrar attendance antes de justifications y mantener legacy value hasta cierre.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B10 — Inventory loan movement semantics

- **Gate:** `G2_RELATIONAL_DESIGN`
- **Domain:** Inventory
- **Affected entities:** `InventoryLoan`, `InventoryMovement`, `InventoryItem`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`
- **Problem:** FKs únicas no garantizan mismo item, tipo, signo, magnitud ni exclusividad de rol.
- **Why it blocks Target v1:** el ledger puede quedar económicamente inconsistente con el préstamo.
- **Current evidence:** Current loan sólo tiene item/quantity/dates; no movement FKs.
- **Target statement causing issue:** checkout/return/cancellation movement FKs explícitas.
- **Decision required:** reglas de correspondencia y enforcement.
- **Candidate options:** A) trigger/constraints SQL; B) validator transaccional confiable; C) tabla de eventos de préstamo fuera de v1.
- **Recommended option:** B inicialmente, con constraints locales y tests de integridad antes de DB-1.
- **Recommendation rationale:** cross-row semantics exceden CHECK simple y preserva modelo v1.
- **Risks:** writers alternativos pueden bypassear validación.
- **Migration consequence:** sólo enlazar movimientos demostrables; filas sin evidencia permanecen nullable/quarantined.
- **Requires business validation:** NO para enforcement; YES para reglas de cantidad/signo.
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B11 — Payment origin backfill

- **Gate:** `G3_INTEGRITY`
- **Domain:** Finance
- **Affected entities:** `Payment`, `FinancialCharge`, `FinancialMovement`, `Reservation`
- **Affected documents:** `target-model.md`, `logical-model.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current `RESERVATION_PAYMENT/sourceId` no tiene mapping completo a Payment rows.
- **Why it blocks Target v1:** `Payment.movementId NOT NULL UNIQUE` no puede imponerse sin correspondencia.
- **Current evidence:** Current movement usa `source/sourceId` polimórfico; Payment no tiene movement FK.
- **Target statement causing issue:** eliminar sourceId y enlazar Payment explícitamente.
- **Decision required:** mapping, quarantine y evidencia de completitud.
- **Candidate options:** A) mapear todos por sourceId; B) dejar excepciones en quarantine; C) conservar sourceId compatibility hasta remediación.
- **Recommended option:** A + B, con C sólo durante ventana transicional.
- **Recommendation rationale:** evita fabricar pagos y permite cierre medible.
- **Risks:** pagos huérfanos o duplicados; conciliación incompleta.
- **Migration consequence:** backfill Payment/movement antes de NOT NULL/UQ y eliminación de sourceId.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B12 — Donation movement correspondence

- **Gate:** `G3_INTEGRITY`
- **Domain:** Donations / finance
- **Affected entities:** `Donation`, `FinancialMovement`, `Person`
- **Affected documents:** `target-model.md`, `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** original/reversal links actuales son opcionales; Target exige original y elimina reversal FK final.
- **Why it blocks Target v1:** puede perderse historia o asociarse movimiento equivocado.
- **Current evidence:** Current Donation tiene `originalMovementId?` y `reversalMovementId?`, ambos únicos.
- **Target statement causing issue:** original obligatorio; reversa mediante self-reference del ledger.
- **Decision required:** matching, duplicates/orphans, amount/currency/direction, rollback.
- **Candidate options:** A) mapear por FK existente y validar; B) matching por datos con revisión; C) quarantine de no match.
- **Recommended option:** A, luego B sólo con evidencia, C para restantes.
- **Recommendation rationale:** prioriza relaciones ya verificables y no inventa correspondencias.
- **Risks:** reversals ambiguas; original absent; amounts diverge.
- **Migration consequence:** no NOT NULL ni eliminación de reversal FK hasta reconciliation report.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B13 — Ledger origin exclusivity and compatibility

- **Gate:** `G3_INTEGRITY`
- **Domain:** Finance
- **Affected entities:** `FinancialMovement`, `Payment`, `Donation`, `Disbursement`, `FinancialAccount`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`, `target-model.md`
- **Problem:** unique FKs separadas no impiden que un movement sea Payment, Donation y Disbursement ni que contradiga origin/type/amount/currency.
- **Why it blocks Target v1:** ledger puede representar múltiples orígenes incompatibles.
- **Current evidence:** Current source/sourceId es polimórfico y no valida destino.
- **Target statement causing issue:** originType singular y FKs explícitas.
- **Decision required:** enforcement DB vs trusted transactional writer y reglas económicas.
- **Candidate options:** A) trigger/constraints SQL; B) application-only transaction guard; C) tabla de origin exclusiva.
- **Recommended option:** A o C si múltiples writers existen; B sólo con writer único auditado.
- **Recommendation rationale:** origin singular requiere protección fuera de convención.
- **Risks:** triggers aumentan complejidad; app-only permite bypass.
- **Migration consequence:** validar exclusividad antes de poblar originType y FKs.
- **Requires business validation:** NO para exclusividad; YES para origin taxonomy.
- **Can be resolved technically:** YES, tras escoger enforcement.
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B14 — Inventory signed ledger and quantity meaning

- **Gate:** `G4_TRANSITION_SAFETY`
- **Domain:** Inventory
- **Affected entities:** `InventoryItem`, `InventoryMovement`, `InventoryLoan`
- **Affected documents:** `conceptual-model.md`, `logical-model.md`, `target-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current quantity es unsigned y `currentQuantity` se reduce durante préstamos; Target exige delta firmado y proyección no negativa.
- **Why it blocks Target v1:** no se sabe qué cantidad reconstruir ni cómo convertir EXIT/opening/adjustments.
- **Current evidence:** schema Current tiene `InventoryMovement.quantity` positivo y loan flow reduce `currentQuantity`.
- **Target statement causing issue:** `quantityDelta` signed, `OPENING_BALANCE`, `currentQuantity >= 0`.
- **Decision required:** available vs physical quantity, signs, opening policy and invalid rows.
- **Candidate options:** A) currentQuantity = available; B) currentQuantity = owned/physical; C) separate projections later.
- **Recommended option:** A como mínima continuidad, sujeto a confirmación de negocio.
- **Recommendation rationale:** coincide con comportamiento observado, pero no debe asumirse como definitivo.
- **Risks:** doble conteo de préstamos; saldo negativo; falsos openings.
- **Migration consequence:** generar opening balance y deltas sólo tras semantic classification; reportar invalid rows.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B15 — Resource free/nullable pricing

- **Gate:** `G4_TRANSITION_SAFETY`
- **Domain:** Reservations
- **Affected entities:** `ReservableResource`, `Reservation`, `FinancialCharge`
- **Affected documents:** `target-model.md`, `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current permite `FREE` y price nullable; Target exige `price > 0`, CRC.
- **Why it blocks Target v1:** filas actuales pueden violar el invariant objetivo.
- **Current evidence:** Current enum `ResourcePricingType.FREE/FIXED`, price nullable.
- **Target statement causing issue:** pricing positivo CRC; eliminar FREE requiere BV-01.
- **Decision required:** confirmar si recurso gratuito sigue siendo negocio válido y cómo valorar existentes.
- **Candidate options:** A) confirmar que todo recurso es pagado y asignar precios; B) conservar free como excepción explícita; C) separar pricing policy futura.
- **Recommended option:** B temporalmente hasta confirmación; no eliminar FREE durante transición.
- **Recommendation rationale:** evita inventar precios y pérdida de capacidad operativa.
- **Risks:** Target no queda completamente endurecido; cargo puede no existir.
- **Migration consequence:** análisis de filas FREE, pricing decision y sólo luego CHECK/enum removal.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B16 — Historical loan movement evidence

- **Gate:** `G4_TRANSITION_SAFETY`
- **Domain:** Inventory
- **Affected entities:** `InventoryLoan`, `InventoryMovement`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `integrity-rules.md`, `current-model.md`
- **Problem:** Current loans no tienen checkout/return/cancellation movement FKs ni evidencia equivalente garantizada.
- **Why it blocks Target v1:** no se pueden volver obligatorios links históricos sin fabricar movimientos.
- **Current evidence:** Current `InventoryLoan` sólo tiene item, quantity, dates and actors.
- **Target statement causing issue:** tres FKs de movimientos opcionales pero explícitas.
- **Decision required:** política para loans históricos sin movimientos.
- **Candidate options:** A) reconstruir si evidence suficiente; B) crear opening/adjustment sólo con evidencia; C) dejar NULL y marcar unresolved.
- **Recommended option:** C por defecto; A/B sólo con evidencia auditada.
- **Recommendation rationale:** preserva honestidad histórica y permite Target para nuevos loans.
- **Risks:** ledger incompleto para historia; reportes requieren explicar gaps.
- **Migration consequence:** mantener nullable y exception report hasta cierre de evidence gate.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

### TM-B17 — Expense status vocabulary

- **Gate:** `G4_TRANSITION_SAFETY`
- **Domain:** Finance / expenses
- **Affected entities:** `Expense`, `Disbursement`, `AssemblyResolution`
- **Affected documents:** `logical-model.md`, `data-dictionary.md`, `target-model.md`, `integrity-rules.md`
- **Problem:** `Expense.status` es free text sin valores ni lifecycle; no existe mapping de estado actual porque entidad es nueva.
- **Why it blocks Target v1:** no se puede validar autorización, ejecución, cancelación o conciliación.
- **Current evidence:** Current no tiene `Expense` persistente.
- **Target statement causing issue:** status lógico abierto, sin enum cerrado.
- **Decision required:** vocabulary, transitions and relation to Disbursement.
- **Candidate options:** A) `DRAFT/AUTHORIZED/COMMITTED/CANCELLED`; B) `PENDING/APPROVED/REJECTED/PAID/CANCELLED`; C) no status, derive from child records.
- **Recommended option:** B sólo si negocio confirma workflow; A si authorization/execution remain separate.
- **Recommendation rationale:** status debe reflejar lifecycle real y no duplicar Disbursement.
- **Risks:** estados duplicados o contradicción con desembolsos.
- **Migration consequence:** no current backfill; close vocabulary before creating DDL.
- **Requires business validation:** YES
- **Can be resolved technically:** NO
- **Must remain as transition gate:** YES
- **Status:** `OPEN`

## Decision dossier

This pass records confirmed decisions and separates final design status from migration-gate status.

### TM-D01 — OrganizationProfile singleton enforcement

- **Related blockers:** `TM-B01`
- **Domain:** Organization
- **Question:** ¿Cómo se garantiza una sola fila institucional?
- **Option A:** PostgreSQL singleton constraint/index. **Consequences:** strongest integrity; SQL-specific implementation.
- **Option B:** fixed-key row plus check/FK pattern. **Consequences:** explicit root key; requires disciplined DDL.
- **Option C:** application-only singleton. **Consequences:** simplest schema; unsafe under alternate writers.
- **Recommended decision:** A or B, not C.
- **Why:** cardinality is structural and should survive application bypass.
- **Evidence level:** `DESIGN_CHOICE`
- **Reversibility:** `MODERATE`
- **Decision owner:** `engineering`
- **Resolution:** `Option B` — fixed singleton key/row plus database constraint.
- **Resolution rationale:** OrganizationProfile singleton es un invariant estructural y debe ser protegido por DB, no únicamente por aplicación.
- **Status:** `CLOSED`

### TM-D02 — UserRequest reviewer representation

- **Related blockers:** `TM-B02`
- **Domain:** Security / requests
- **Question:** ¿Qué representa `UserRequest.reviewedById`?
- **Option A:** nullable FK to `User`. **Consequences:** navigable actor; deletion semantics required.
- **Option B:** reviewer snapshot. **Consequences:** preserves history; no relational actor navigation.
- **Option C:** unreferenced historical scalar. **Consequences:** minimal change; weakest integrity.
- **Recommended decision:** A for active review workflow, B for immutable historical audit.
- **Why:** decision depends on whether reviewer identity is domain ownership or historical evidence.
- **Evidence level:** `ACCEPTED_TARGET`
- **Reversibility:** `MODERATE`
- **Decision owner:** `engineering + business`
- **Decision:** `Option A` — nullable FK to `User`.
- **Target direction:** `UserRequest.reviewedById` nullable FK -> `User`, `ON DELETE SET NULL`. No reviewer snapshot.
- **Rationale:** Current workflow writes authenticated `User.id`; no existing UserRequest rows or reviewer orphans require reconciliation; request survives unavailable actor.
- **Migration verification:** Normal pre-constraint referential validation only.
- **Design decision status:** `CLOSED`
- **Migration gate status:** `NONE`
- **Status:** `CLOSED`

### TM-D03 — GovernanceTerm status vocabulary

- **Related blockers:** `TM-B03`, `TM-B17` (lifecycle pattern only)
- **Domain:** Governance
- **Question:** ¿Qué estados y transitions tiene un período de Junta?
- **Option A:** enum planned/active/closed/cancelled. **Consequences:** clear DB contract; may not fit legal lifecycle.
- **Option B:** status catalog. **Consequences:** extensible; more rows and governance.
- **Option C:** validated string. **Consequences:** flexible; weaker DB integrity.
- **Recommended decision:** A after business confirms vocabulary.
- **Why:** closed finite lifecycle is easiest to enforce and report.
- **Evidence level:** `ACCEPTED_TARGET`
- **Reversibility:** `HARD`
- **Decision owner:** `ADI/business`
- **Decision:** `Option A` — `GovernanceTermStatus`: `PLANNED`, `ACTIVE`, `CLOSED`, `CANCELLED`.
- **Target direction:** `GovernanceTerm.status` uses this closed vocabulary. A more detailed state machine is not defined by this decision.
- **Design decision status:** `CLOSED`
- **Migration gate status:** `NONE`
- **Status:** `CLOSED`

### TM-D04 — Expense status vocabulary

- **Related blockers:** `TM-B17`
- **Domain:** Finance / expenses
- **Question:** ¿Cuál es el lifecycle de Expense y cómo se separa de Disbursement?
- **Option A:** authorization-centric states. **Consequences:** Disbursement owns execution.
- **Option B:** request/payment states. **Consequences:** familiar workflow; risks duplicating Payment/Disbursement.
- **Option C:** derive status from child records. **Consequences:** fewer enum values; more complex queries and ambiguous cancellation.
- **Recommended decision:** A if Expense is authorization; B only if business confirms combined workflow.
- **Why:** ownership must not overlap with Disbursement.
- **Evidence level:** `ACCEPTED_TARGET`.
- **Reversibility:** `HARD`
- **Decision owner:** `engineering + business`
- **Decision:** `Option A` confirmed — `Expense` represents authorization/formal expense record; `Disbursement` represents material monetary execution.
- **Target direction:** `ExpenseStatus` is closed: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. `PENDING` is registered expense pending authorization; `APPROVED` is authorized; `REJECTED` is denied authorization; `CANCELLED` is voided or withdrawn before execution.
- **Boundary:** Do not include `DRAFT`, `PAID`, `DISBURSED` or `PARTIALLY_PAID` in Target v1 `ExpenseStatus`; execution belongs to `Disbursement` and the financial ledger.
- **TM-D04-S1:** `CLOSED` by Daniel confirmation.
- **Design decision status:** `CLOSED`
- **Migration gate status:** `NONE`
- **Status:** `CLOSED`

### TM-D05 — Assembly timestamp mapping

- **Related blockers:** `TM-B04`
- **Domain:** Assemblies
- **Question:** ¿Cómo se transforma Current `date` a scheduled/held timestamps?
- **Option A:** always `date -> scheduledAt`, `heldAt=NULL`. **Consequences:** preserves raw meaning; loses inferred held date.
- **Option B:** status-based split. **Consequences:** richer history; may infer facts.
- **Option C:** dual mapping with provenance/exception report. **Consequences:** safest evidence; more transition metadata.
- **Recommended decision:** C, with no inference where evidence is absent.
- **Why:** preserves information without fabricating occurrence.
- **Evidence level:** `MIGRATION_DEPENDENT`
- **Reversibility:** `MODERATE`
- **Decision owner:** `engineering + business`
- **Decision:** `Option C`.
- **Migration rule:** Current `Assembly.date` maps safely to `scheduledAt`; `heldAt` is `NULL` unless explicit evidence proves the assembly was held. Never infer occurrence from status or missing evidence.
- **Evidence:** Current database has zero Assembly rows.
- **Design decision status:** `CLOSED`
- **Migration gate:** `ASM-DATE-01` — re-run data inspection immediately before migration.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

### TM-D06 — Governance mapping for convocations

- **Related blockers:** `TM-B07`
- **Domain:** Governance / assemblies
- **Question:** ¿Qué Current role data can become GovernanceMembership?
- **Option A:** map only evidence-backed roles. **Consequences:** some rows remain snapshot-only.
- **Option B:** preserve all snapshots without membership. **Consequences:** no false facts; weaker relational history.
- **Option C:** infer memberships from security role names. **Consequences:** complete-looking data; high historical risk.
- **Recommended decision:** A plus B fallback; reject C without evidence.
- **Why:** separates access roles from institutional offices.
- **Evidence level:** `VERIFIED_CURRENT`
- **Reversibility:** `MODERATE`
- **Decision owner:** `engineering + business`
- **Decision:** `Option A` with `Option B` fallback.
- **Rule:** NEVER infer `GovernanceMembership` from security `Role` alone. Map only evidence-backed historical data; otherwise preserve `positionNameSnapshot` without false relational membership. Option C is rejected.
- **Evidence:** Current database has zero convocations and no structured GovernanceMembership source.
- **Design decision status:** `CLOSED`
- **Migration gate:** `GOV-HIST-01` — re-inspect data before migration; never fabricate historical governance.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

### TM-D07 — Attendance and justification conversion

- **Related blockers:** `TM-B08`, `TM-B09`
- **Domain:** Assemblies
- **Question:** ¿Cómo se convierten composite keys y `JUSTIFIED` rows?
- **Option A:** derive missing parents and pending justifications. **Consequences:** preserves more rows; creates derived records.
- **Option B:** quarantine unmatched/incomplete rows. **Consequences:** safest truth; reports need exception handling.
- **Option C:** collapse all `JUSTIFIED` to `ABSENT`. **Consequences:** simple; loses justification signal.
- **Recommended decision:** A only with evidence; B for unresolved rows; never silent C.
- **Why:** preserves semantics and avoids automatic approval.
- **Evidence level:** `MIGRATION_DEPENDENT`
- **Reversibility:** `HARD`
- **Decision owner:** `engineering + business`
- **Decision:** `Option A` with `Option B` fallback.
- **Target direction:** Final `AttendanceStatus` is `PRESENT`, `ABSENT`. A verified justified absence becomes `Attendance=ABSENT` plus separate `AbsenceJustification`; unmatched/incomplete history is quarantined/reconciled, never silently converted.
- **Evidence:** Current database has zero attendance and justification rows.
- **Design decision status:** `CLOSED`
- **Migration gate:** `ASM-ATT-01` — re-inspect historical rows before constraint enforcement.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

### TM-D08 — FundingAllocation cardinality

- **Related blockers:** `TM-B05`
- **Domain:** Finance
- **Question:** ¿Puede un ingreso financiar múltiples gastos/allocations?
- **Option A:** one income to one allocation. **Consequences:** simple UQ; cannot split source.
- **Option B:** one income to many allocations. **Consequences:** realistic split; requires sum and balance rules.
- **Option C:** no explicit income FK. **Consequences:** flexible; loses traceability.
- **Recommended decision:** B if split funding exists; retain explicit FK and remove/revise UQ.
- **Why:** supports multiple sources without generic references.
- **Evidence level:** `ACCEPTED_TARGET`
- **Reversibility:** `HARD`
- **Decision owner:** `ADI/business`
- **Decision:** `Option B`.
- **Target direction:** One income `FinancialMovement` may support multiple `FundingAllocation` records. `incomeMovementId` must NOT be `UNIQUE` merely to impose 1:1; cardinality is `FinancialMovement 1 -> 0..N FundingAllocation`, `FundingAllocation N -> 0..1 FinancialMovement`.
- **Required Target reconciliation item:** `FundingAllocation.amount` remains required to support splitting. No additional distribution behavior is inferred.
- **Design decision status:** `CLOSED`
- **Migration gate status:** `NONE`
- **Status:** `CLOSED`

### TM-D09 — FK delete/update policy

- **Related blockers:** `TM-B06`
- **Domain:** Cross-domain integrity
- **Question:** ¿Qué delete/update action aplica a cada FK class?
- **Option A:** preserve equivalent Current actions. **Consequences:** continuity; new entities still need policy.
- **Option B:** Restrict durable data, SetNull actors, Cascade disposable tokens/children. **Consequences:** safer history; more archival handling.
- **Option C:** broad Cascade. **Consequences:** simpler cleanup; unacceptable evidence loss risk.
- **Recommended decision:** B with per-relation exceptions.
- **Why:** protects ledger, audit and institutional history.
- **Evidence level:** `DESIGN_CHOICE`
- **Reversibility:** `HARD`
- **Decision owner:** `engineering + business`
- **Decision:** `Option B`.
- **Target policy:** `RESTRICT` durable/historical/financial relationships; `SET NULL` nullable actor references where history must survive; `CASCADE` sólo children truly dependent/disposable; document justified exceptions relation by relation.
- **Design decision status:** `CLOSED`
- **Migration gate status:** `NONE`; implementation still requires relation-by-relation DDL verification.

#### Target FK relation matrix

**Target onUpdate:** `CASCADE` for every FK in this matrix. Target primary keys are stable identifiers; cascading a rare PK correction preserves referential integrity without changing delete-retention policy. `RELATION_DECISION_PENDING=0` for `onUpdate`.

| Child | FK | Parent | Class | Required / optional | Target onDelete | Rationale | Exception / gate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `User` | `personId` | `Person` | DURABLE_HISTORY | Required | `RESTRICT` | Account identity cannot be deleted while account exists. | `ID-01` |
| `User` | `roleId` | `Role` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve authorization history; deactivate roles instead. | — |
| `Session` | `userId` | `User` | SECURITY_SESSION_OR_TOKEN | Required | `RESTRICT` | Session revocation/retention is explicit, not implicit destruction. | User deletion policy review |
| `AuditLog` | `userId` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve audit event if actor becomes unavailable. | — |
| `PasswordResetToken` | `userId` | `User` | SECURITY_SESSION_OR_TOKEN | Required | `CASCADE` | Disposable credential has no independent history. | — |
| `AccountActivationToken` | `userId` | `User` | SECURITY_SESSION_OR_TOKEN | Required | `CASCADE` | Disposable credential has no independent history. | — |
| `UserRequest` | `reviewedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Closed TM-D02; request survives actor removal. | Normal FK verification |
| `UserRequest` | `personId` | `Person` | TRANSITIONAL | Optional | `SET NULL` | Preserve request snapshot during identity reconciliation. | `ID-01` |
| `Affiliate` | `personId` | `Person` | DURABLE_HISTORY | Required | `RESTRICT` | Affiliation must retain canonical identity. | `ID-01` |
| `AffiliateRequest` | `reviewedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve reviewed request. | — |
| `AffiliateRequest` | `personId` | `Person` | TRANSITIONAL | Optional | `SET NULL` | Preserve historical request snapshot. | `ID-01` |
| `AffiliateSanction` | `affiliateId` | `Affiliate` | DURABLE_HISTORY | Required | `RESTRICT` | Sanction history cannot outlive a deleted affiliation silently. | — |
| `AffiliateSanction` | `createdById` | `User` | DURABLE_HISTORY | Required | `RESTRICT` | Creator is part of sanction evidence. | Actor-retention review |
| `RolePermission` | `roleId` | `Role` | OWNED_DEPENDENT | Required | `CASCADE` | Assignment has no independent lifecycle. | Role deletion should be exceptional |
| `RolePermission` | `permissionId` | `Permission` | OWNED_DEPENDENT | Required | `CASCADE` | Assignment has no independent lifecycle. | Permission deletion should be exceptional |
| `GovernanceMembership` | `termId` | `GovernanceTerm` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve term occupancy history. | — |
| `GovernanceMembership` | `positionId` | `GovernancePosition` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve recorded office. | Deactivate position instead |
| `GovernanceMembership` | `affiliateId` | `Affiliate` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve institutional appointment history. | — |
| `GovernanceMembership` | `appointedByAssemblyId` | `Assembly` | DURABLE_HISTORY | Optional | `SET NULL` | Membership may survive unavailable appointment evidence. | `GOV-HIST-01` |
| `AssemblyCall` | `assemblyId` | `Assembly` | OWNED_DEPENDENT | Required | `CASCADE` | Call has no meaning outside assembly. | Historical deletion policy on Assembly |
| `AssemblyConvocation` | `assemblyId` | `Assembly` | OWNED_DEPENDENT | Required | `CASCADE` | Convocation is owned by assembly. | Historical deletion policy on Assembly |
| `AssemblyConvocation` | `affiliateId` | `Affiliate` | DURABLE_HISTORY | Required | `RESTRICT` | Individual invitation history must survive. | — |
| `AssemblyConvocation` | `governanceMembershipId` | `GovernanceMembership` | DURABLE_HISTORY | Optional | `SET NULL` | Preserve invitation/snapshot where mapping is unavailable. | `GOV-HIST-01` |
| `AssemblyAttendance` | `convocationId` | `AssemblyConvocation` | OWNED_DEPENDENT | Required | `CASCADE` | Attendance is owned by invitation. | `ASM-ATT-01` |
| `AbsenceJustification` | `attendanceId` | `AssemblyAttendance` | OWNED_DEPENDENT | Required | `CASCADE` | Justification has no meaning outside attendance. | `ASM-ATT-01` |
| `AbsenceJustification` | `reviewedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve justification record. | — |
| `AssemblyMinute` | `assemblyId` | `Assembly` | DURABLE_HISTORY | Required | `RESTRICT` | Acta is institutional evidence. | Minute lifecycle closure |
| `AssemblyResolution` | `assemblyId` | `Assembly` | DURABLE_HISTORY | Required | `RESTRICT` | Resolution is institutional evidence. | — |
| `Reservation` | `resourceId` | `ReservableResource` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve reservation/resource history. | Resource retirement uses inactive state |
| `Reservation` | `requesterUserId` | `User` | DURABLE_HISTORY | Required | `RESTRICT` | Requester belongs to reservation history. | Actor-retention review |
| `Reservation` | `approvedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve approval record if actor unavailable. | — |
| `Reservation` | `eventId` | `Event` | DURABLE_HISTORY | Optional | `SET NULL` | Reservation can survive event removal/archival. | Event deletion policy |
| `FinancialCharge` | `reservationId` | `Reservation` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Charge history cannot be cascade-deleted. | FREE-resource reconciliation |
| `Payment` | `chargeId` | `FinancialCharge` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Payment must preserve settled obligation. | — |
| `Payment` | `movementId` | `FinancialMovement` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Explicit origin link; movement immutable. | `FIN-ORIGIN-01` |
| `Payment` | `recordedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve payment history. | — |
| `FinancialMovement` | `accountId` | `FinancialAccount` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Ledger account cannot be removed with movements. | Account retirement uses inactive state |
| `FinancialMovement` | `recordedById` | `User` | DURABLE_HISTORY | Required | `RESTRICT` | Recorder is required Target ledger evidence. | User-retention review |
| `FinancialMovement` | `reversalOfId` | `FinancialMovement` | LEDGER_OR_FINANCIAL | Optional | `RESTRICT` | Preserve reversal chain. | `FIN-DON-01` when donation-linked |
| `FinancialMovement` | `voidedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve voided movement metadata. | — |
| `Donation` | `donorPersonId` | `Person` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve donation snapshot if person relation is removed. | — |
| `Donation` | `recordedById` | `User` | DURABLE_HISTORY | Required | `RESTRICT` | Required donation evidence. | User-retention review |
| `Donation` | `cancelledById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve cancellation record. | — |
| `Donation` | `originalMovementId` | `FinancialMovement` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Immutable original income evidence. | `FIN-DON-01` |
| `Expense` | `authorizationResolutionId` | `AssemblyResolution` | DURABLE_HISTORY | Optional | `SET NULL` | Expense can survive unavailable resolution link. | TM-D04-S1 does not affect FK |
| `ExpenseDocument` | `expenseId` | `Expense` | OWNED_DEPENDENT | Required | `CASCADE` | Document is specific to expense. | Retention policy exception if required |
| `Disbursement` | `expenseId` | `Expense` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Execution must preserve authorized expense. | — |
| `Disbursement` | `movementId` | `FinancialMovement` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Immutable expense movement link. | `FIN-ORIGIN-01` |
| `FundingAllocation` | `expenseId` | `Expense` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Allocation preserves funding history. | TM-D08 target reconciliation |
| `FundingAllocation` | `incomeMovementId` | `FinancialMovement` | LEDGER_OR_FINANCIAL | Optional | `RESTRICT` | Explicit optional source link; not unique after TM-D08. | TM-D08 target reconciliation |
| `InventoryItem` | `categoryId` | `InventoryCategory` | DURABLE_HISTORY | Required | `RESTRICT` | Preserve classification history. | Deactivate category instead |
| `InventoryMovement` | `itemId` | `InventoryItem` | LEDGER_OR_FINANCIAL | Required | `RESTRICT` | Inventory ledger remains intact. | `INV-LEDGER-01` |
| `InventoryMovement` | `createdById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve movement history. | — |
| `InventoryLoan` | `cancelledById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve loan record. | — |
| `InventoryLoan` | `itemId` | `InventoryItem` | DURABLE_HISTORY | Required | `RESTRICT` | Loan cannot lose item history. | — |
| `InventoryLoan` | `borrowerAffiliateId` | `Affiliate` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve borrower snapshot/history. | — |
| `InventoryLoan` | `createdById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve loan history. | — |
| `InventoryLoan` | `receivedById` | `User` | ACTOR_REFERENCE | Optional | `SET NULL` | Preserve return evidence. | — |
| `InventoryLoan` | `checkoutMovementId` | `InventoryMovement` | LEDGER_OR_FINANCIAL | Optional | `RESTRICT` | Explicit movement evidence. | `INV-LOAN-01` |
| `InventoryLoan` | `returnMovementId` | `InventoryMovement` | LEDGER_OR_FINANCIAL | Optional | `RESTRICT` | Explicit movement evidence. | `INV-LOAN-01` |
| `InventoryLoan` | `cancellationMovementId` | `InventoryMovement` | LEDGER_OR_FINANCIAL | Optional | `RESTRICT` | Explicit movement evidence. | `INV-LOAN-01` |
| `IdentityReconciliationManifest` | `selectedPersonId` | `Person` | TRANSITIONAL | Optional | `SET NULL` | Preserve reconciliation evidence. | Retain until `ID-01` closes |

`RELATION_DECISION_PENDING=0`
`RELATION_MATRIX_STATUS=COMPLETE`

- **Status:** `CLOSED`

### TM-D10 — Financial origin backfill and exclusivity

- **Related blockers:** `TM-B11`, `TM-B13`
- **Domain:** Finance
- **Question:** ¿Cómo se clasifican current sources and how is singular origin enforced?
- **Option A:** explicit FK backfill plus SQL trigger/constraint. **Consequences:** strongest integrity; complex migration/DDL.
- **Option B:** explicit FK backfill plus trusted transactional writers. **Consequences:** simpler DB; bypass risk.
- **Option C:** retain generic source compatibility indefinitely. **Consequences:** lower migration risk; Target remains polymorphic.
- **Recommended decision:** A where multiple writers exist; B only with controlled writer boundary; C only temporary.
- **Why:** final Target forbids generic origin as relational substitute.
- **Evidence level:** `MIGRATION_DEPENDENT`
- **Reversibility:** `HARD`
- **Decision owner:** `engineering + business`
- **Decision:** `Option A`.
- **Target direction:** Use explicit relational FKs. Generic `sourceId` is not a final relational mechanism. Manual `FinancialMovement` may legitimately have no domain-origin FK; `originType` is classification, not FK substitute. Payment, Donation and Disbursement each have explicit movement relation.
- **Enforcement:** Incompatible/singular origin combinations use DB constraint/trigger as appropriate where relational CHECK cannot express cross-table semantics.
- **Evidence:** Current database has two `MANUAL` movements with `sourceId=NULL`; they require Target `FinancialAccount` classification during treasury migration, but are not orphaned reservation/donation origins.
- **Design decision status:** `CLOSED`
- **Migration gate:** `FIN-ORIGIN-01` — re-run origin classification before removing `source/sourceId` compatibility.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

### TM-D11 — Donation original/reversal history

- **Related blockers:** `TM-B12`
- **Domain:** Donations / finance
- **Question:** ¿Cómo se prueban original/reversal correspondences before target constraints?
- **Option A:** use existing FK links and validate. **Consequences:** safest known source; may leave gaps.
- **Option B:** data matching by amount/date/reference. **Consequences:** increases coverage; ambiguity risk.
- **Option C:** quarantine unresolved rows and preserve legacy fields temporarily. **Consequences:** honest transition; delayed cleanup.
- **Recommended decision:** A, then B with review, C for unresolved rows.
- **Why:** no financial history should be fabricated.
- **Evidence level:** `MIGRATION_DEPENDENT`
- **Reversibility:** `HARD`
- **Decision owner:** `engineering + business`
- **Decision:** Existing FK evidence first; reviewed heuristic matching second; quarantine/transitional compatibility for unresolved history.
- **Target direction:** `Donation.originalMovementId` is `NOT NULL UNIQUE`; cancellation reversal is `FinancialMovement.reversalOfId`. `Donation.reversalMovementId` is not retained as redundant final representation.
- **Rule:** Never fabricate financial history. Current database has zero Donation rows.
- **Design decision status:** `CLOSED`
- **Migration gate:** `FIN-DON-01` — re-inspect donations before `NOT NULL` enforcement.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

## ADD_STATUS_NOTE: V1.1 inheritance and deferred finalization

This Decision Register inherits its structural contract through Frozen Target V1.1, now merged at main@71aa989 (PR #102). The v1 baseline decisions (TM-D01..TM-D13) are preserved as historical design authority; v1.1 extends additive structure to 49 persistent entities, 1 transitional entity, and 77 persistent Target relationships.

**Deferred finalization:** The structural contract is now implemented and verified. The following migration gates remain evidence-dependent deferred cutover points (not structural deficiencies):

- `ID-01`: Person canonical mapping + duplicate-data removal (blocks: `TM-B01`, `TM-B02`, `TM-B09`, `TM-B13`, matrix rows with `personId`)
- `ASM-ATT-01`: Complete parent mapping before new attendance/justification FKs (blocks: `TM-B08`, `TM-B09`, matrix rows with `convocationId`/`attendanceId`)
- `FIN-ORIGIN-01`: Explicit-origin reconciliation before generic `sourceId` removal (blocks: `TM-B11`, `TM-B13`, matrix rows with `movementId`)
- `FIN-DON-01`: Donation original/reversal evidence before redundant-field removal (blocks: `TM-B12`, matrix rows with `originalMovementId`)
- `INV-LEDGER-01`: Signed ledger enforcement before opening-balance backfill (blocks: `TM-B10`, `TM-B14`, matrix rows with `quantityDelta`)
- `INV-LOAN-01`: Evidence-backed loan-movement links (blocks: `TM-B10`, `TM-B16`, matrix rows with `checkoutMovementId`/`returnMovementId`/`cancellationMovementId`)
- `ASM-DATE-01`: Date evidence mapping before `heldAt` backfill/enforcement (blocks: `TM-B04`, `TM-D05`)
- `RES-STATUS-01`: Non-destructive `CONFIRMED`/`COMPLETED` removal (blocks: `TM-B15`, `TM-D13`, enum cleanup)

Target v1.1 implementation does not imply completed historical reconciliation of v1 → v1.1 gaps. The v1 design decisions remain the authority for inherited choices; v1.1 additive structure is now merged, and final cutover requires evidence per each gate. No decision in this register is reopened by the v1.1 merge.

`TARGET_V1.1_STRUCTURAL_IMPLEMENTATION=YES`
`TARGET_V1.1_DEFERRED_GATES=ID-01,ASM-ATT-01,FIN-ORIGIN-01,FIN-DON-01,INV-LEDGER-01,INV-LOAN-01,ASM-DATE-01,RES-STATUS-01`
`TARGET_V1.1_HISTORICAL_RECONCILIATION=PENDING evidence-dependent cutover`

### TM-D12 — Inventory quantity and loan evidence

- **Related blockers:** `TM-B10`, `TM-B14`, `TM-B16`
- **Domain:** Inventory
- **Question:** ¿Qué significa currentQuantity y cómo se convierte ledger/loan history?
- **Option A:** available quantity projection. **Consequences:** matches observed loan decrement; requires loan reservation semantics.
- **Option B:** physical owned quantity. **Consequences:** inventory truth; loans should not decrement ownership.
- **Option C:** maintain both projections later. **Consequences:** clearest domain; expands scope beyond v1.
- **Recommended decision:** A only after business confirmation; unresolved historical loan links remain nullable/quarantined.
- **Why:** continuity is preferable but must be explicit.
- **Evidence level:** `ACCEPTED_TARGET`
- **Reversibility:** `HARD`
- **Decision owner:** `ADI/business`
- **Decision:** `Option A`.
- **Business semantics:** `InventoryItem.currentQuantity` is available quantity. Loan checkout decreases it; return/cancellation increases it.
- **Target ledger:** `quantityDelta` is signed: `ENTRY` positive, `EXIT` negative, `ADJUSTMENT` signed difference, `OPENING_BALANCE` positive/appropriate initial quantity according to migration policy. `currentQuantity >= 0`.
- **Boundary:** Do not add owned-quantity projection or `InventoryAsset` in Target v1.
- **Design decision status:** `CLOSED`
- **Migration gates:** `INV-LEDGER-01` — define opening-balance/backfill algorithm before DB enforcement. `INV-LOAN-01` — create historical loan-movement FKs only when evidence exists.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

### TM-D13 — Resource pricing and reservation legacy statuses

- **Related blockers:** `TM-B15`
- **Domain:** Reservations / finance
- **Question:** ¿Se eliminan recursos FREE y cuándo se retiran `CONFIRMED`/`COMPLETED`?
- **Option A:** remove both after data/business reconciliation. **Consequences:** clean workflow; destructive enum/data change.
- **Option B:** retain transitional values and explicit exceptions. **Consequences:** safer compatibility; longer Target transition.
- **Option C:** split pricing/workflow policy into new concepts. **Consequences:** expressive; exceeds current v1 scope.
- **Recommended decision:** B until evidence and business confirmation, then evaluate A.
- **Why:** avoids invented prices and semantic deletion.
- **Evidence level:** `ACCEPTED_TARGET`.
- **Reversibility:** `HARD`
- **Decision owner:** `ADI/business`
- **Business decision:** FREE is a valid Target v1 capability. The prior direction to remove `ResourcePricingType.FREE` is rejected.
- **Target direction:** `ResourcePricingType` remains closed `FREE` / `FIXED`. `FREE => price=NULL`; `FIXED => price IS NOT NULL AND price > 0`; currency for priced resources is `CRC`. Do not represent FREE with zero price.
- **Financial behavior:** FREE resource approval creates no payable positive `FinancialCharge`. FIXED approval creates `FinancialCharge.amount` that freezes approved price.
- **Implementation gap:** Current approval requires FIXED positive pricing. Supporting FREE approval without payable charge requires application implementation change in later work.
- **Reservation workflow:** Final Target v1 states are `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. `CONFIRMED` and `COMPLETED` do not belong to final Target workflow; current data has zero rows in both states, but code/policy still contains them and no service transition into either was found.
- **Design decision status:** `CLOSED`
- **Migration gate:** `RES-STATUS-01` — audit all application readers/writers, update tests, confirm no persisted legacy rows, remove application compatibility, then execute safe destructive enum migration.
- **Migration gate status:** `OPEN`
- **Status:** `CLOSED_WITH_MIGRATION_GATE`

## Business confirmation checklist

Daniel/ADI confirmations closed TM-D02, TM-D03, TM-D04, TM-D08, TM-D12 and TM-D13. `BUSINESS_GATES_REMAINING=0`.

`RES-STATUS-01` is a migration gate, not a pending business confirmation. It requires reader/writer, test and persisted-data audit before destructive cleanup of `CONFIRMED`/`COMPLETED`.

## Decision status audit

| Category | Decisions | Count |
| --- | --- | ---: |
| Fully closed | `TM-D01`, `TM-D02`, `TM-D03`, `TM-D04`, `TM-D08`, `TM-D09` | 6 |
| Closed with migration gate | `TM-D05`, `TM-D06`, `TM-D07`, `TM-D10`, `TM-D11`, `TM-D12`, `TM-D13` | 7 |
| Partially resolved | None | 0 |
| Open design decisions | None | 0 |

The migration gates do not reopen the final Target structure. They block implementation sequencing or destructive constraint enforcement until evidence is refreshed.

## Migration gate closure criteria

| Gate | Blocking condition | Evidence required | Exit criterion |
| --- | --- | --- | --- |
| `ID-01` | Canonical Person identity cannot be enforced while duplicates or unmatched records remain. | Reconciliation coverage, duplicate-resolution decisions, quarantine list and rollback plan. | Every affected record maps to one canonical Person or an approved quarantine path; rollback is tested. |
| `ASM-DATE-01` | `scheduledAt`/`heldAt` enforcement could invent historical occurrence. | Fresh Assembly date/status extract and exception report. | Each row maps by rule, with `heldAt` populated only by explicit evidence; exceptions are quarantined. |
| `GOV-HIST-01` | Governance memberships cannot be inferred from security roles. | Convocation-role mapping report and preserved snapshots for unmapped rows. | Every mapped membership has evidence; remaining rows retain snapshot without fabricated membership. |
| `ASM-ATT-01` | New attendance and justification FKs cannot be enforced without complete parent mapping. | Convocation, attendance and justification mapping report, including `JUSTIFIED` exceptions. | Every linked row has verified parents; incomplete rows are quarantined or remain outside enforcement scope. |
| `FIN-ORIGIN-01` | Explicit singular financial origins cannot replace generic `source/sourceId` safely. | Origin classification and Payment/Donation/Disbursement correspondence reports. | Every movement is classified as valid manual or exactly one supported origin; exceptions are quarantined. |
| `FIN-DON-01` | Donation original/reversal history cannot be made mandatory without verified correspondence. | FK validation, reviewed heuristic-match results and unresolved exception list. | Each retained Donation has one verified original movement and any reversal chain is valid; unresolved rows are quarantined. |
| `INV-LEDGER-01` | Signed ledger and `currentQuantity` constraint cannot be imposed before backfill policy. | Opening-balance algorithm, signed movement conversion report and non-negative balance validation. | Reconstructed balances match approved available-quantity semantics with no unresolved negative balance. |
| `INV-LOAN-01` | Historical loan movement FKs cannot be populated without evidence. | Loan-to-movement evidence report and nullable/unresolved inventory-loan list. | Only evidence-backed links are created; unsupported historical links remain null or quarantined by approved policy. |
| `RES-STATUS-01` | Removing `CONFIRMED`/`COMPLETED` could break writers/readers or persisted history. | Reader/writer audit, updated tests, persisted-status query result and compatibility-removal review. | No readers/writers, tests or persisted rows depend on legacy states; safe enum migration is approved. |

## Non-blocking findings

### TM-N01 — Nullable identity uniqueness

- **Issue:** PostgreSQL composite unique constraints allow multiple rows containing NULL.
- **Affected artifact:** `logical-model.md`, `integrity-rules.md`, `current-model.md`
- **Recommended cleanup:** document null semantics or use conditional uniqueness after identity policy is decided.
- **Fix before Stage 2A commit:** NO; address before DDL/identity transition.

### TM-N02 — Audit generic references

- **Issue:** `AuditLog.entityType/entityId` are intentionally non-FK metadata.
- **Affected artifact:** `logical-model.md`, `current-model.md`, `integrity-rules.md`
- **Recommended cleanup:** state consumer rule that metadata is never domain integrity.
- **Fix before Stage 2A commit:** NO.

### TM-N03 — Enforcement visibility for secondary validations

- **Issue:** failed-login count, attachment metadata and cross-row loan checks need explicit enforcement ownership.
- **Affected artifact:** `integrity-rules.md`, `data-dictionary.md`
- **Recommended cleanup:** keep each rule classified as DB, backend or transaction.
- **Fix before Stage 2A commit:** NO.

### TM-N04 — Financial enum replacement compatibility

- **Issue:** Current movement source/status enums differ from Target origin/status enums.
- **Affected artifact:** `target-model.md`, `logical-model.md`, `current-model.md`
- **Recommended cleanup:** document staged compatibility in Migration Roadmap after decisions.
- **Fix before Stage 2A commit:** NO.

### TM-N05 — Prisma DSL limits

- **Issue:** partial membership uniqueness, conditional quorum, signed movement checks and cross-table equality need SQL or application logic.
- **Affected artifact:** `logical-model.md`, `integrity-rules.md`
- **Recommended cleanup:** preserve implementation notes and classify each enforcement mechanism before DDL.
- **Fix before Stage 2A commit:** NO.

### TM-N06 — AssemblyMinute editorial lifecycle

- **Issue:** exact editorial ownership/cardinality/lifecycle remains open without invalidating conceptual separation.
- **Affected artifact:** `conceptual-model.md`, `logical-model.md`, `data-dictionary.md`
- **Recommended cleanup:** close fields and lifecycle before DB-1.
- **Fix before Stage 2A commit:** NO.

### TM-N07 — Reservation legacy status cleanup

- **Issue:** `CONFIRMED` and `COMPLETED` remain transitional until usage/data reconciliation.
- **Affected artifact:** `target-model.md`, `integrity-rules.md`, `current-model.md`
- **Recommended cleanup:** resolve under `TM-D13`/`BV-03` before destructive enum change.
- **Fix before Stage 2A commit:** NO.

### TM-N08 — OrganizationProfile field closure

- **Issue:** exact singleton profile attributes and legal-field semantics are not fully closed.
- **Affected artifact:** `logical-model.md`, `data-dictionary.md`, `target-model.md`
- **Recommended cleanup:** confirm fields before DDL without inventing legal requirements.
- **Fix before Stage 2A commit:** NO.

## Business validation dependencies

No ADI/business confirmation remains open for Target v1 design. Historical mapping, data reconciliation and legacy reservation-status cleanup are migration/technical gates, not open business decisions.

## Transition dependencies

Before any migration planning can be considered complete, the following evidence must exist:

1. Identity reconciliation coverage, duplicate resolution, unmatched quarantine and rollback strategy.
2. Convocation role mapping and preservation of historical snapshots.
3. Convocation, attendance and justification mapping reports, including `JUSTIFIED` exceptions.
4. FREE/FIXED pricing migration validation, including no-charge behavior for FREE reservations.
5. Financial source classification and Payment/Donation/Disbursement correspondence reports.
6. Explicit FK delete/update matrix.
7. Inventory quantity semantics, signed movement conversion and loan movement evidence policy.
8. Legacy reservation-status reader/writer and persisted-data audit before enum cleanup.

## Resolution protocol

1. Architecture review assigns an owner to each `TM-D01..TM-D13`.
2. Owners record decision rationale and evidence outside this register or in an approved decision log.
3. Business decisions require ADI confirmation; engineering decisions require implementation feasibility review.
4. No decision changes Target documents until explicitly approved.
5. After decisions, perform one isolated Target v1 reconciliation pass across conceptual model, logical model, target model, dictionary and integrity rules.
6. Re-run formal review and update blocker/non-blocker counts.
7. Do not create Gap Matrix or Migration Roadmap while any blocker remains unresolved.

## Decision closure status

Target v1 is ready for document reconciliation when:

- all 13 design decisions are `CLOSED` or `CLOSED_WITH_MIGRATION_GATE`;
- no business decision remains open;
- the relation matrix is complete;
- every migration gate has a blocking condition, required evidence and exit criterion;
- no blocker leaves final Target structure undefined.

`TARGET_MODEL_READY_FOR_RECONCILIATION=YES`

This does not authorize Gap Matrix work.

## Exit criteria

Target v1 can be declared ready for Gap Matrix only when:

- `G1_DOMAIN_SEMANTICS=PASS`;
- `G2_RELATIONAL_DESIGN=PASS`;
- `G3_INTEGRITY=PASS`;
- `G4_TRANSITION_SAFETY=PASS`;
- `G5_IMPLEMENTABILITY=PASS`;
- or any remaining note is explicitly classified as non-blocking;
- all `TM-D01..TM-D13` are resolved, documented and reflected consistently;
- transition gates and business validation evidence are named and owned;
- Target documents agree on entities, keys, cardinalities, nullability and enforcement.

Until then:

`TARGET_MODEL_READY_FOR_GAP_MATRIX=NO`
