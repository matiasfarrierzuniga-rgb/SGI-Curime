---
title: SGI-Curime Target Data Model
status: ACCEPTED
version: v1
baseline: dd815e7509799f91e00e45eed3ab7d8560aa7df5
last_reviewed: 2026-09-20
---

# SGI-Curime Target Data Model v1

## 1. Authority and status

Este documento es la referencia central del **Target Data Model v1** aceptado.

> **ACCEPTED no significa CURRENT.**

Ninguna tabla, columna, relación o constraint descrito aquí debe asumirse implementado. El estado real permanece en [`current-model.md`](./current-model.md). Stage 2A no cambia código, Prisma, migraciones ni base de datos.

## 2. Target boundary

- Alcance: una sola ADI; sin multi-tenancy.
- Raíz institucional: `OrganizationProfile` singleton.
- Modelo final: **40 entidades persistentes**.
- Infraestructura transicional adicional: **1**, `IdentityReconciliationManifest`.
- Nuevas entidades: **14**.

El conteo final deriva de 26 entidades actuales de dominio que permanecen más 14 entidades nuevas. El manifiesto transicional actual no se cuenta como entidad final.

## 3. Entity inventory

### Existing entities that remain with no structural change accepted in v1

Las estructuras actuales continúan salvo ajustes futuros derivados de implementación y constraints ya documentados:

| Domain | Entities |
| --- | --- |
| Security | `Session`, `PasswordResetToken`, `AccountActivationToken` |
| Requests and affiliation | `AffiliateRequest`, `AffiliateSanction` |
| Events | `Event` |
| Inventory | `InventoryCategory` |

### Existing entities that change

| Entity | Accepted Target change |
| --- | --- |
| `Person` | Identidad humana canónica para cuenta y afiliación. |
| `UserRequest` | `reviewedById` becomes nullable FK to `User` with `ON DELETE SET NULL`; no reviewer snapshot. |
| `Role` | Sólo autorización; incorpora asignación persistida de permisos y pierde semántica de cargo institucional. |
| `User` | `personId NOT NULL UNIQUE`; conserva un único `roleId`; elimina atributos personales duplicados sólo tras `ID-01`. |
| `AuditLog` | Permanece como auditoría; referencias genéricas no se convierten en patrón de relaciones de dominio. |
| `Affiliate` | `personId NOT NULL UNIQUE`; elimina rol de seguridad y atributos personales duplicados tras `ID-01`. |
| `Assembly` | Tipo enum, `scheduledAt`, `heldAt?`; cuórum temporal se mueve a llamadas. |
| `AssemblyConvocation` | Deja `Role`; puede referir `governanceMembershipId?` y conservar `positionNameSnapshot?`. |
| `AssemblyAttendance` | Se relaciona por `convocationId UNIQUE`; estado sólo `PRESENT` o `ABSENT`. |
| `AbsenceJustification` | Se relaciona por `attendanceId UNIQUE`; justificación separada del estado de asistencia. |
| `ReservableResource` | `FREE` usa `price=NULL`; `FIXED` usa precio positivo CRC. FREE no genera cargo pagable. |
| `Reservation` | Workflow final de cuatro estados; `CONFIRMED`/`COMPLETED` son legacy hasta `RES-STATUS-01`. |
| `FinancialCharge` | Conserva `reservationId UNIQUE`; `amount` es snapshot de precio, sin puente adicional. |
| `Payment` | Usa `FinancialMethod`; añade `movementId UNIQUE` FK explícita. |
| `FinancialMovement` | Añade cuenta, estado, origen tipado, void metadata y self-reference de reversa; elimina referencia genérica sólo tras `FIN-ORIGIN-01`. |
| `Donation` | Donante canónico opcional más snapshots; movimiento original obligatorio y único; reversa sólo mediante ledger tras `FIN-DON-01`. |
| `InventoryItem` | `currentQuantity >= 0` es cantidad disponible; enforcement/backfill sujeto a `INV-LEDGER-01`. |
| `InventoryMovement` | Ledger con `quantityDelta` firmado no cero y tipo `OPENING_BALANCE`. |
| `InventoryLoan` | Snapshot del prestatario, cancelación y FKs explícitas opcionales a movimientos. |

### New entities

