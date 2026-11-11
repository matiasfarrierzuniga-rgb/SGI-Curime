# Módulo de Reservas

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, pruebas y configuración vigente

## Propósito

El módulo de Reservas permite consultar recursos reservables, verificar disponibilidad, registrar solicitudes de reserva y administrar su ciclo de vida.

## Alcance implementado

Actualmente el sistema soporta:

- consulta de recursos reservables activos;
- consulta de disponibilidad por recurso y rango horario;
- creación de reservas autenticadas;
- listado administrativo con filtros y paginación;
- consulta de detalle;
- aprobación;
- rechazo con motivo;
- cancelación;
- integración con Financiero al aprobar o cancelar una reserva;
- control de concurrencia mediante transacciones serializables.

## Arquitectura

### Backend

La vertical principal vive en:

```text
backend/src/reservations/
├── dto/
├── reservation-transition.policy.ts
├── reservations.controller.ts
├── reservations.module.ts
├── reservations.service.ts
└── reservations.service.spec.ts
```

Flujo principal:

```text
HTTP Controller
    ↓
ReservationsService
    ↓
Prisma transaction / PrismaService
    ↓
PostgreSQL
```

### Frontend

La vertical frontend vive en:

```text
frontend/src/features/reservations/
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
Reservation UI
  ↓
TanStack Query hooks
  ↓
reservationsApi
  ↓
shared/api/httpClient
  ↓
Backend
```

## Estados

El contrato frontend reconoce los estados:

```text
PENDING
APPROVED
REJECTED
CANCELLED
CONFIRMED
COMPLETED
```

Las operaciones implementadas actualmente se concentran en creación `PENDING`, aprobación, rechazo y cancelación. No debe asumirse que todos los estados del modelo tienen todavía un flujo UI completo.

## Flujo principal

```text
Usuario autenticado
      ↓
Selecciona recurso y horario
      ↓
Consulta disponibilidad
      ↓
Crea reserva
      ↓
    PENDING
   ↙      ↘
REJECTED  APPROVED
             ↓
      crea cargo financiero
             ↓
         CANCELLED
       cuando aplica
```

## Reglas de disponibilidad

Una reserva bloquea el recurso cuando está en alguno de estos estados:

- `PENDING`
- `APPROVED`
- `CONFIRMED`

Existe conflicto cuando dos rangos se superponen según:

```text
existing.startAt < requested.endAt
AND
existing.endAt > requested.startAt
```

La consulta de disponibilidad y la creación validan que el recurso exista y esté `ACTIVE`.

## Reglas temporales

Antes de crear o consultar disponibilidad se valida:

- `endAt` debe ser posterior a `startAt`;
- `startAt` no puede estar en el pasado;
- duración mínima: 1 hora;
- duración máxima: 12 horas.

## Creación

`POST /reservations` crea una reserva con estado inicial:

```text
PENDING
```

La creación ocurre dentro de una transacción `Serializable` y vuelve a comprobar disponibilidad dentro de esa transacción.

Si existe conflicto, responde con conflicto de disponibilidad en vez de crear una reserva solapada.

### Actividad, categoría y tarifa

Quien solicita elige una actividad y una categoría: grupos y comités, socios o particulares. El backend calcula y valida la tarifa; no acepta montos enviados por el navegador. Las combinaciones sin tarifa publicada se rechazan.

La matriz vigente en Reservas toma como fuente la tabla aprobada en la sesión extraordinaria del 23-08-2026. Se guarda en cada solicitud una instantánea de actividad, categoría y monto. Al aprobar, Financiero crea el cargo usando ese monto. Las reservas históricas sin instantánea conservan su regla de precio previa.

Actividades y montos (CRC): Bailes: 90.000 para las tres categorías; Actividades deportivas: sin tarifa; Bingo: 40.000 / 35.000 / 50.000; Té de canastilla, Cumpleaños y Boda: sin tarifa para grupos y comités, 35.000 para socios y 50.000 para particulares; Cine y Lunada: 40.000 solo para grupos y comités; Charlas: sin tarifa.

Los únicos espacios disponibles para nuevas solicitudes son Salón Comunal y Play de los niños. El salón informa mobiliario (mesas y sillas), área de cocina y área de bar. La migración agrega el Play solo si aún no existe y no altera ni elimina recursos o reservas anteriores.

## Aprobación

Solo una reserva `PENDING` puede aprobarse.

Antes de aprobar, el servicio vuelve a validar:

1. que la reserva siga pendiente;
2. que no exista otra reserva bloqueante para ese recurso y horario;
3. que el recurso siga existiendo;
4. que el recurso siga `ACTIVE`;
5. para solicitudes nuevas, usar la tarifa guardada; las reservas históricas sin tarifa conservan la validación previa del precio del recurso.

Después:

```text
Reservation
PENDING → APPROVED
        ↓
FinancialCharge
PENDING
```

