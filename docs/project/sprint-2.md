# Sprint 2 — Estado consolidado

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y documentación estable de módulos

## Objetivo del Sprint

Sprint 2 buscó habilitar flujos mínimos para Reservas, Financiero y Donaciones, integrados con autenticación, autorización, persistencia y navegación del ERP.

La fotografía actual de la rama de integración muestra flujos funcionales para Reservas, Financiero y Donaciones.

## Resultado por dominio

| Dominio | Estado actual | Evidencia principal |
| --- | --- | --- |
| Reservas | Implementado | backend + frontend + pruebas + integración financiera |
| Financiero | Implementado | cargos, pagos exactos, movimientos y resumen |
| Donaciones | Implementado | backend, frontend ERP, movimientos financieros, auditoría y capabilities |

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

Donaciones está implementado como vertical backend y frontend ERP. Permite registrar, listar, filtrar, consultar, editar donaciones confirmadas, cancelar con reversión financiera y eliminar físicamente solo registros confirmados elegibles ingresados por error.

Cada donación confirmada genera de forma atómica:

```text
Donation CONFIRMED
      ↓
FinancialMovement INCOME
source = DONATION
```

Cancelar conserva el ingreso original y crea un `FinancialMovement EXPENSE` de reversión. La eliminación física exige ausencia de reversión y de movimientos financieros adicionales. El módulo incluye auditoría, capabilities, ruta `/app/donations` y navegación ERP protegida por `don.donations.read`.

El flujo público de donaciones sigue fuera de alcance. La integración con DatePicker compartido queda diferida hasta que dicho componente llegue a la rama.

Para detalle, consultar `docs/modules/donations.md`.

### Validación pendiente de Daniel

Las suites dinámicas y smoke test requieren ejecución manual antes de marcar el módulo como validado.

```powershell
cd "C:\Users\Estudiantes UNA\Desktop\SGI-Curime\backend"

npm test -- donations.service.spec.ts
npm test -- donations.controller.spec.ts
npm test -- capability-policy.spec.ts
npm run build
```

```powershell
cd "C:\Users\Estudiantes UNA\Desktop\SGI-Curime\frontend"

npm test -- src/features/donations/api/donations.api.test.ts
npm test -- src/features/donations/hooks/donations.queries.test.tsx
npm test -- src/features/donations/ui/DonationsPage.test.tsx
npm test -- src/features/donations/ui/DonationDialogs.test.tsx
npm test -- src/app/router/AppRoutes.test.tsx
npm test -- src/app/navigation/erpNavigation.test.ts

npm run check:architecture
npm run build
```

Smoke test manual:

1. Como Administrador, verificar menú y ruta `/app/donations`; registrar, consultar, editar y cancelar una donación; confirmar `INCOME` original, `CANCELLED` y reversión `EXPENSE`; confirmar que editar y eliminar no están disponibles tras cancelar.
2. Registrar donación anónima sin nombre ni identificación y confirmar etiqueta `Anónima` en listado.
3. Como Administrador, eliminar una donación de prueba `CONFIRMED` elegible; confirmar desaparición de donación y movimiento original; confirmar que una donación `CANCELLED` no se puede eliminar.
4. Como Tesorero, confirmar acceso, creación, edición y cancelación; confirmar ausencia de eliminación.
5. Con usuario sin `don.donations.read`, confirmar ausencia en navegación y redirección a `/403` desde `/app/donations`.
6. Sin sesión, confirmar redirección de `/app/donations` a `/login`.

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
don.donations.read
don.donations.create
don.donations.update
don.donations.cancel
don.donations.delete
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

### Donaciones

- creación atómica de donación y movimiento financiero `INCOME`;
- cancelación serializable con movimiento compensatorio `EXPENSE`;
- eliminación física excepcional con validación de invariantes financieras;
- auditoría de crear, editar, cancelar y eliminar;
- capabilities coherentes entre backend y frontend.

## Alcance pendiente después del Sprint

Persisten como trabajo futuro o fuera del alcance actual:

- pagos parciales;
- conciliación avanzada/refundos para reservas pagadas;
- reportes financieros más completos;
- historial de reservas por solicitante;
- reglas avanzadas de capacidad y eventos;
- expansión de auditoría donde aplique;
- reconciliación completa de autorización backend/frontend bajo capabilities.

## Balance del Sprint

Sprint 2 no debe describirse como "todo completado" porque persisten elementos fuera de alcance, incluida reconciliación de autorización en otros módulos y trabajo financiero pendiente.

La formulación correcta es:

```text
Reservas     → entregado con flujo funcional
Financiero   → entregado con flujo funcional
Donaciones   → entregado con flujo funcional
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
