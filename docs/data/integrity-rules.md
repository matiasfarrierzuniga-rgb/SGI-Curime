---
title: SGI-Curime Target Integrity Rules
status: ACCEPTED
version: v1
baseline: dd815e7509799f91e00e45eed3ab7d8560aa7df5
last_reviewed: 2026-09-20
---

# SGI-Curime Target Integrity Rules v1

## 1. Purpose

Este catálogo centraliza invariantes aceptados para Target v1 y su lugar de enforcement previsto. No afirma que estén implementados. Estado real y constraints actuales permanecen en [`current-model.md`](./current-model.md).

Clasificación:

- **DB constraint:** PK, FK, UNIQUE, CHECK o constraint SQL equivalente.
- **Application validation:** validación contextual antes de persistir.
- **Transactional rule:** lectura y escritura atómicas, bloqueo o aislamiento requerido.
- **Transition gate:** backfill o comprobación obligatoria antes de endurecer estructura.

## 2. Organization

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `ORG-01` | Sólo existe un `OrganizationProfile`; el sistema representa una ADI. | DB fixed-key row plus equivalent singleton constraint | Accepted |
| `ORG-02` | No se agrega `organizationId` a todas las tablas. | Model boundary | Accepted |
| `ORG-03` | Campos institucionales exactos requieren evidencia antes de DDL. | Application/documentation closure item | Does not reopen singleton design |

## 3. Identity

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `ID-R01` | `(Person.identificationType, Person.normalizedIdentification)` es único cuando la semántica null lo permita. | DB UNIQUE | Accepted |
| `ID-R02` | Cada `User` Target final referencia exactamente una `Person`; `personId` es único. | DB FK, NOT NULL, UNIQUE | Accepted after `ID-01` |
| `ID-R03` | Cada `Affiliate` Target final referencia exactamente una `Person`; `personId` es único. | DB FK, NOT NULL, UNIQUE | Accepted after `ID-01` |
| `ID-R04` | Snapshots históricos en solicitudes no se reescriben desde `Person`. | Application validation | Accepted |
| `ID-R05` | Duplicados personales sólo se eliminan después de reconciliación segura. | Transition gate | Accepted |

### ID-01 — User/Affiliate identity

**Blocks:** `User.personId NOT NULL UNIQUE`, `Affiliate.personId NOT NULL UNIQUE` and duplicate-data removal. **Evidence:** reconciliation coverage, duplicate-resolution decisions, approved quarantine and rollback plan. **Exit:** every affected record maps to a canonical Person or approved quarantine path, with validated rollback. `IdentityReconciliationManifest` remains temporary while it provides this evidence.

## 4. Security and access

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `SEC-01` | `Permission.code` es único y estable. | DB UNIQUE | Accepted |
| `SEC-02` | Un permiso se asigna una sola vez a cada rol. | DB PK/UQ `(roleId, permissionId)` | Accepted |
| `SEC-03` | Ausencia de asignación implica denegación. | Application authorization | Accepted, default deny |
| `SEC-04` | Cada usuario conserva exactamente un rol. | DB FK NOT NULL | Accepted |
| `SEC-05` | Target v1 no permite permisos directos ni roles múltiples por usuario. | Model boundary | Accepted |
| `SEC-06` | Cargo de gobernanza no concede autorización automáticamente. | Application authorization and model boundary | Accepted |
| `SEC-07` | Tokens persistidos son hashes únicos, expiran y sólo se consumen una vez. | DB UNIQUE plus application validation | Accepted |
| `SEC-08` | Intentos fallidos de acceso nunca son negativos. | Application validation | Accepted |

