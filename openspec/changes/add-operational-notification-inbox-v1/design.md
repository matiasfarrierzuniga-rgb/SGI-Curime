# Design

## Context

See `proposal.md` and `specs/operational-notification-inbox/spec.md`. El módulo `backend/src/modules/notifications` hoy entrega correo por un puerto `EmailProvider`; no tiene controlador, persistencia ni dependencia de Prisma. `User` tiene sesión, rol y permisos persistidos; `UserRequest` y `AffiliateRequest` se originan públicamente, mientras `Reservation` conserva `requesterUserId` y se resuelve mediante transacciones serializables. Los patrones HTTP usan JWT, `CapabilityGuard`, DTO `page`/`limit`, Prisma y respuestas `{ data, total, page, limit }`.

## Goals / Non-Goals

**Goals:**

- Agregar una bandeja interna consistente con identidad y autorización existentes.
- Hacer atómica la persistencia de notificación con cada transición origen.
- Mantener el frontend como consumidor HTTP con TanStack Query.
- Evitar filtrar datos de solicitudes o reservas a destinatarios sin autorización vigente.

**Non-Goals:**

- Reemplazar correo, emitir correo duplicado, introducir mensajería en tiempo real, colas, workers, WebSockets o preferencias de notificación.
- Alterar estados, reglas, rutas, capacidades o respuestas actuales de solicitudes y reservas.
- Crear notificaciones para todos los módulos, para operaciones fallidas, ni backfill histórico.
- Exponer identificación, correo, motivo de solicitud, rechazo o detalles de reserva dentro del texto de una notificación V1.

## Decisions

### Extender el contexto notifications con una bandeja interna separada del transporte de correo

`notifications` conservará el servicio de email actual y añadirá un servicio de bandeja, repositorio Prisma y controlador HTTP protegidos. La responsabilidad de canal se separa dentro del mismo contexto: correo continúa usando `NotificationService`; bandeja usa entidad persistente y no invoca proveedores de email.

Alternativa considerada: reutilizar `AuditLog` como bandeja. Rechazada: auditoría no tiene destinatario obligatorio, lectura, retención de UX ni semántica de notificación. Alternativa considerada: módulo paralelo no relacionado. Rechazada: duplica el vocabulario de notificación y el punto de integración.

### Modelo persistente aditivo y sin URL arbitraria

Se añadirá `Notification` con:

| Campo | Diseño |
|---|---|
| `id` | entero autoincremental |
| `recipientUserId` | FK obligatoria a `User`, `onDelete: Restrict` |
| `type` | enum de evento: `USER_REQUEST_SUBMITTED`, `AFFILIATE_REQUEST_SUBMITTED`, `RESERVATION_SUBMITTED`, `RESERVATION_APPROVED`, `RESERVATION_REJECTED` |
| `category` | enum `OPERATIONAL` o `INFORMATIONAL` |
| `priority` | enum con valor V1 `NORMAL`; preparado para prioridades aprobadas futuras |
| `title`, `body` | texto institucional breve, sin PII ni detalle sensible |
| `resourceType`, `resourceId` | enum/identificador del recurso origen; nunca URL recibida del cliente |
| `deduplicationKey` | cadena determinística única por destinatario, tipo y recurso |
| `readAt`, `createdAt`, `expiresAt` | lectura opcional; creación y vencimiento a 365 días |

Índices: `recipientUserId, readAt, createdAt(desc)` para bandeja/contador y `recipientUserId, expiresAt` para visibilidad. El índice único sobre `deduplicationKey` absorbe reintentos y concurrencia sin cambiar una notificación ya emitida. `User` expone relación inversa `notifications`.

El servidor transforma `resourceType` a una acción conocida y sólo la devuelve tras validar las capacidades/rol actuales. No se persiste URL ni capacidad enviada por navegador.

Alternativa considerada: clave única compuesta. Rechazada: una clave explícita soporta recursos futuros y evita semántica ambigua con campos nulos. Alternativa considerada: JSON de recurso. Rechazada: elimina índices y tipado verificable.

### API propia, autenticada y derivada del JWT

| Endpoint | Contrato |
|---|---|
| `GET /notifications?page=1&limit=20&filter=ALL|UNREAD` | página propia, ordenada por `createdAt desc`; límite 1–100 |
| `GET /notifications/unread-count` | `{ unread: number }` propio |
| `PATCH /notifications/:id/read` | marca sólo registro cuyo `recipientUserId` es actor; idempotente |
| `PATCH /notifications/read-all` | marca sólo no leídas activas del actor; retorna cantidad modificada |

Todos usan `JwtAuthGuard`; no aceptan `recipientUserId`. Una lectura individual ajena se responde como `404`, igual que inexistente, para no confirmar existencia. La bandeja no requiere capacidad nueva: es información propia. La acción enlazada se recalcula al responder, usando reglas actuales del recurso.

Lecturas individuales y masivas generan auditoría sin cuerpo, título, token ni datos personales: `NOTIFICATION_READ` y `NOTIFICATIONS_MARKED_READ`, con usuario actor y entidad cuando aplique.

### Emisión en misma transacción confirmada

