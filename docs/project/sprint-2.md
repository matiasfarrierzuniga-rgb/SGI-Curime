# Sprint 2 — Estado consolidado

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y documentación estable de módulos

## Objetivo del Sprint

Sprint 2 buscó habilitar flujos mínimos para Reservas, Financiero y Donaciones, integrados con autenticación, autorización, persistencia y navegación del ERP.

La fotografía actual de `main` muestra un resultado desigual por dominio: Reservas y Financiero alcanzaron un flujo funcional significativo; Donaciones permanece planificado y sin vertical funcional propia.

## Resultado por dominio

| Dominio | Estado actual | Evidencia principal |
| --- | --- | --- |
| Reservas | Implementado | backend + frontend + pruebas + integración financiera |
| Financiero | Implementado | cargos, pagos exactos, movimientos y resumen |
| Donaciones | Planificado / no implementado | solo preparación de enum financiero y UI pública deshabilitada |

## Reservas

Reservas dispone actualmente de:

- recursos reservables activos;
- consulta de disponibilidad;
- creación de reserva;
- listado y detalle administrativo;
- aprobación;
- rechazo;
- cancelación;
- control de concurrencia con transacciones serializables;
- revalidación de disponibilidad al aprobar;
- integración con Financiero al generar un cargo tras la aprobación;
- filtros administrativos por fecha interpretados en horario de Costa Rica.

Rutas frontend principales:

```text
/app/reservations/new
/app/reservations
```

Para detalle técnico, consultar `docs/modules/reservations.md`.

## Financiero

Financiero dispone actualmente de dos capacidades principales.

### Cargos y pagos

- cargos asociados a reservas aprobadas;
- estados `PENDING`, `PAID` y `CANCELLED`;
- pago exacto del monto total;
- métodos de pago soportados por contrato;
- rechazo de pagos parciales;
- control de concurrencia mediante transacciones serializables.

### Movimientos financieros

- registro manual de ingresos y egresos;
- listado paginado;
- detalle;
- filtros por tipo y fecha;
- resumen de ingresos, egresos y balance;
- auditoría de creación de movimientos.

Rutas frontend principales:

```text
/app/financial
/app/financial/movements
```

Para detalle técnico, consultar `docs/modules/financial.md`.

## Donaciones

Donaciones formaba parte del objetivo previsto de Sprint 2, pero el estado actual de `main` no contiene todavía un módulo funcional mínimo.

Actualmente:

- no existe `backend/src/donations/`;
- no existe `frontend/src/features/donations/`;
- no existe modelo Prisma `Donation`;
- no existen endpoints específicos;
- no existe ruta ERP específica;
- el servicio público está deshabilitado mediante `donations.enabled = false`.

Existe únicamente preparación para futura integración financiera mediante:

```text
FinancialMovementSource.DONATION
```

Por tanto, Donaciones debe considerarse alcance pendiente y no entrega completada del Sprint.

Para detalle, consultar `docs/modules/donations.md`.

## Integración Reservas → Financiero

Uno de los resultados técnicos principales del Sprint es la integración entre Reservas y Financiero.

```text
Reserva PENDING
      ↓ aprobación
Reserva APPROVED
      ↓
FinancialCharge PENDING
      ↓ pago exacto
FinancialCharge PAID
```

La cancelación también considera el estado del cargo:

- cargo `PENDING` → se cancela junto con la reserva;
- cargo `PAID` → requiere conciliación antes de cancelar la reserva.

## Autorización

Sprint 2 continúa utilizando el modelo de capabilities introducido previamente.

Capabilities relevantes incluyen:

```text
res.reservations.read
res.reservations.approve
res.reservations.reject
res.reservations.cancel
fin.charges.read
fin.payments.record
fin.movements.read
fin.movements.create
```

No debe asumirse que toda la aplicación esté completamente reconciliada a capabilities: otros módulos todavía mantienen guards por rol en backend.

## Calidad y validación

El proyecto dispone de pruebas específicas para Reservas y Financiero, además de pruebas frontend de sus páginas principales.

La estrategia vigente de validación está documentada en:

```text
docs/development/testing.md
```

La documentación no fija conteos históricos de pruebas como verdad permanente. Los resultados deben registrarse en cada PR o checkpoint de validación.

## Decisiones técnicas consolidadas durante Sprint 2

### Reservas

- transacciones serializables para operaciones críticas;
- reintentos ante conflictos de serialización;
- rechazo atómico condicionado a `PENDING`;
- revalidación de disponibilidad en aprobación;
- duración válida entre 1 y 12 horas;
- filtros de calendario interpretados explícitamente en UTC-6.

### Financiero

- settlement exacto para cargos;
- sin pagos parciales en el flujo actual;
- balance derivado del estado del cargo;
- moneda de cargos soportada actualmente: CRC;
- movimientos financieros separados de cargos/pagos;
- integración transaccional con Reservas.

## Alcance pendiente después del Sprint

Persisten como trabajo futuro o fuera del alcance actual:

- implementación funcional de Donaciones;
- pagos parciales;
- conciliación avanzada/refundos para reservas pagadas;
- reportes financieros más completos;
- historial de reservas por solicitante;
- reglas avanzadas de capacidad y eventos;
- expansión de auditoría donde aplique;
- reconciliación completa de autorización backend/frontend bajo capabilities.

## Balance del Sprint

Sprint 2 no debe describirse como "todo completado" porque Donaciones no llegó a implementación funcional en `main`.

La formulación correcta es:

```text
Reservas     → entregado con flujo funcional
Financiero   → entregado con flujo funcional
Donaciones   → pendiente / no implementado
```

Esto permite cerrar la documentación con una fotografía verificable del repositorio sin ocultar alcance incompleto.

## Fuentes relacionadas

- `docs/modules/reservations.md`
- `docs/modules/financial.md`
- `docs/modules/donations.md`
- `docs/development/testing.md`
- `docs/architecture/authorization.md` cuando se consolide
- `backend/src/reservations/`
- `backend/src/financial/`
- `backend/prisma/schema.prisma`
- `frontend/src/features/reservations/`
- `frontend/src/features/financial/`
