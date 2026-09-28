# Módulo de Donaciones

Estado: Implementado
Última revisión: 2026-09
Fuente primaria: `backend/src/donations/`, `frontend/src/features/donations/` y `backend/prisma/schema.prisma`

## Propósito

Donaciones registra aportes recibidos dentro del ERP. Cada donación confirmada genera un movimiento financiero de origen `DONATION`; no usa `FinancialCharge` ni `Payment`.

## Alcance implementado

- registrar donaciones, incluidas donaciones anónimas;
- listado paginado con filtros por texto, estado, método y fechas;
- detalle de donación;
- edición de donaciones `CONFIRMED`;
- cancelación con reversión financiera;
- eliminación física excepcional y restringida;
- auditoría de operaciones;
- capabilities backend y frontend;
- ruta y navegación ERP en `/app/donations`.

No incluye recibos, adjuntos, campañas, pagos en línea, donaciones recurrentes ni flujo público.

## Modelo e integración financiera

El modelo Prisma define `Donation`, `DonationStatus` y `DonationMethod`.

```text
Donation CONFIRMED
  -> original FinancialMovement
     type = INCOME
     source = DONATION
     sourceId = donation.id

Donation CANCELLED
  -> conserva original FinancialMovement (INCOME)
  -> reversal FinancialMovement
     type = EXPENSE
     source = DONATION
     sourceId = donation.id
```

La creación es atómica: persiste la donación `CONFIRMED`, crea movimiento original y enlaza `originalMovementId` en una misma transacción. Al editar `amount` o `receivedAt`, el movimiento original se valida y se mantiene sincronizado.

## Reglas operativas

### Cancelar no es eliminar

Cancelación corresponde a una operación legítima que debe revertirse. Conserva la donación y su ingreso original, registra actor, fecha y motivo, y crea un único egreso compensatorio. Una donación cancelada no puede editarse ni cancelarse de nuevo.

La cancelación se ejecuta en transacción serializable con reintentos ante conflicto de serialización.

### Eliminación física restringida

Eliminar corresponde solo a un registro ingresado por error. Requiere:

- estado `CONFIRMED`;
- `reversalMovementId = null`;
- `originalMovementId` válido;
- un único movimiento `DONATION` asociado, que debe ser el ingreso original;
- ausencia de efectos financieros adicionales.

Dentro de la misma transacción elimina primero `Donation` y luego su `FinancialMovement` original elegible. Donaciones canceladas, con reversión o con invariantes financieras rotas son rechazadas.

## Autorización

Capabilities canónicas:

```text
don.donations.read
don.donations.create
don.donations.update
don.donations.cancel
don.donations.delete
```

`Administrador` posee todas. `Tesorero` posee lectura, creación, edición y cancelación; no posee eliminación. Roles y capabilities desconocidos se rechazan por default deny.

La ruta ERP `/app/donations` requiere `don.donations.read`. Navegación muestra `Donaciones` solo con esa capability. Backend continúa como autoridad final de autorización.

## Auditoría

Operaciones registran `DONATION_CREATED`, `DONATION_UPDATED`, `DONATION_CANCELLED` y `DONATION_DELETED`. Los detalles incluyen únicamente información operativa como monto, método, campos modificados e identificadores de movimientos; no almacenan identificación ni nombre del donante.

## Frontend

`DonationsPage` integra listado, filtros, paginación server-side, formularios modales de creación y edición, detalle, cancelación, eliminación, estados loading/error/empty, diseño responsive y capability gating.

Las mutaciones invalidan listas y detalle de Donaciones según corresponda, además de la familia pública de query keys de movimientos financieros. Donaciones no importa internals de Financiero.

## Deuda conocida

Shared DatePicker integration deferred. El DatePicker compartido no existe en esta rama; se mantiene `datetime-local` hasta reconciliación posterior.

**ADD_STATUS_NOTE: V1.1 package distinction and deferred gates**

This Donations module documentation reflects the AS-IS state at merge checkpoint main@71aa989 (PR #102). The V1.1 package `IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989` provides the structural contract, but deferred cutover gates remain evidence-dependent:

- `FIN-ORIGIN-01`: Explicit-origin reconciliation before generic `sourceId` removal
- `FIN-DON-01`: Donation original/reversal evidence before redundant-field removal
- `ID-01`: Person canonical mapping affects donation person linking

Do not treat structural implementation as completed historical reconciliation. The V1 donations design (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`) remains the historical authority; V1.1 additive structure is now merged, and final cutover requires evidence per each gate. The `FIN-DON-01` gate specifically addresses `Donation.originalMovementId NOT NULL` and removal of redundant reversal representation — structural implementation does not imply this gate is passed.

Shared DatePicker integration deferred. El DatePicker compartido no existe en esta rama; se mantiene `datetime-local` hasta reconciliación posterior.

## Fuentes relacionadas

- `backend/src/donations/`
- `backend/prisma/schema.prisma`
- `frontend/src/features/donations/`
- `frontend/src/features/financial/`
- `frontend/src/app/router/AppRoutes.tsx`
- `frontend/src/app/navigation/erpNavigation.ts`
