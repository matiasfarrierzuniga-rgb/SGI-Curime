---
title: SGI-Curime Current Data Model
status: CURRENT
baseline: 5713e9121f223a14db8b3f7fe4201422e654f0ce
last_reviewed: 2026-09-20
---

# SGI-Curime Current Data Model

> **Recovered baseline notice (2026-09-26):** this file is preserved from the
> Frozen V1 audited documentation package. Its `CURRENT` label is relative to
> the baseline commit declared in its front matter, not a claim that it has
> been revalidated against the present repository `main`. A refreshed AS-IS
> audit is required before V1.1 Gap Matrix work.


## 1. Purpose

Este documento registra el modelo persistente **CURRENT / AS-IS** de SGI-Curime. Describe lo implementado en el baseline indicado, sin corregir conceptualmente el schema, proponer entidades Target ni convertir deuda actual en diseño aprobado.

Que una estructura aparezca aquí significa que existe. No significa que sea la arquitectura final aprobada.

## 2. Baseline

- Baseline de código: `5713e9121f223a14db8b3f7fe4201422e654f0ce`.
- Fuente primaria: `backend/prisma/schema.prisma`.
- Fuente histórica y de restricciones físicas: `backend/prisma/migrations/`.
- Estado documental: `CURRENT`.
- Fecha de revisión: 2026-09-20.

Los documentos `docs/architecture/current-state.md` y `docs/architecture/gap-analysis.md` se conservan como evidencia histórica, no como inventario vigente del modelo.

## 3. Data platform

- Base de datos: PostgreSQL.
- Acceso desde aplicación: Prisma ORM mediante `PrismaService`.
- Schema declarativo: `backend/prisma/schema.prisma`.
- Historial físico: 23 directorios de migración bajo `backend/prisma/migrations/`.
- Identificadores principales: `Int` autoincremental en todos los modelos; `Event` añade `publicId` UUID único.
- Importes monetarios: `Decimal(14, 2)` con moneda almacenada como `String`, normalmente con default `CRC`.
- Fechas Prisma: `DateTime`; las migraciones actuales materializan estos campos como `TIMESTAMP(3)` sin zona horaria.

Algunas restricciones existen sólo en SQL de migraciones y no son visibles en el DSL de Prisma. Por ello, schema y migraciones deben leerse juntos.

## 4. Current domains

La siguiente clasificación facilita navegación; no crea límites físicos adicionales ni redefine ownership de módulos.

El baseline contiene exactamente **27 modelos Prisma persistentes**.

| Domain | Current models |
| --- | --- |
| Identity and reconciliation | `Person`, `IdentityReconciliationManifest` |
| Security and access | `Role`, `User`, `Session`, `AuditLog`, `PasswordResetToken`, `AccountActivationToken`, `UserRequest` |
| Affiliation | `Affiliate`, `AffiliateRequest`, `AffiliateSanction` |
| Governance and assemblies | `Assembly`, `AssemblyConvocation`, `AssemblyAttendance`, `AbsenceJustification` |
| Reservations and events | `Event`, `ReservableResource`, `Reservation` |
| Finance and donations | `FinancialCharge`, `Payment`, `FinancialMovement`, `Donation` |
| Inventory | `InventoryCategory`, `InventoryItem`, `InventoryMovement`, `InventoryLoan` |

Las reglas de ciclo de vida y casos de uso pertenecen a `docs/modules/`; este documento se limita a persistencia y relaciones actuales.

## 5. Current persistent models

### Identity, security and access

| Model | Current responsibility and notable structure |
| --- | --- |
| `Role` | Catálogo de roles de acceso con nombre único, estado activo y relaciones a usuarios, afiliados y snapshots de convocatorias. |
| `Person` | Identidad personal compartida opcional. Todos sus atributos personales son nullable; mantiene unicidad compuesta opcional por `identificationType` y `normalizedIdentification`. |
| `IdentityReconciliationManifest` | Infraestructura transicional versionada para clasificar fuentes y vincularlas opcionalmente con `Person`; conserva snapshots y conflictos en JSON. |
| `User` | Cuenta de acceso con identificación y email únicos, estado, bloqueo, rol obligatorio y vínculo opcional uno-a-uno con `Person`. Conserva campos de identidad/contacto legados. |
| `Session` | Sesión persistida por hash de refresh token, expiración y revocación; pertenece obligatoriamente a un usuario. |
| `AuditLog` | Evento de auditoría con módulo, acción, actor opcional y referencias genéricas `entityType`/`entityId`. |
| `PasswordResetToken` | Token de recuperación de contraseña, único, expirable y dependiente de un usuario. |
| `AccountActivationToken` | Token de activación de cuenta, único, expirable y dependiente de un usuario. |
| `UserRequest` | Solicitud de usuario con identidad/contacto legado, estado y vínculo opcional a `Person`. `reviewedById` existe como escalar nullable sin relación Prisma/FK. |

### Affiliation