## 5. Governance

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `GOV-R01` | `GovernancePosition.code` es único. | DB UNIQUE | Accepted |
| `GOV-R02` | `GovernanceTerm.startDate < endDate`. | DB CHECK | Accepted |
| `GOV-R02A` | `GovernanceTerm.status` is `PLANNED`, `ACTIVE`, `CLOSED` or `CANCELLED`. | DB enum/check | Accepted |
| `GOV-R03` | `GovernanceMembership.seatNumber > 0`. | DB CHECK | Accepted |
| `GOV-R04` | Sólo una membresía activa ocupa `(termId, positionId, seatNumber)`. | Partial DB UNIQUE where `endedAt IS NULL` | Accepted; may require explicit SQL |
| `GOV-R05` | No existe UNIQUE `(termId, affiliateId)`; un afiliado puede ocupar distintos cargos históricamente. | Model boundary | Accepted |
| `GOV-R06` | `endedAt` null identifica membresía activa; si existe, es posterior a `startedAt`. | DB CHECK | Accepted |
| `GOV-R07` | Un nombramiento puede referir una asamblea sólo cuando existe evidencia. | Application validation | Accepted |

### GOV-HIST-01 — Historical governance

**Blocks:** creation of historical memberships inferred from security roles. **Evidence:** convocation-role mapping and preserved snapshots for unmapped rows. **Exit:** every mapped membership has evidence; unmapped rows retain snapshots without fabricated membership.

