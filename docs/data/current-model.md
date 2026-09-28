---
title: SGI-Curime Current Data Model
status: CURRENT
baseline: 71aa989
last_reviewed: 2026-09-28
---

# SGI-Curime Current Data Model

> **Post-merge CURRENT notice (2026-09-28):** this inventory reflects the
> Prisma structural shape at `main@71aa989` (PR #102). It records implemented
> structure, including nullable compatibility links and legacy physical
> mappings; it does not claim that evidence-dependent cutover is complete.


## 1. Purpose

Este documento registra el modelo persistente **CURRENT / AS-IS** de SGI-Curime. Describe lo implementado en el baseline indicado, sin corregir conceptualmente el schema, proponer entidades Target ni convertir deuda actual en diseño aprobado.

Que una estructura aparezca aquí significa que existe. No significa que sea la arquitectura final aprobada.

## 2. Baseline

- Baseline de código: `main@71aa989` (PR #102).
- Fuente primaria: `backend/prisma/schema.prisma`.
- Fuente histórica y de restricciones físicas: `backend/prisma/migrations/`.
- Estado documental: `CURRENT`.
- Fecha de revisión: 2026-09-28.

**Frozen Target V1.1 boundary note:** This CURRENT snapshot reflects the physical implementation at main@71aa989 (PR #102). It records 49 persistent entities and 1 transitional entity as the structural contract. The Frozen Target V1.1 design is preserved separately; this file documents the AS-IS state at merge, not the approved Target design.

Los documentos `docs/architecture/current-state.md` y `docs/architecture/gap-analysis.md` se conservan como evidencia histórica, no como inventario vigente del modelo.

## 3. Data platform

- Base de datos: PostgreSQL.
- Acceso desde aplicación: Prisma ORM mediante `PrismaService`.
- Schema declarativo: `backend/prisma/schema.prisma`.
- Historial físico: 28 directorios de migración versionados bajo `backend/prisma/migrations/`.
- Identificadores principales: `Int` autoincremental en todos los modelos; `Event` añade `publicId` UUID único.
- Importes monetarios: `Decimal(14, 2)` con moneda almacenada como `String`, normalmente con default `CRC`.
- Fechas Prisma: `DateTime`; las migraciones actuales materializan estos campos como `TIMESTAMP(3)` sin zona horaria.

Algunas restricciones existen sólo en SQL de migraciones y no son visibles en el DSL de Prisma. Por ello, schema y migraciones deben leerse juntos.

## 4. Current domains

La siguiente clasificación facilita navegación; no crea límites físicos adicionales ni redefine ownership de módulos.

El baseline contiene exactamente **49 modelos Prisma persistentes**.

| Domain | Current models |
| --- | --- |
| Organization | `OrganizationProfile` |
| Identity and access | `Person`, `Role`, `Permission`, `RolePermission`, `User`, `Session`, `AuditLog`, `PasswordResetToken`, `AccountActivationToken`, `UserRequest` |
| Affiliation | `Affiliate`, `AffiliateRequest`, `AffiliateSanction` |
| Governance | `GovernancePosition`, `GovernanceTerm`, `GovernanceMembership` |
| Assemblies | `Assembly`, `AssemblyCall`, `AssemblyConvocation`, `AssemblyAttendance`, `AbsenceJustification`, `AssemblyMinute`, `AssemblyResolution` |
| Reservations and events | `Event`, `ReservableResource`, `Reservation` |
| Finance and donations | `FinancialAccount`, `FinancialCharge`, `Payment`, `FinancialMovement`, `Donation`, `Expense`, `ExpenseDocument`, `Disbursement`, `FundingAllocation` |
| Inventory | `InventoryCategory`, `InventoryItem`, `InventoryMovement`, `InventoryLoan` |
| Volunteering | `VolunteerOpportunity`, `VolunteerSession`, `VolunteerApplication`, `VolunteerParticipation`, `VolunteerAttendance` |
| Entrepreneurship | `Venture`, `VentureAssociation`, `VentureRequest`, `VentureRequestRevision` |

`IdentityReconciliationManifest` es la única entidad transicional y queda fuera
del conteo de 49 entidades persistentes.

Las reglas de ciclo de vida y casos de uso pertenecen a `docs/modules/`; este documento se limita a persistencia y relaciones actuales.

## 5. Current persistent models

### Organization

| Model | Current responsibility and notable structure |
| --- | --- |
| `OrganizationProfile` | Singleton lógico de identidad institucional; conserva mapping físico `@@map("InstitutionalProfile")` y campos canónicos nullable. |

### Identity, security and access

| Model | Current responsibility and notable structure |
| --- | --- |
| `Person` | Identidad personal compartida; sus datos y vínculos de reconciliación permanecen parcialmente nullable. |
| `Role` | Catálogo de roles de autorización con nombre único. |
| `Permission` | Catálogo persistente de capabilities por código único. |
| `RolePermission` | Asignación many-to-many de permisos a roles mediante PK compuesta. |
| `User` | Cuenta de acceso con rol requerido, campos personales legacy y `personId` nullable/unique bajo `ID-01`. |
| `Session` | Sesión persistida por hash de refresh token, expiración y revocación. |
| `AuditLog` | Evento de auditoría con actor opcional y referencias descriptivas genéricas. |
| `PasswordResetToken` | Token de recuperación único, expirable y dependiente de usuario. |
| `AccountActivationToken` | Token de activación único, expirable y dependiente de usuario. |
| `UserRequest` | Solicitud con snapshots de identidad/contacto, revisor opcional con FK y vínculo opcional a `Person`. |

### Affiliation

| Model | Current responsibility and notable structure |
| --- | --- |
| `Affiliate` | Afiliación con datos personales legacy, `personId` nullable/unique y `legacyRoleId` mapeado a la columna física `roleId`. |
| `AffiliateRequest` | Solicitud con revisión y reconciliación opcionales. |
| `AffiliateSanction` | Sanción asociada a afiliado y usuario creador. |

### Governance

| Model | Current responsibility and notable structure |
| --- | --- |
| `GovernancePosition` | Catálogo lógico de cargos institucionales por código único. |
| `GovernanceTerm` | Período lógico de gobernanza; preserva mapping físico `@@map("BoardTerm")`. |
| `GovernanceMembership` | Membresía lógica; preserva mapping físico `@@map("BoardAppointment")`, campos legacy y enlaces Target nullable. |

### Assemblies

| Model | Current responsibility and notable structure |
| --- | --- |
| `Assembly` | Asamblea con campos legacy `type/date/quorum` y campos Target `type/scheduledAt/heldAt`. |
| `AssemblyCall` | Llamada numerada por asamblea con horario y cuórum. |
| `AssemblyConvocation` | Invitación única por asamblea/afiliado; conserva rol/snapshot legacy y membership nullable. |
| `AssemblyAttendance` | Asistencia con clave legacy y `convocationId` nullable/unique durante `ASM-ATT-01`. |
| `AbsenceJustification` | Justificación con clave legacy y `attendanceId` nullable/unique durante `ASM-ATT-01`. |
| `AssemblyMinute` | Acta lógica opcional uno-a-uno por asamblea. |
| `AssemblyResolution` | Resolución formal; una asamblea puede registrar múltiples. |

### Reservations and events

| Model | Current responsibility and notable structure |
| --- | --- |
| `Event` | Evento publicable con UUID público, estado y fechas. |
| `ReservableResource` | Recurso con disponibilidad, capacidad y pricing FREE/FIXED. |
| `Reservation` | Reserva con recurso y solicitante requeridos; aprobador y evento opcionales. |

### Finance and donations

| Model | Current responsibility and notable structure |
| --- | --- |
| `FinancialAccount` | Cuenta lógica del ledger con código único. |
| `FinancialCharge` | Cargo único por reserva. |
| `Payment` | Pago con método legacy/Target y `movementId` nullable/unique hasta `FIN-ORIGIN-01`. |
| `FinancialMovement` | Movimiento con cuenta/estado/origen Target nullable y fuente genérica legacy. |
| `Donation` | Donación con donante opcional y movimiento original nullable hasta `FIN-DON-01`. |
| `Expense` | Registro/autorización de gasto con resolución opcional. |
| `ExpenseDocument` | Evidencia documental específica de gasto. |
| `Disbursement` | Ejecución de egreso con movimiento financiero requerido/unique. |
| `FundingAllocation` | Asignación de fondos con movimiento de ingreso opcional y no único. |

### Inventory

| Model | Current responsibility and notable structure |
| --- | --- |
| `InventoryCategory` | Categoría única por nombre. |
| `InventoryItem` | Bien inventariable con cantidad disponible, unidad, ubicación y categoría. |
| `InventoryMovement` | Movimiento con cantidad legacy y `quantityDelta` nullable hasta `INV-LEDGER-01`. |
| `InventoryLoan` | Préstamo con snapshot de prestatario y FKs de movimientos nullable hasta `INV-LOAN-01`. |

### Volunteering

| Model | Current responsibility and notable structure |
| --- | --- |
| `VolunteerOpportunity` | Iniciativa con lifecycle, capacidad opcional y creador requerido. |
| `VolunteerSession` | Sesión concreta perteneciente a una oportunidad. |
| `VolunteerApplication` | Solicitud con snapshot histórico, `Person` y revisor opcionales. |
| `VolunteerParticipation` | Participación efectiva única por oportunidad/persona y solicitud. |
| `VolunteerAttendance` | Asistencia única por participación/sesión con horas acreditadas. |

### Entrepreneurship

| Model | Current responsibility and notable structure |
| --- | --- |
| `Venture` | Emprendimiento canónico con lifecycle institucional y de publicación. |
| `VentureAssociation` | Episodio temporal entre `Person` y `Venture`. |
| `VentureRequest` | Proceso de registro/actualización con persona y venture opcionales. |
| `VentureRequestRevision` | Revisión append-only con JSON versionado y número único por solicitud. |

### Transitional infrastructure

| Model | Current responsibility and notable structure |
| --- | --- |
| `IdentityReconciliationManifest` | Única entidad transicional; conserva evidencia de reconciliación y vínculo opcional a `Person`. |

## 6. Current enums

El baseline contiene exactamente **43 enums Prisma**.

| Enum | Current values |
| --- | --- |
| `RequestStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `UserStatus` | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `AffiliateStatus` | `ACTIVE`, `INACTIVE` |
| `IdentificationType` | `NATIONAL`, `DIMEX` |
| `AssemblyStatus` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `AssemblyQuorumType` | `FIXED`, `PERCENTAGE` |
| `EventStatus` | `SCHEDULED`, `CANCELLED`, `COMPLETED` |
| `ReservableResourceStatus` | `ACTIVE`, `INACTIVE` |
| `ResourcePricingType` | `FREE`, `FIXED` |
| `ReservationStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `CONFIRMED`, `COMPLETED` |
| `FinancialChargeStatus` | `PENDING`, `PAID`, `CANCELLED` |
| `PaymentStatus` | `PENDING`, `CONFIRMED`, `CANCELLED` |
| `PaymentMethod` | `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `OTHER` |
| `DonationStatus` | `CONFIRMED`, `CANCELLED` |
| `DonationMethod` | `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `OTHER` |
| `FinancialMovementType` | `INCOME`, `EXPENSE` |
| `FinancialMovementSource` | `MANUAL`, `RESERVATION_PAYMENT`, `DONATION` |
| `PublicationStatus` | `INTERNAL`, `DRAFT`, `REVIEW`, `PUBLISHED`, `ARCHIVED` |
| `AttendanceStatus` | `PRESENT`, `ABSENT`, `JUSTIFIED` |
| `JustificationStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `SanctionStatus` | `ACTIVE`, `RESOLVED`, `REVOKED` |
| `InventoryItemStatus` | `ACTIVE`, `INACTIVE` |
| `InventoryItemCondition` | `GOOD`, `DAMAGED`, `UNDER_REPAIR` |
| `InventoryMovementType` | `OPENING_BALANCE`, `ENTRY`, `EXIT`, `ADJUSTMENT` |
| `InventoryLoanStatus` | `ACTIVE`, `RETURNED`, `CANCELLED` |
| `GovernanceTermStatus` | `PLANNED`, `ACTIVE`, `CLOSED`, `CANCELLED` |
| `AssemblyType` | `ORDINARY`, `EXTRAORDINARY` |
| `FinancialMethod` | `CASH`, `BANK_TRANSFER`, `SINPE_MOVIL`, `CHECK`, `OTHER` |
| `FinancialMovementOriginType` | `MANUAL`, `PAYMENT`, `DONATION`, `DISBURSEMENT` |
| `FinancialMovementStatus` | `POSTED`, `VOIDED` |
| `ExpenseStatus` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| `FundingSourceType` | `FONDO_POR_GIRAR`, `IMPUESTO_CEMENTO`, `OWN_FUNDS`, `OTHER` |
| `InstitutionalOrganizationType` | `INTEGRAL`, `SPECIFIC` |
| `BoardPosition` | `PRESIDENT`, `VICE_PRESIDENT`, `SECRETARY`, `TREASURER`, `VOCAL`, `FISCAL`, `SUPLENTE` |
| `VolunteerOpportunityStatus` | `DRAFT`, `PUBLISHED`, `CLOSED`, `COMPLETED`, `CANCELLED` |
| `VolunteerSessionStatus` | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `VolunteerApplicationStatus` | `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN` |
| `VolunteerParticipationStatus` | `CONFIRMED`, `COMPLETED`, `CANCELLED` |
| `VolunteerAttendanceStatus` | `PRESENT`, `ABSENT`, `EXCUSED` |
| `VentureStatus` | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| `VenturePublicationStatus` | `UNPUBLISHED`, `PUBLISHED` |
| `VentureRequestPurpose` | `REGISTRATION`, `UPDATE` |
| `VentureRequestStatus` | `SUBMITTED`, `UNDER_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`, `WITHDRAWN` |

## 7. High-level relationships

| Relationship | Current cardinality / nullability |
| --- | --- |
| `Person ↔ User` | Vínculo opcional uno-a-uno mediante `User.personId` nullable y unique. |
| `Person ↔ Affiliate` | Vínculo opcional uno-a-uno mediante `Affiliate.personId` nullable y unique. |
| `Person → UserRequest` | Una persona puede vincular múltiples solicitudes; cada solicitud tiene persona opcional. |
| `Person → AffiliateRequest` | Una persona puede vincular múltiples solicitudes; cada solicitud tiene persona opcional. |
| `Role → User` | Un rol tiene múltiples usuarios; cada usuario requiere un rol. |
| `Affiliate.legacyRoleId` | Scalar nullable mapeado a columna física `roleId`; no existe relación Prisma Target con `Role`. |
| `Assembly → AssemblyConvocation → Affiliate` | Relación muchos-a-muchos materializada, única por asamblea/afiliado, con snapshot de nombre de rol. |
| `AssemblyAttendance` legacy/Target | Conserva escalares legacy `(assemblyId, affiliateId)` y relación nullable/unique a `AssemblyConvocation`. |
| `AbsenceJustification` legacy/Target | Conserva escalares legacy `(assemblyId, affiliateId)` y relación nullable/unique a `AssemblyAttendance`. |
| `Event → Reservation` | Un evento puede agrupar múltiples reservas; el evento de cada reserva es opcional. |
| `ReservableResource → Reservation` | Un recurso tiene múltiples reservas; toda reserva requiere recurso. |
| `Reservation ↔ FinancialCharge` | Relación opcional uno-a-uno desde reserva; cada cargo requiere una reserva única. |
| `FinancialCharge → Payment` | Un cargo admite múltiples pagos. |
| `Payment → FinancialMovement` | `Payment.movementId` existe como FK nullable/unique; fuente genérica legacy permanece hasta `FIN-ORIGIN-01`. |
| `Donation ↔ FinancialMovement` | `originalMovementId` es FK nullable/unique; reversa legacy permanece mapeada hasta `FIN-DON-01`. |
| `InventoryCategory → InventoryItem` | Una categoría tiene múltiples ítems; todo ítem requiere categoría. |
| `InventoryItem → InventoryMovement` | Un ítem tiene múltiples movimientos. |
| `InventoryItem → InventoryLoan` | Un ítem tiene múltiples préstamos. |
| `OrganizationProfile` | Singleton lógico mapeado físicamente a `InstitutionalProfile`. |
| `GovernanceTerm → GovernanceMembership` | Relación lógica sobre tablas físicas `BoardTerm` y `BoardAppointment`. |
| `VolunteerOpportunity → VolunteerSession/Application/Participation` | Una oportunidad contiene sesiones, solicitudes y participaciones. |
| `VolunteerParticipation → VolunteerAttendance ← VolunteerSession` | Asistencia materializa participación por sesión. |
| `Person → VentureAssociation ← Venture` | Asociación temporal persona-emprendimiento. |
| `VentureRequest → VentureRequestRevision` | Una solicitud conserva revisiones versionadas. |

## 8. Referential integrity

Las migraciones vigentes materializan las siguientes políticas principales:

- `CASCADE`: tokens al eliminar usuario; convocatorias al eliminar asamblea; asistencia al eliminar su convocatoria; justificación al eliminar su asistencia asociada.
- `SET NULL`: actores opcionales históricos u operativos como auditor, revisores, aprobador, registradores y receptor; rol opcional de convocatoria; vínculos de solicitudes a `Person`; selección del manifiesto a `Person`.
- `RESTRICT`: relaciones durables u obligatorias como `User → Role`, sesiones, vínculos `User`/`Affiliate → Person`, recursos y solicitantes de reserva, cargos/pagos, actores obligatorios de donaciones y relaciones financieras Target.

Restricciones de unicidad relevantes:

- identidad/email de `User`, identidad/email opcional de `Affiliate`, código de inventario, nombre de categoría y UUID público de evento;
- `Person(identificationType, normalizedIdentification)`;
- vínculos uno-a-uno `User.personId` y `Affiliate.personId`;
- una convocatoria, asistencia y justificación por asamblea/afiliado;
- un cargo por reserva;
- un movimiento original y uno reverso por donación.

Las relaciones cuyo `onDelete` no está escrito explícitamente en Prisma deben contrastarse con migraciones antes de cambiarse.

## 9. Known transitional structures

### Shared identity transition

`Person` coexiste con campos legados en `User`, `Affiliate`, `UserRequest` y `AffiliateRequest`: nombre completo, identificación, teléfono y dirección continúan duplicados. Los cuatro `personId` son nullable, por lo que registros vinculados y no vinculados son estados actuales válidos.

`Person` permite atributos personales completamente nullable. La unicidad compuesta de identificación también admite combinaciones null según PostgreSQL. Esto soporta reconciliación gradual, no acredita completitud de identidad.

### IdentityReconciliationManifest

`IdentityReconciliationManifest` es infraestructura transicional. Registra versión de normalización/decisión, origen lógico, fingerprint, identificación cruda y normalizada, clasificación, conflictos, snapshot, revisión y `Person` seleccionada opcional.

Sus campos `sourceModel`, `classification` y `reviewedBy` son texto libre; `conflictCodes` y `sourceSnapshot` son JSON. No existen FKs hacia filas fuente ni hacia un usuario revisor. El manifiesto puede contener PII y no debe tratarse como log público.

### Historical affiliate roles

`Affiliate.legacyRoleId` permanece nullable y mapeado a la columna física `roleId` para conservar afiliados históricos sin inferir un rol arbitrario.

## 10. Known design debt / limitations

Las siguientes limitaciones y compatibilidades son observables en schema y migraciones CURRENT. El Target V1.1 está aprobado; estos puntos describen cutover pendiente, no decisiones estructurales abiertas:

- identidad y contacto permanecen duplicados entre `Person` y modelos legados;
- no existe unicidad de identidad transversal entre tablas;
- `UserRequest.reviewedById` ya tiene relación Prisma/FK nullable e índice; la retención del actor usa `SET NULL`;
- `AuditLog.entityType`/`entityId` y `FinancialMovement.sourceId` no tienen integridad referencial;
- no existe constraint de base que impida reservas solapadas;
- varios invariantes permanecen en aplicación: importes/cantidades positivos, orden temporal, consistencia estado/timestamps y precio requerido para recursos `FIXED`;
- el `CHECK` de cuórum existe en migración SQL pero no es visible en Prisma;
- conceptos como tipo de asamblea, tipo de afiliado, género, moneda y unidad permanecen total o parcialmente como texto libre;
- `IdentificationType` sólo representa `NATIONAL` y `DIMEX`;
- las políticas de retención de actores varían entre `CASCADE`, `SET NULL` y `RESTRICT`;
- `DateTime` se materializa actualmente sin semántica de zona horaria en el tipo PostgreSQL;
- la estructura institucional y de gobernanza ya existe, pero conserva mappings físicos legados y enlaces nullable pendientes de reconciliación histórica.

Este inventario no autoriza correcciones. Cada cambio requiere diseño Target, análisis de datos y roadmap de migración.

## 11. Current migration state

Estado versionado en `main@71aa989`:

- migraciones versionadas: **28**;
- expansión V1.1: `20260927100000_frozen_target_v1_1_expand`;
- checks aditivos V1.1: `20260927110000_frozen_target_v1_1_safe_checks`;
- contrato Prisma estructural: **49 persistentes + 1 transicional**.

Este inventario describe schema y migraciones versionadas. No afirma que los
ocho gates de cutover hayan cerrado ni que se hayan retirado campos legacy.

## 12. Change policy

1. Cambios al modelo comienzan con documentación Current/Target separada y evidencia del estado real.
2. Una propuesta `ACCEPTED` no se marca `CURRENT` hasta estar implementada y verificada.
3. No se edita el Current Model para simular una implementación futura.
4. Todo cambio físico requiere migración revisable; `db push` no sustituye historial versionado.
5. Restricciones presentes sólo en SQL deben preservarse o reemplazarse explícitamente.
6. Cambios de identidad, PII o reconciliación requieren revisión de privacidad, backfill y rollback.
7. Tras integrar cambios, se actualizan baseline, inventario, relaciones, deuda y estado de migraciones.
8. El cleanup histórico permanece bloqueado por los gates aplicables; no se reabre el contrato estructural V1.1.