| Model | Current responsibility and notable structure |
| --- | --- |
| `Affiliate` | Afiliación con identificación única, datos personales legados obligatorios/parciales, estado, vínculo opcional uno-a-uno con `Person` y rol nullable. |
| `AffiliateRequest` | Solicitud de afiliación con revisión opcional por usuario y vínculo opcional a `Person`; conserva identidad/contacto legado. |
| `AffiliateSanction` | Sanción asociada obligatoriamente a afiliado y usuario creador, con estado y fecha. |

`Affiliate.roleId` es nullable para no inventar roles de afiliados históricos. La nulabilidad es transicional y no implica que todo flujo nuevo permita omitir rol.

### Governance and assemblies

| Model | Current responsibility and notable structure |
| --- | --- |
| `Assembly` | Asamblea con estado, fecha, lugar y configuración nullable de cuórum; puede bloquear convocatorias mediante `convocationsLockedAt`. |
| `AssemblyConvocation` | Afiliado convocado a una asamblea, único por par asamblea/afiliado. Guarda rol opcional y `roleNameSnapshot` obligatorio. |
| `AssemblyAttendance` | Asistencia única por asamblea/afiliado con estado y observaciones. |
| `AbsenceJustification` | Justificación única por asamblea/afiliado, enlazada al registro de asistencia compuesto, con revisión y metadatos opcionales de adjunto. |

El SQL vigente exige que cuórum sea completamente null, o `FIXED` con valor positivo, o `PERCENTAGE` entre 1 y 100. Ese `CHECK` no aparece expresado en el schema Prisma.

### Reservations and events

| Model | Current responsibility and notable structure |
| --- | --- |
| `Event` | Evento publicable con UUID público, estado, publicación y fechas; puede agrupar reservas. |
| `ReservableResource` | Recurso reservable con disponibilidad por estado, capacidad y precio nullable según tipo de precio. |
| `Reservation` | Reserva temporal de un recurso, solicitada por usuario, con aprobación y evento opcionales; puede tener un único cargo financiero. |

El índice `(resourceId, startAt, endAt)` facilita consultas, pero no constituye una restricción de exclusión contra solapamientos.

### Finance and donations

| Model | Current responsibility and notable structure |
| --- | --- |
| `FinancialCharge` | Cargo único por reserva, con importe, moneda, estado y vencimiento opcional. |
| `Payment` | Pago de un cargo con método, estado, referencia y registrador opcional. |
| `FinancialMovement` | Movimiento de ingreso o gasto con fuente tipada. `sourceId` es una referencia polimórfica sin FK. |
| `Donation` | Donación confirmada o cancelada; registra actores y movimientos original/reverso mediante relaciones opcionales únicas. |

`AuditLog.entityType`/`entityId` y `FinancialMovement.sourceId` son referencias genéricas administradas por aplicación; la base no puede validar la existencia de su entidad destino.

### Inventory

| Model | Current responsibility and notable structure |
| --- | --- |
| `InventoryCategory` | Categoría única por nombre con estado activo. |
| `InventoryItem` | Bien inventariable único por código, con cantidades, unidad, ubicación, estado, condición y categoría obligatoria. |
| `InventoryMovement` | Entrada, salida o ajuste de cantidad para un ítem, con creador opcional. |
| `InventoryLoan` | Préstamo de ítem con cantidad, prestatario textual, afiliado opcional, actores operativos opcionales y fechas de devolución. |

## 6. Current enums

El baseline contiene exactamente **25 enums Prisma**.

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
| `InventoryMovementType` | `ENTRY`, `EXIT`, `ADJUSTMENT` |
| `InventoryLoanStatus` | `ACTIVE`, `RETURNED`, `CANCELLED` |

## 7. High-level relationships

| Relationship | Current cardinality / nullability |
| --- | --- |
| `Person ↔ User` | Vínculo opcional uno-a-uno mediante `User.personId` nullable y unique. |
| `Person ↔ Affiliate` | Vínculo opcional uno-a-uno mediante `Affiliate.personId` nullable y unique. |
| `Person → UserRequest` | Una persona puede vincular múltiples solicitudes; cada solicitud tiene persona opcional. |
| `Person → AffiliateRequest` | Una persona puede vincular múltiples solicitudes; cada solicitud tiene persona opcional. |
| `Role → User` | Un rol tiene múltiples usuarios; cada usuario requiere un rol. |
| `Role → Affiliate` | Un rol tiene múltiples afiliados; cada afiliado puede no tener rol. |
| `Assembly → AssemblyConvocation → Affiliate` | Relación muchos-a-muchos materializada, única por asamblea/afiliado, con snapshot de nombre de rol. |
| `Assembly → AssemblyAttendance → Affiliate` | Relación muchos-a-muchos materializada, única por asamblea/afiliado. |
| `AbsenceJustification → AssemblyAttendance` | Relación compuesta obligatoria por `(assemblyId, affiliateId)`. |
| `Event → Reservation` | Un evento puede agrupar múltiples reservas; el evento de cada reserva es opcional. |
| `ReservableResource → Reservation` | Un recurso tiene múltiples reservas; toda reserva requiere recurso. |
| `Reservation ↔ FinancialCharge` | Relación opcional uno-a-uno desde reserva; cada cargo requiere una reserva única. |
| `FinancialCharge → Payment` | Un cargo admite múltiples pagos. |
| `Payment → FinancialMovement` | No existe relación Prisma ni FK directa. La referencia operativa puede representarse mediante `FinancialMovement.source = RESERVATION_PAYMENT` y `sourceId`, administrado por aplicación. |
| `Donation ↔ FinancialMovement` | Movimientos original y reverso son opcionales y únicos por donación. |
| `InventoryCategory → InventoryItem` | Una categoría tiene múltiples ítems; todo ítem requiere categoría. |
| `InventoryItem → InventoryMovement` | Un ítem tiene múltiples movimientos. |
| `InventoryItem → InventoryLoan` | Un ítem tiene múltiples préstamos. |

