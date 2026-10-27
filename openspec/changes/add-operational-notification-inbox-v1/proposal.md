# Proposal

## Why

El ERP muestra una campanita y los procesos administrativos generan pendientes, pero no existe una bandeja persistente ni un contrato para informar al responsable correcto. Las notificaciones por correo existentes no resuelven lectura, destinatario interno, contador ni acceso seguro al recurso asociado.

## What Changes

- Incorporar bandeja operativa persistente, propia de cada usuario autenticado, para mensajes operativos e informativos.
- Exponer API HTTP para listar notificaciones propias, consultar no leídas y marcar lectura individual o masiva.
- Emitir avisos sólo después de confirmar transacciones de solicitudes de cuenta, solicitudes de afiliación y reservas.
- Integrar campanita, contador real, popover y bandeja completa mediante TanStack Query y actualización HTTP periódica razonable.
- Conservar el módulo actual de correo para entrega de email; la bandeja no envía correo ni agrega WebSockets, colas o infraestructura distribuida.

## Capabilities

### New Capabilities
- `operational-notification-inbox`: bandeja interna autenticada, lectura persistente, contador y avisos de procesos autorizados.

### Modified Capabilities
- Ninguna.

## Impact

- Prisma/PostgreSQL: nueva entidad `Notification`, relación de sólo lectura desde `User`, índices y migración aditiva.
- Backend: extensión del contexto de notifications con persistencia HTTP protegida; integración transaccional acotada en solicitudes de cuenta, afiliación y reservas; auditoría de cambios de lectura.
- Frontend: nuevo feature `notifications`, consultas TanStack Query y controles ERP. No cambia Home pública, Dashboard V2, sesiones, rutas de negocio ni contratos existentes.
- Autorización: no se crea capacidad nueva para consultar la propia bandeja; cada operación deriva destinatario de JWT y verifica capacidad/rol actual antes de exponer un enlace a recurso.

## User Stories and Acceptance Scope

- Como responsable autorizado, quiero recibir un aviso interno cuando exista una solicitud pendiente de mi proceso para atenderla desde una ruta que ya puedo consultar.
- Como solicitante de reserva, quiero conocer su aprobación o rechazo sin recibir un enlace que amplíe mis permisos.
- Como usuario autenticado, quiero revisar y marcar sólo mis avisos para que el contador represente trabajo real pendiente.
- La aceptación se define por los escenarios de `specs/operational-notification-inbox/spec.md`: aislamiento por destinatario, lectura persistente, deduplicación, emisión sólo tras éxito, autorización de enlaces y estados frontend recuperables.