## 6. Assemblies

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `ASM-R01` | `Assembly.type` es `ORDINARY` o `EXTRAORDINARY`. | DB enum/check | Accepted |
| `ASM-R02` | Estados son `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. | DB enum/check | Accepted |
| `ASM-R02A` | `scheduledAt` is required and `heldAt` is nullable; completion does not imply `heldAt=scheduledAt`. | DB nullability plus migration rule | Accepted |
| `ASM-R03` | `AssemblyCall.callNumber > 0` y es único por asamblea. | DB CHECK and UNIQUE | Accepted |
| `ASM-R04` | Cuórum `FIXED` es positivo; `PERCENTAGE` está entre 1 y 100. | DB CHECK | Accepted |
| `ASM-R05` | Convocatoria individual es única por asamblea/afiliado. | DB UNIQUE | Accepted |
| `ASM-R06` | Convocatoria no referencia security `Role`. | Model boundary | Accepted |
| `ASM-R07` | Si se informa membresía de gobernanza, corresponde al afiliado convocado. | Application validation | Accepted |
| `ASM-R08` | Una convocatoria tiene como máximo una asistencia. | DB UNIQUE on `convocationId` | Accepted |
| `ASM-R09` | Attendance sólo usa `PRESENT` o `ABSENT`; justificación es entidad separada. | DB enum/check | Accepted after safe transition |
| `ASM-R10` | Una asistencia tiene como máximo una justificación y sólo si está ausente. | DB UNIQUE plus application validation | Accepted |
| `ASM-R11` | No toda decisión de Junta Directiva se registra como `AssemblyResolution`. | Domain boundary | Accepted |
| `ASM-R12` | Cardinalidad/lifecycle editorial de actas debe cerrarse antes de DDL. | Business validation gate | Open closure item |
| `ASM-R13` | Tamaño de evidencia adjunta es positivo cuando existe y sus metadatos son consistentes. | DB CHECK plus application validation | Accepted |

### ASM-DATE-01 — Assembly timestamp mapping

**Blocks:** `heldAt` backfill or enforcement that would infer historical occurrence. **Evidence:** fresh Assembly date/status extract and exception report. **Exit:** Current date maps to `scheduledAt`; `heldAt` is populated only by explicit evidence and exceptions are quarantined.

### ASM-ATT-01 — Attendance and justification mapping

**Blocks:** Target attendance/justification FKs before verified parent mapping. **Evidence:** convocation, attendance and justification report, including `JUSTIFIED` exceptions. **Exit:** every linked row has verified parents; incomplete rows are quarantined or remain outside enforcement scope.

## 7. Reservations and events

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `RES-01` | `Reservation.startAt < endAt`. | DB CHECK | Accepted |
| `RES-02` | Nuevas reservas no empiezan en el pasado. | Application validation | Accepted; current behavior retained |
| `RES-03` | Duración permitida es 1-12 horas. | Application validation or DB CHECK | Accepted; current behavior retained |
| `RES-04` | Recurso debe estar `ACTIVE` al reservar. | Application validation in transaction | Accepted; current behavior retained |
| `RES-05` | No existe overlap para estados bloqueantes `PENDING`, `APPROVED`. | Transactional rule | Accepted; legacy `CONFIRMED` behavior remains only until `RES-STATUS-01` |
| `RES-06` | Creación/aprobación sensible a overlap usa transacción serializable. | Transactional rule | Accepted; current behavior retained |
| `RES-07` | `Event 1 -> 0..N Reservation`; `Reservation.eventId` es nullable. | DB FK nullable | Accepted |
| `RES-08` | Cada reserva tiene como máximo un cargo. | DB UNIQUE on `FinancialCharge.reservationId` | Accepted |
| `RES-09` | Reservation no almacena price snapshot. | Model boundary | Accepted |
| `RES-10` | FREE requires `price IS NULL` and no payable `FinancialCharge`; FIXED requires positive CRC price and its charge freezes that price. | DB conditional CHECK plus application/transactional validation | Accepted |

### RES-STATUS-01 — Reservation legacy status cleanup

**Blocks:** destructive removal of `CONFIRMED`/`COMPLETED`. **Evidence:** reader/writer audit, updated tests, persisted-status result and compatibility-removal review. **Exit:** no readers, writers, tests or persisted rows depend on legacy states; safe enum migration is approved.

## 8. Finance and donations

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `FIN-R01` | Todo movimiento Target pertenece a una cuenta financiera. | DB FK NOT NULL | Accepted |
| `FIN-R02` | Montos de cargos, pagos, movimientos, donaciones, gastos, desembolsos y allocations son positivos. | DB CHECK | Accepted |
| `FIN-R03` | Tipo del movimiento determina entrada/salida; monto no usa signo negativo. | DB CHECK plus application validation | Accepted |
| `FIN-R04` | Campos económicos de movimiento `POSTED` son inmutables; única mutación permitida es transición controlada a `VOIDED` con metadata completa. | Application/DB protection | Accepted |
| `FIN-R05` | Movimiento contabilizado no se hard-deletea. | DB permissions and application rule | Accepted |
| `FIN-R06` | Error administrativo cambia estado a `VOIDED` con actor, fecha y razón, sin reescribir campos económicos. | DB CHECK plus transactional rule | Accepted |
| `FIN-R07` | Reversión financiera real crea nuevo movimiento con `reversalOfId`. | DB self FK/UQ plus transactional rule | Accepted |
| `FIN-R08` | Movimiento no puede revertirse a sí mismo. | DB CHECK | Accepted |
| `FIN-R09` | `Payment.movementId` es FK única y requerida en Target final. | DB FK, UNIQUE, NOT NULL | Accepted after `FIN-ORIGIN-01` |
| `FIN-R10` | `Donation.originalMovementId` es FK única y requerida en Target final. | DB FK, UNIQUE, NOT NULL | Accepted after `FIN-DON-01` |
| `FIN-R11` | `Donation.reversalMovementId` no existe en forma final. | Model boundary | Accepted after `FIN-DON-01` |
| `FIN-R12` | `Disbursement.movementId` es FK única y movimiento de tipo `EXPENSE`. | DB FK/UQ plus application validation | Accepted |
| `FIN-R13` | Método compartido usa `FinancialMethod`: `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `CHECK`, `OTHER`. | DB enum/check | Accepted |
| `FIN-R14` | Una autorización de gasto puede referir resolución, pero no es obligatoria para toda salida. | Nullable DB FK | Accepted |
| `FIN-R15` | Documento de gasto pertenece a un gasto y tiene tamaño positivo. | DB FK and CHECK | Accepted |
| `FIN-R16` | `FundingAllocation.incomeMovementId`, when present, references an income and is not unique; one income can fund many allocations. | DB FK plus application validation | Accepted |
| `FIN-R17` | Exact settlement se conserva temporalmente. | Transactional/application rule | Accepted |
| `FIN-R18` | Movimiento de `Payment` es `INCOME`, tiene origen `PAYMENT` y concuerda en monto/moneda. | Application validation in transaction | Accepted |
| `FIN-R19` | Movimiento original de `Donation` es `INCOME`, tiene origen `DONATION` y concuerda en monto/moneda. | Application validation in transaction | Accepted |
| `FIN-R20` | Movimiento de `Disbursement` es `EXPENSE`, tiene origen `DISBURSEMENT` y concuerda en monto/moneda. | Application validation in transaction | Accepted |
| `FIN-R21` | Un movimiento con origen singular no respalda simultáneamente pago, donación y desembolso. | Transactional application validation | Accepted |
| `FIN-R22` | Tamaño de `ExpenseDocument` es positivo. | DB CHECK | Accepted |
| `FIN-R23` | Moneda del movimiento concuerda con moneda de su cuenta financiera. | Application validation in transaction | Accepted |
| `FIN-R24` | `Expense.status` is `PENDING`, `APPROVED`, `REJECTED` or `CANCELLED`; it records authorization, not monetary execution. | DB enum/check plus application validation | Accepted |
| `FIN-R25` | Allocation amount is positive; income availability and aggregate allocations are validated without inferring an overspend policy. | DB CHECK plus transactional/application validation | Accepted |