Los productores llamarán al servicio de bandeja usando el mismo `Prisma.TransactionClient` después de crear o transicionar el recurso, pero antes de confirmar la transacción. `createMany({ skipDuplicates: true })` o inserción equivalente con el índice único garantiza atomicidad y deduplicación. Ningún aviso se emite después de una excepción, conflicto o rollback.

| Evento confirmado | Destinatario | Autorización de destinatario | Tipo/categoría | Acción expuesta |
|---|---|---|---|---|
| `UserRequest` creado `PENDING` | usuarios `ACTIVE` con `usr.user-requests.read` y `usr.user-requests.review` persistidos | ambas capacidades | `USER_REQUEST_SUBMITTED` / operacional | `/admin/user-requests` |
| `AffiliateRequest` creado `PENDING` | usuarios `ACTIVE` con rol `Administrador` | coincide con `RolesGuard` vigente del módulo | `AFFILIATE_REQUEST_SUBMITTED` / operacional | `/app/admin/requests` |
| `Reservation` creada `PENDING` | usuarios `ACTIVE` con `res.reservations.read` y `res.reservations.approve` persistidos | ambas capacidades | `RESERVATION_SUBMITTED` / operacional | `/app/reservations` |
| Reserva aprobada | `requesterUserId` | usuario solicitante autenticado; acción exige `res.reservations.read` vigente | `RESERVATION_APPROVED` / informacional | sólo si conserva lectura |
| Reserva rechazada | `requesterUserId` | usuario solicitante autenticado; acción exige `res.reservations.read` vigente | `RESERVATION_REJECTED` / informacional | sólo si conserva lectura |

No se emiten avisos al aprobar/rechazar solicitudes de cuenta o afiliación en V1: ambas pueden proceder de una persona sin `User` autenticable y no hay destinatario de bandeja verificable. El flujo de activación por correo permanece sin cambio.

Alternativa considerada: enviar a todos los administradores para cualquier evento. Rechazada: amplía exposición y no refleja responsabilidades de cada contrato. Alternativa considerada: crear capacidades `not.*`. Rechazada: la bandeja propia no las requiere y los enlaces se apoyan en autorización existente.

### Retención sin scheduler nuevo

Cada notificación recibirá `expiresAt = createdAt + 365 días`. Listas, contador y mutaciones consideran sólo `expiresAt > now`; registros vencidos no se exponen ni se cuentan. La purga física será una operación de mantenimiento PostgreSQL idempotente documentada para ejecución controlada posterior al periodo, no cron ni worker introducido por V1. La migración no borra ni transforma datos existentes porque no existen notificaciones previas.

Alternativa considerada: limpieza durante cada consulta. Rechazada: añade escrituras sorpresa y coste variable al flujo de lectura. Alternativa considerada: retención ilimitada. Rechazada: no cumple minimización de datos operativos.

### Frontend HTTP y actualización limitada

Se creará feature `notifications` con API, tipos y hooks públicos. Claves separan contador, recientes y páginas filtradas. El header consulta contador y recientes con `refetchInterval: 60_000` mientras hay sesión y `refetchOnWindowFocus: true`; lectura invalida contador, recientes y listas. Popover sólo muestra datos retornados por servidor, con estado carga/vacío/error; la bandeja completa será una ruta ERP protegida por autenticación interna, no por capacidad nueva. Menú y sidebar existentes no cambian su semántica.

Alternativa considerada: derivar contador de dashboard o hacer polling corto. Rechazada: no es semántica de notificación y aumenta tráfico sin requisito.

## Risks / Trade-offs

- [Permisos cambian después de emitirse] → resolver acción en cada respuesta; omitir enlace y detalles cuando ya no aplica.
- [Roles/capacidades heredados son inconsistentes] → cada productor usa misma regla del endpoint actual y pruebas de destinatarios negativos.
- [Inserción notificación falla] → transacción completa revierte; evita recurso confirmado sin aviso, a costa de hacer notificación parte del éxito V1.
- [Sin purga física automática] → `expiresAt` limita exposición; operación de mantenimiento controlada elimina vencidas sin infraestructura de ejecución nueva.
- [El solicitante de reserva no tiene capacidad de lectura] → recibe resultado propio sin URL; no se añade excepción de autorización por este cambio.
- [Volumen crece] → paginación, índices por destinatario y periodo visible; revisar métricas antes de sumar nuevos productores.

## Migration Plan

1. Crear migración Prisma aditiva con enums, tabla, FK, índices y relación inversa; no ejecutarla contra datos reales sin respaldo y entorno identificado.
2. Desplegar código backend compatible antes o junto con migración; endpoints permanecen inaccesibles hasta que tabla exista.
3. Verificar migración en PostgreSQL desechable, destinatarios, aislamiento entre usuarios, dedupe concurrente y rutas autorizadas.
4. Desplegar frontend después de API; sin respuesta, mostrar estados de carga/error, nunca contadores fabricados.
5. Rollback: retirar productores y frontend primero; conservar tabla durante periodo de reversión. No hacer rollback destructivo de filas leídas; eliminar estructura sólo con decisión operacional y respaldo.

## Open Questions

- Ninguna para V1. La ejecución de purga física requiere procedimiento operacional aprobado antes de que existan datos que superen 365 días; no bloquea la creación ni visibilidad limitada por `expiresAt`.
