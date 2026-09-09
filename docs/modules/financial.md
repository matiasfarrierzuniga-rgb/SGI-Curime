# Módulo Financiero

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y configuración vigente

## Propósito

El módulo Financiero concentra el manejo de cargos generados por procesos del sistema, registro de pagos y movimientos financieros manuales. En el estado actual, Reservas es una fuente directa de cargos financieros.

## Alcance implementado

Actualmente el sistema soporta:

- listado paginado de cargos financieros;
- detalle de cargo con pagos asociados;
- registro de pago exacto para cargos pendientes;
- cambio automático del cargo a `PAID` después de un pago confirmado;
- cancelación de cargos pendientes cuando se cancela una reserva asociada;
- creación manual de movimientos financieros;
- listado y detalle de movimientos;
- resumen de ingresos, egresos y balance;
- auditoría en creación manual de movimientos;
- control de concurrencia en pagos mediante transacciones serializables.

## Arquitectura

### Backend

La vertical vive principalmente en:

```text
backend/src/financial/
├── dto/
├── financial.controller.ts
├── financial-movements.controller.ts
├── financial.module.ts
├── financial.service.ts
└── *.spec.ts
```

Flujo principal para cargos y pagos:

```text
HTTP Controller
    ↓
FinancialService
    ↓
Prisma transaction / PrismaService
    ↓
PostgreSQL
```

### Frontend

La vertical frontend vive en:

```text
frontend/src/features/financial/
├── api/
├── hooks/
├── model/
├── ui/
└── index.ts
```

El flujo preferido es:

```text
Route
  ↓
Financial UI
  ↓
TanStack Query hooks
  ↓
financialApi
  ↓
shared/api/httpClient
  ↓
Backend
```

## Cargos financieros

Los cargos usan los estados:

```text
PENDING
PAID
CANCELLED
```

Un cargo generado desde Reservas representa una obligación asociada a una reserva aprobada.

### Relación con Reservas

El flujo actual es:

```text
Reserva PENDING
      ↓ aprobar
Reserva APPROVED
      ↓
FinancialCharge PENDING
      ↓ pago exacto
FinancialCharge PAID
```

Si una reserva con cargo `PENDING` se cancela, el cargo cambia a `CANCELLED`.

Si el cargo ya está `PAID`, la reserva no puede cancelarse directamente: primero se requiere conciliación financiera.

## Pagos

El registro de pago se realiza sobre un cargo específico.

Reglas actuales:

- el cargo debe existir;
- el cargo debe estar `PENDING`;
- la moneda soportada actualmente es `CRC`;
- el monto debe tener formato decimal válido con hasta dos decimales;
- el monto del pago debe coincidir exactamente con el monto del cargo;
- no se permiten pagos parciales;
- el pago se registra como `CONFIRMED`;
- el cargo cambia a `PAID` dentro de la misma transacción.

Métodos de pago soportados por el contrato frontend:

```text
CASH
BANK_TRANSFER
SINPE_MOVIL
OTHER
```

La referencia de pago se normaliza eliminando espacios al inicio y final; una referencia vacía se guarda como `null`.

## Concurrencia de pagos

El registro de pagos utiliza transacciones Prisma con aislamiento:

```text
Serializable
```

Los conflictos de serialización `P2034` se reintentan hasta 3 veces.

Esto evita que dos operaciones concurrentes liquiden el mismo cargo de forma inconsistente.

## Movimientos financieros

Además de cargos y pagos, el módulo permite registrar movimientos financieros manuales.

Tipos soportados:

```text
INCOME
EXPENSE
```

El contrato reconoce fuentes:

```text
MANUAL
RESERVATION_PAYMENT
DONATION
```

En el flujo implementado actualmente, la creación explícita de movimientos desde el endpoint usa `MANUAL`.

Cada movimiento incluye, entre otros:

- tipo;
- fuente;
- monto;
- moneda;
- descripción;
- referencia opcional;
- fecha de ocurrencia;
- identificador de origen cuando aplica;
- usuario que lo registró.