### FIN-ORIGIN-01 — Explicit FinancialMovement origins

**Blocks:** removal of generic `source`/`sourceId`. **Evidence:** origin classification and Payment/Donation/Disbursement correspondence reports. **Exit:** every movement is a valid manual entry or has exactly one verified supported origin. Target uses explicit FKs plus `originType`, never a polymorphic identifier.

### FIN-DON-01 — Donation history

**Blocks:** `Donation.originalMovementId NOT NULL` and removal of redundant reversal representation. **Evidence:** FK validation, reviewed matching and unresolved exception list. **Exit:** every retained donation has verified original/reversal evidence; unresolved rows are quarantined and no movement is fabricated.

`FundingSourceType` acepta `FONDO_POR_GIRAR`, `IMPUESTO_CEMENTO`, `OWN_FUNDS`, `OTHER`. No se modela una tabla `FundingSource` ni referencia genérica. La disponibilidad y suma de allocations son reglas de enforcement futuras, no una decisión Target abierta.

## 9. Inventory

| ID | Rule | Enforcement | Target status |
| --- | --- | --- | --- |
| `INV-R01` | `InventoryMovement.quantityDelta != 0`. | DB CHECK | Accepted |
| `INV-R02` | Tipos son `OPENING_BALANCE`, `ENTRY`, `EXIT`, `ADJUSTMENT`. | DB enum/check | Accepted |
| `INV-R03` | ENTRY uses positive delta; EXIT uses negative delta; ADJUSTMENT is signed non-zero; OPENING_BALANCE is approved initial/migration baseline. | DB CHECK or application validation | Accepted |
| `INV-R04` | `InventoryItem.currentQuantity >= 0` and means available quantity. | DB CHECK plus transactional update | Accepted after `INV-LEDGER-01` |
| `INV-R05` | `minimumQuantity >= 0`. | DB CHECK | Accepted |
| `INV-R06` | Préstamo tiene cantidad positiva y retorno esperado posterior a salida. | DB CHECK | Accepted |
| `INV-R07` | Estado de préstamo concuerda con retorno o cancelación. | DB CHECK plus application validation | Accepted |
| `INV-R08` | Cada FK de movimiento de préstamo es opcional, explícita y única. | DB FK/UQ | Accepted |
| `INV-R09` | Target v1 mantiene un ítem por préstamo. | Model boundary | Accepted |
| `INV-R10` | Referencias textuales como `LOAN-{id}` no sustituyen FKs explícitas. | Application/model rule | Accepted |
| `INV-R11` | Un movimiento no se reutiliza entre roles de checkout, retorno o cancelación; referencia el mismo ítem y su tipo/delta/magnitud concuerdan con rol y cantidad prestada. | Transactional application validation | Accepted |