## 8. Referential integrity

Las migraciones vigentes materializan las siguientes políticas principales:

- `CASCADE`: tokens al eliminar usuario; convocatorias, asistencias y justificaciones al eliminar asamblea; justificación al eliminar su asistencia asociada.
- `SET NULL`: actores opcionales históricos u operativos como auditor, revisores, aprobador, registradores y receptor; rol opcional de convocatoria; vínculos de solicitudes a `Person`; selección del manifiesto a `Person`.
- `RESTRICT`: relaciones durables u obligatorias como `User → Role`, sesiones, vínculos `User`/`Affiliate → Person`, `Affiliate → Role`, recursos y solicitantes de reserva, cargos/pagos, actores obligatorios de donaciones y movimientos de donación.

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

`Affiliate.roleId` permanece nullable por decisión explícita de migración para conservar afiliados históricos sin inferir un rol arbitrario.

## 10. Known design debt / limitations

Las siguientes limitaciones son observables en schema y migraciones; no constituyen todavía un Target aprobado:

- identidad y contacto permanecen duplicados entre `Person` y modelos legados;
- no existe unicidad de identidad transversal entre tablas;
- `UserRequest.reviewedById` no tiene relación Prisma, FK ni índice equivalente al flujo de `AffiliateRequest`;
- `AuditLog.entityType`/`entityId` y `FinancialMovement.sourceId` no tienen integridad referencial;
- no existe constraint de base que impida reservas solapadas;
- varios invariantes permanecen en aplicación: importes/cantidades positivos, orden temporal, consistencia estado/timestamps y precio requerido para recursos `FIXED`;
- el `CHECK` de cuórum existe en migración SQL pero no es visible en Prisma;
- conceptos como tipo de asamblea, tipo de afiliado, género, moneda y unidad permanecen total o parcialmente como texto libre;
- `IdentificationType` sólo representa `NATIONAL` y `DIMEX`;
- las políticas de retención de actores varían entre `CASCADE`, `SET NULL` y `RESTRICT`;
- `DateTime` se materializa actualmente sin semántica de zona horaria en el tipo PostgreSQL;
- no existe un modelo persistente único de organización legal, junta directiva o período de representación, brecha ya documentada en `docs/requirements/adi-dinadeco-source-mapping.md`.

Este inventario no autoriza correcciones. Cada cambio requiere diseño Target, análisis de datos y roadmap de migración.

## 11. Current migration state

Estado verificado durante DB-0:

- migraciones versionadas: **23**;
- migraciones aplicadas: **23**;
- migraciones pendientes: **0**;
- base reconciliada: **sí**.

DB-0 detectó que `schema.prisma` había perdido estructuras aún presentes en historial y código. La representación Prisma fue restaurada sin crear una migración nueva. Después se auditaron y aplicaron estas migraciones existentes que estaban pendientes:

- `20260910120000_add_affiliate_role`
- `20260910180000_add_assembly_convocations_quorum`
- `20260911120000_add_assembly_in_progress_status`

El cierre de DB-0 quedó integrado mediante PR #90 en el baseline de este documento. Este estado no incluye credenciales, endpoints privados ni detalles de conexión.

## 12. Change policy

1. Cambios al modelo comienzan con documentación Current/Target separada y evidencia del estado real.
2. Una propuesta `ACCEPTED` no se marca `CURRENT` hasta estar implementada y verificada.
3. No se edita el Current Model para simular una implementación futura.
4. Todo cambio físico requiere migración revisable; `db push` no sustituye historial versionado.
5. Restricciones presentes sólo en SQL deben preservarse o reemplazarse explícitamente.
6. Cambios de identidad, PII o reconciliación requieren revisión de privacidad, backfill y rollback.
7. Tras integrar cambios, se actualizan baseline, inventario, relaciones, deuda y estado de migraciones.
8. DB-1 permanece bloqueado hasta incorporar y revisar los artefactos Target definidos en `docs/data/README.md`.
