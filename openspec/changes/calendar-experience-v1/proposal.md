# Calendar Experience V1

## Why

Eventos, reservas y campos de fecha ya disponen de contratos y componentes separados, pero carecen de experiencias de calendario coherentes para consultar agenda, interpretar ocupación y capturar rangos.

## What changes

- Añadir agenda institucional a la gestión de eventos con vistas de mes, semana, día y lista sobre eventos reales programados.
- Añadir calendario de ocupación por recurso a la administración de reservas y enlace a la solicitud existente.
- Extender el DatePicker compartido con `DateRangePicker` y aplicarlo a filtros de reserva sin cambiar validación backend.
- Extraer utilidades de calendario civil y formato Costa Rica para reutilización en experiencias nuevas.

## Scope and exclusions

Rutas afectadas: `/app/events`, `/app/reservations`; componente reutilizable en `shared/ui/date-picker`. Se preservan `/servicios/reservas`, `pub.events.manage`, `res.reservations.read`, comprobación backend de conflictos y siete rutas autoskills.

No se crean endpoints, reglas, permisos, eventos o disponibilidad simulados. No hay drag-and-drop, edición desde cuadrícula, migraciones, dependencias, commits, push, PR, merge o archivado.

## Acceptance criteria

- Agenda muestra solo eventos reales `SCHEDULED` no archivados y permite cambiar vista sin mutación.
- Ocupación declara su límite a reservas cargadas y no afirma disponibilidad libre.
- El rango impide selección de fin previa a inicio dentro del control; backend conserva autoridad sobre filtros y conflictos.
- Estados existentes de carga/error/vacío y foco de teclado se preservan.