### INV-LEDGER-01 — Signed ledger and available quantity

**Blocks:** signed-ledger/current-quantity enforcement before opening-balance backfill. **Evidence:** approved opening-balance algorithm, conversion report and non-negative balance validation. **Exit:** reconstructed balances match available-quantity semantics with no unresolved negative balance.

### INV-LOAN-01 — Historical loan movement evidence

**Blocks:** population of historical loan-movement FKs without evidence. **Evidence:** loan-to-movement report and unresolved nullable-link list. **Exit:** only evidence-backed links are created; unsupported historical links remain null or are quarantined by approved policy.

## 10. Cross-cutting transition controls

| Control | Requirement |
| --- | --- |
| Backfill evidence | Toda columna nueva `NOT NULL` requiere conteo de cobertura, excepciones y validación repetible. |
| Explicit relationships | Una FK nueva no se impone hasta demostrar correspondencia completa o estrategia documentada para excepciones. |
| Destructive enum change | Valor no se elimina hasta verificar cero usos o migrar cada fila con semántica aprobada. |
| Historical integrity | No se fabrican hechos para satisfacer constraints nuevos. |
| Rollback | Stage 2B debe definir rollback o forward-fix seguro por etapa. |
| CURRENT updates | Sólo tras implementación y verificación se actualiza documentación `CURRENT`. |
| Referential actions | Every Target FK uses its relation-specific TM-D09 `onDelete` action and `onUpdate CASCADE`; migration gates never alter final relation policy. |

## 11. Implementation boundary

Este catálogo define destino, no secuencia. Current-to-Target Gap Matrix y Migration Roadmap se crearán en Stage 2B. Ninguna regla marcada como Target debe reportarse implementada hasta validación contra schema, migraciones y base reconciliada.

## ADD_STATUS_NOTE: Target/gate definitions preserved; implemented vs deferred clarified

Frozen Target v1 integrity rules (IDs ORG-01 through INV-R11, plus transition gates ID-01, ASM-DATE-01, ASM-ATT-01, FIN-ORIGIN-01, FIN-DON-01, INV-LEDGER-01, INV-LOAN-01, RES-STATUS-01) remain the preserved historical design baseline. These rule definitions and their gate statuses are unchanged.

**V1.1 structural implementation:** The merged implementation at main@71aa989 (PR #102) provides the V1.1 structural contract. The following gates remain evidence-dependent deferred cutover points, not yet enforced as DB constraints:

- `ID-01`: Person canonical mapping + duplicate-data removal
- `ASM-ATT-01`: Complete parent mapping before new attendance/justification FKs
- `FIN-ORIGIN-01`: Explicit-origin reconciliation before generic `sourceId` removal
- `FIN-DON-01`: Donation original/reversal evidence before redundant-field removal
- `INV-LEDGER-01`: Signed ledger enforcement before opening-balance backfill
- `INV-LOAN-01`: Evidence-backed loan-movement links
- `ASM-DATE-01`: Date evidence mapping before `heldAt` backfill/enforcement
- `RES-STATUS-01`: Non-destructive `CONFIRMED`/`COMPLETED` removal

**Package distinction:** V1 integrity rules (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`) distinguish the frozen historical design from the actual merged V1.1 implementation. The V1.1 package records `IMPLEMENTATION_STATUS=IMPLEMENTED` at the merged checkpoint, but deferred gates require evidence before enforcement.

**Do not treat structural implementation as completed historical reconciliation.** The integrity rules define target destination; migration gates define sequencing. Current model reflects 49 persistent + 1 transitional at main@71aa989; rule enforcement waits on each gate's evidence exit criterion.
