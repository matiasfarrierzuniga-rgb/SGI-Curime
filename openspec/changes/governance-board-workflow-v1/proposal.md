# Proposal

## Why

La vertical de Junta Directiva ya registra períodos y nombramientos, pero una sustitución requiere dos operaciones independientes. Si la segunda falla, el historial puede quedar cerrado sin su sucesor.

## What Changes

- Incorporar una sustitución atómica de nombramiento: cerrar vigencia del nombramiento actual y crear el sucesor en una transacción.
- Exponer la acción únicamente para quien tenga `adm.institutional-board.manage`; conservar consulta con `adm.institutional-board.read`.
- Agregar UI guiada para sustitución, manteniendo selección person-first y sin convertir cargos institucionales en roles de software.
- Conservar edición administrativa existente, historial, auditoría y validaciones de fechas; no agregar reglas estatutarias, elegibilidad ni cupos.

## Capabilities

### New Capabilities
- `institutional-board`: administración auditable de períodos, nombramientos y sustituciones históricas de Junta Directiva.

### Modified Capabilities
- Ninguna.

## Impact

- Backend NestJS: controlador, DTO, servicio y pruebas focalizadas de Junta.
- Frontend React: API, hooks, pantalla y pruebas focalizadas de Junta.
- Sin migración Prisma, cambios de datos, dependencias, roles ni permisos nuevos.