| # | Entity | Purpose |
| ---: | --- | --- |
| 1 | `OrganizationProfile` | Perfil singleton de la ADI. |
| 2 | `Permission` | Capability persistida y estable. |
| 3 | `RolePermission` | Asignación única de permiso a rol. |
| 4 | `GovernancePosition` | Catálogo institucional de cargos. |
| 5 | `GovernanceTerm` | Período formal de Junta Directiva. |
| 6 | `GovernanceMembership` | Ocupación histórica de cargo por afiliado. |
| 7 | `AssemblyCall` | Primera, segunda u otra llamada temporal de asamblea. |
| 8 | `AssemblyMinute` | Acta vinculada a asamblea. |
| 9 | `AssemblyResolution` | Resolución formal vinculada a asamblea. |
| 10 | `FinancialAccount` | Cuenta, caja o fondo operativo del ledger. |
| 11 | `Expense` | Gasto o autorización económica. |
| 12 | `ExpenseDocument` | Documento probatorio específico de gasto. |
| 13 | `Disbursement` | Ejecución material de egreso. |
| 14 | `FundingAllocation` | Asignación de origen de fondos a gasto. |

### Transitional infrastructure

`IdentityReconciliationManifest` permanece temporalmente para reconciliar fuentes y respaldar `ID-01`. No pertenece al modelo final y su retiro requiere evidencia de transición completa.

## 4. Target relationship decisions

### Identity and access

- `OrganizationProfile` is enforced as a DB singleton through fixed row/key plus equivalent constraint.
- `User.personId`: required, unique FK to `Person` in final state.
- `Affiliate.personId`: required, unique FK to `Person` in final state.
- `UserRequest.reviewedById`: nullable FK to `User`; `onDelete SET NULL`; no reviewer snapshot is added.
- `User.roleId`: required FK to one `Role`.
- `RolePermission`: composite uniqueness over `roleId`, `permissionId`.
- Permissions derive their stable codes from current capabilities; authorization remains default deny.

### Governance and assemblies

- Governance positions never reference security `Role`.
- `GovernanceTerm.status` uses `GovernanceTermStatus`: `PLANNED`, `ACTIVE`, `CLOSED`, `CANCELLED`.
- Active `GovernanceMembership` requires partial uniqueness over `(termId, positionId, seatNumber) WHERE endedAt IS NULL`; explicit SQL may be required because Prisma cannot fully express partial uniqueness.
- `appointedByAssemblyId` is optional; historical memberships cannot be inferred without evidence.
- `AssemblyCall` owns call schedule and quorum.
- `AssemblyConvocation` identifies invited affiliate and optional governance membership, not security role.
- `AssemblyAttendance.convocationId` and `AbsenceJustification.attendanceId` are unique FKs.
- Exact editorial cardinality/fields for `AssemblyMinute` remain closure work before DB-1; `AssemblyResolution` can be plural per assembly.

### Reservations

- `Event 1 -> 0..N Reservation`; `Reservation.eventId` nullable.
- `Reservation 1 -> 0..1 FinancialCharge`; `FinancialCharge.reservationId UNIQUE`.
- No price snapshot is added to `Reservation`.
- Final `ReservationStatus` is `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. `CONFIRMED` and `COMPLETED` remain legacy only until `RES-STATUS-01` passes.
- `ResourcePricingType.FREE` requires `price=NULL` and creates no payable `FinancialCharge`; `FIXED` requires positive CRC price and its charge freezes that price.

### Finance

- Every target `FinancialMovement` belongs to one `FinancialAccount`.
- `Payment.movementId`, `Donation.originalMovementId` and `Disbursement.movementId` are explicit unique FKs.
- `FinancialMovement.reversalOfId` is a nullable unique self-reference when direct single reversal applies.
- Generic `sourceId` is absent from final shape; removal waits for `FIN-ORIGIN-01`.
- `Donation.reversalMovementId` is absent from final shape; migration waits for `FIN-DON-01`.
- Shared `FinancialMethod`: `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `CHECK`, `OTHER`.
- `FundingSourceType`: `FONDO_POR_GIRAR`, `IMPUESTO_CEMENTO`, `OWN_FUNDS`, `OTHER`.
- `ExpenseStatus` is `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`: pending authorization, authorized, denied authorization, and withdrawn/voided before execution, respectively. Expense records authorization/formal registration, while Disbursement records material execution.
- `FundingAllocation.incomeMovementId` is nullable and not unique. One income `FinancialMovement` can support `0..N` allocations; every allocation has positive `amount`.

### Inventory