La moneda usada por la creación manual es `CRC`.

## Resumen financiero

El backend puede agrupar movimientos por tipo y calcular:

```text
totalIncome
totalExpenses
balance = totalIncome - totalExpenses
```

El resumen se devuelve en `CRC`.

## Endpoints vigentes

### Cargos y pagos

| Método | Ruta | Capability | Propósito |
| --- | --- | --- | --- |
| GET | `/financial/charges` | `fin.charges.read` | Listar cargos |
| GET | `/financial/charges/:id` | `fin.charges.read` | Obtener detalle |
| POST | `/financial/charges/:id/payments` | `fin.payments.record` | Registrar pago |

### Movimientos

| Método | Ruta | Capability | Propósito |
| --- | --- | --- | --- |
| POST | `/financial/movements` | `fin.movements.create` | Crear movimiento manual |
| GET | `/financial/movements` | `fin.movements.read` | Listar movimientos |
| GET | `/financial/movements/summary` | `fin.movements.read` | Obtener resumen |
| GET | `/financial/movements/:id` | `fin.movements.read` | Obtener detalle |

## Rutas frontend

Actualmente el router expone:

| Ruta | Capability | Propósito |
| --- | --- | --- |
| `/app/financial` | `fin.charges.read` | Cargos financieros |
| `/app/financial/movements` | `fin.movements.read` | Movimientos financieros |

## Filtros

### Cargos

El listado de cargos permite filtrar por:

- estado;
- `reservationId`;
- página;
- límite.

### Movimientos

El listado de movimientos permite filtrar por:

- tipo;
- fecha desde;
- fecha hasta;
- página;
- límite.

El resumen usa los mismos criterios temporales y de tipo que aplican a movimientos.

## Auditoría

La creación manual de movimientos registra una entrada de auditoría con:

- usuario actor;
- acción `FINANCIAL_MOVEMENT_CREATED`;
- módulo `FINANCIAL`;
- entidad `FinancialMovement`;
- id de movimiento;
- tipo;
- monto;
- fecha de ocurrencia;
- contexto de IP y user-agent cuando está disponible.

## Contrato de liquidación actual

La política vigente es de liquidación exacta:

```text
PENDING charge balance = amount
PAID charge balance = 0
```

No existe soporte de pagos parciales en el flujo actual.

## Pruebas relevantes

La vertical dispone de pruebas backend y frontend, entre ellas:

- `backend/src/financial/financial.service.spec.ts`
- `backend/src/financial/financial.controller.spec.ts`
- `backend/src/financial/financial-movements.service.spec.ts`
- `backend/src/financial/financial-movements.controller.spec.ts`
- pruebas de páginas y modales bajo `frontend/src/features/financial/`

Los tests deben seguir cubriendo como mínimo:

- listado y paginación;
- filtros;
- detalle inexistente;
- rechazo de montos inválidos o cero;
- pago no exacto;
- intento de pagar cargos no pendientes;
- normalización de referencia;
- transición `PENDING → PAID`;
- conflictos concurrentes;
- movimientos manuales;
- resumen de ingresos, egresos y balance.

## Limitaciones y trabajo futuro

No debe inferirse de este documento que estén terminados:

- pagos parciales;
- devoluciones o reembolsos;
- conciliación automática de cargos ya pagados;
- contabilidad de doble partida;
- cierres contables;
- reportes financieros avanzados;
- integración automática completa de donaciones como movimiento financiero;
- generación automática de movimientos `RESERVATION_PAYMENT` a partir de cada pago.

Estos puntos deben documentarse cuando exista implementación real en `main`.

## Fuentes relacionadas

- `backend/src/financial/`
- `frontend/src/features/financial/`
- `frontend/src/app/router/AppRoutes.tsx`
- `docs/modules/reservations.md`
- `docs/architecture/frontend-as-is.md`
- `docs/architecture/backend-as-is.md`