La creación del cargo financiero pertenece a la misma transacción que la aprobación.

Una restricción única evita crear dos cargos para la misma reserva.

## Rechazo

Solo una reserva `PENDING` puede rechazarse.

La transición se realiza mediante una actualización condicional que exige que el estado siga siendo `PENDING`, evitando que dos operaciones concurrentes modifiquen la misma reserva de forma inconsistente.

El motivo de rechazo queda almacenado en `rejectionReason`.

## Cancelación

La transición hacia `CANCELLED` se valida mediante `reservation-transition.policy.ts`.

Además existe integración financiera:

- si el cargo está `PENDING`, el cargo pasa a `CANCELLED`;
- si el cargo está `PAID`, la reserva no puede cancelarse directamente y requiere conciliación financiera previa.

Esto evita cancelar una reserva pagada sin resolver primero su efecto contable.

## Concurrencia

Las operaciones críticas utilizan transacciones Prisma con aislamiento:

```text
Serializable
```

Los conflictos de serialización `P2034` se reintentan hasta 3 veces.

Este mecanismo protege especialmente:

- creación frente a reservas simultáneas;
- aprobación frente a cambios de disponibilidad;
- rechazo concurrente;
- cancelación y su cargo asociado.

## Endpoints vigentes

### Recursos reservables

| Método | Ruta | Protección | Propósito |
| --- | --- | --- | --- |
| GET | `/reservable-resources` | JWT | Lista Salón Comunal y Play de los niños cuando están activos |

### Reservas

| Método | Ruta | Capability | Propósito |
| --- | --- | --- | --- |
| GET | `/reservations/availability` | autenticado | Consultar disponibilidad |
| GET | `/reservations` | `res.reservations.read` | Listar reservas |
| GET | `/reservations/:id` | `res.reservations.read` | Obtener detalle |
| POST | `/reservations` | autenticado | Crear reserva |
| PATCH | `/reservations/:id/approve` | `res.reservations.approve` | Aprobar |
| PATCH | `/reservations/:id/reject` | `res.reservations.reject` | Rechazar |
| PATCH | `/reservations/:id/cancel` | `res.reservations.cancel` | Cancelar |

## Rutas frontend

Actualmente el router expone:

| Ruta | Propósito |
| --- | --- |
| `/app/reservations/new` | Solicitud de reserva |
| `/app/reservations` | Administración de reservas |

La vista administrativa está protegida por `res.reservations.read`.

## Filtros administrativos

El listado admite filtros por:

- estado;
- recurso;
- fecha desde;
- fecha hasta;
- página;
- límite.

Los filtros `from` y `to` usan formato calendario `YYYY-MM-DD` y se interpretan explícitamente en horario de Costa Rica (`UTC-6`).

`to` se convierte en un límite exclusivo correspondiente al inicio del día siguiente, evitando perder reservas del último día seleccionado.

## Datos principales

Una reserva administrativa incluye, entre otros:

- recurso;
- solicitante;
- evento opcional;
- inicio y fin;
- actividad y categoría de quien solicita;
- tarifa guardada para la solicitud;
- propósito;
- asistentes estimados;
- notas;
- estado;
- aprobación y aprobador;
- motivo de rechazo;
- fecha de cancelación.

## Integración con Financiero

Reservas es actualmente un origen directo de cargos financieros.

La relación operativa es:

```text
Reserva aprobada
      ↓
FinancialCharge PENDING
      ↓
Pago exacto
      ↓
FinancialCharge PAID
```

Por esta razón, cambios futuros en aprobación, cancelación, pricing o pagos deben revisarse conjuntamente con `docs/modules/financial.md`.

## Pruebas relevantes

La vertical dispone de pruebas backend y frontend, entre ellas:

- `backend/src/reservations/reservations.service.spec.ts`
- pruebas de `ReservationRequestPage`
- pruebas de `ReservationAdminPage`

Los tests deben seguir cubriendo como mínimo:

- rangos inválidos;
- reservas pasadas;
- duración mínima y máxima;
- detección de solapamiento;
- creación concurrente;
- revalidación al aprobar;
- rechazo atómico;
- integración financiera en aprobación/cancelación;
- filtros de fecha de Costa Rica.

## Limitaciones y trabajo futuro

No debe inferirse de este documento que estén terminados:

- historial completo de reservas por solicitante;
- reglas avanzadas de capacidad;
- reglas avanzadas ligadas a eventos;
- conciliación financiera automática de reservas ya pagadas;
- todos los posibles flujos para `CONFIRMED` y `COMPLETED`.

Esos puntos deben documentarse cuando exista implementación real en `main`.

## Fuentes relacionadas

- `backend/src/reservations/`
- `frontend/src/features/reservations/`
- `frontend/src/app/router/AppRoutes.tsx`
- `docs/modules/financial.md`
- `docs/architecture/frontend-as-is.md`
- `docs/architecture/backend-as-is.md`