- `InventoryMovement.quantityDelta` is signed and non-zero.
- `InventoryItem.currentQuantity` is non-negative available quantity; checkout decreases it and return/cancellation restore it when applicable.
- `InventoryLoan` references at most one checkout, return and cancellation movement; each reference is optional and explicit.

## 5. Target enums

| Enum | Accepted values / transition |
| --- | --- |
| `AssemblyType` | `ORDINARY`, `EXTRAORDINARY` |
| `AssemblyStatus` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `AssemblyQuorumType` | `FIXED`, `PERCENTAGE` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`; legacy `JUSTIFIED` is quarantined/reconciled under `ASM-ATT-01` |
| `ReservationStatus` | Primary: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`; transitional legacy: `CONFIRMED`, `COMPLETED` |
| `ResourcePricingType` | `FREE`, `FIXED` |
| `GovernanceTermStatus` | `PLANNED`, `ACTIVE`, `CLOSED`, `CANCELLED` |
| `ExpenseStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `FinancialMethod` | `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `CHECK`, `OTHER` |
| `FinancialMovementType` | `INCOME`, `EXPENSE` |
| `FinancialMovementStatus` | `POSTED`, `VOIDED` |
| `FinancialMovementOriginType` | `MANUAL`, `PAYMENT`, `DONATION`, `DISBURSEMENT` |
| `FundingSourceType` | `FONDO_POR_GIRAR`, `IMPUESTO_CEMENTO`, `OWN_FUNDS`, `OTHER` |
| `InventoryMovementType` | `OPENING_BALANCE`, `ENTRY`, `EXIT`, `ADJUSTMENT` |

Enums actuales no reemplazados explícitamente por Target v1 permanecen según `current-model.md` until their documented transition. Target design decisions are closed; migration gates do not mean Target structure is undecided.

## 6. Migration gates

| Gate | Blocks | Exit criterion |
| --- | --- | --- |
| `ID-01` | `personId NOT NULL UNIQUE` and duplicate-data removal before identity reconciliation. | Every affected record maps to a canonical Person or approved quarantine path; rollback is validated. |
| `ASM-DATE-01` | `heldAt` backfill or enforcement that would infer historical occurrence. | Fresh date/status evidence maps `date` to `scheduledAt`; `heldAt` is populated only from explicit evidence. |
| `GOV-HIST-01` | Historical governance memberships inferred from security roles. | Every membership has evidence; unmapped rows retain snapshots without fabricated membership. |
| `ASM-ATT-01` | New attendance/justification FKs before complete parent mapping. | Verified mapping or approved quarantine exists for every affected historical row. |
| `FIN-ORIGIN-01` | Removal of generic `source/sourceId` before explicit-origin reconciliation. | Movements are valid manual entries or have exactly one verified supported origin. |
| `FIN-DON-01` | `Donation.originalMovementId NOT NULL` and removal of redundant reversal representation before history verification. | Retained donations have verified original/reversal evidence; exceptions are quarantined. |
| `INV-LEDGER-01` | Signed ledger/current-quantity enforcement before opening-balance backfill. | Approved conversion reconstructs non-negative available balances. |
| `INV-LOAN-01` | Historical loan-movement links without evidence. | Only evidence-backed links are created; unsupported links remain null or are quarantined. |
| `RES-STATUS-01` | Destructive removal of `CONFIRMED`/`COMPLETED`. | Readers/writers and tests are updated, persisted legacy rows are absent, and compatibility is removed. |

Detalle de enforcement en [`integrity-rules.md`](./integrity-rules.md).

## 7. Deliberately outside v1

- Multi-tenancy y `organizationId` distribuido.
- Roles múltiples por usuario o permisos directos por usuario.
- Puente adicional entre reserva y cargo.
- Tabla de métodos financieros.
- Fuente de fondos como catálogo persistente.
- Bodegas, ubicaciones de stock y catálogo de unidades.
- Activos individualizados y líneas múltiples de préstamo.
- Adjuntos genéricos y operaciones de dominio genéricas.

## 8. Implementation boundary

Stage 2A aprueba estructura y dirección, no una migración. Gap Matrix y Migration Roadmap pertenecen a Stage 2B. DB-1 sólo puede iniciar después de revisar estos artefactos, cerrar campos/cardinalidades pendientes que afecten DDL y definir backfill, compatibilidad, validación y rollback. All FK `onDelete` and `onUpdate` actions follow the complete TM-D09 matrix in [`target-model-decision-register.md`](./target-model-decision-register.md); it is authoritative for relation-specific exceptions.
