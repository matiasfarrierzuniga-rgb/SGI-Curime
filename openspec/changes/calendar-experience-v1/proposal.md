# Calendar Experience V1.1

## Why

Eventos, reservas y campos de fecha ya disponen de contratos y componentes separados, pero carecen de experiencias de calendario coherentes para consultar agenda, interpretar ocupación y capturar rangos.

## What changes

- Añadir agenda institucional a la gestión de eventos con vistas de mes, semana, día y lista sobre eventos reales programados.
- Añadir calendario de ocupación por recurso a la administración de reservas y enlace a la solicitud existente.
- Extender el DatePicker compartido con `DateRangePicker` y aplicarlo a filtros de reserva sin cambiar validación backend.
- Extraer utilidades de calendario civil y formato Costa Rica para reutilización en experiencias nuevas.
- Refinar calendario compacto del dashboard: selección de fecha abre agenda ampliada de consulta con vistas mes, semana, día y agenda, limitada a fuentes ya autorizadas.
- Adoptar FullCalendar Standard (MIT), sin plugins Premium, para la agenda institucional de `/app/events` con detalle de evento de solo consulta.
- Reemplazar la captura visual de dos popovers independientes por un rango continuo y aplicar la fecha compartida al formulario público, conservando horas y validación de disponibilidad.

## Scope and exclusions

Rutas afectadas: dashboard administrativo, `/app/events`, `/app/reservations`, `/servicios/reservas`; componente reutilizable en `shared/ui/date-picker`. Se preservan `/servicios/reservas`, `pub.events.manage`, `res.reservations.read`, comprobación backend de conflictos y siete rutas autoskills.

No se crean endpoints, reglas, permisos, eventos o disponibilidad simulados. No hay drag-and-drop, edición desde cuadrícula, migraciones, plugins FullCalendar Premium, commits, push, PR, merge o archivado.

## Acceptance criteria

- Agenda muestra solo eventos reales `SCHEDULED` no archivados y permite cambiar vista sin mutación.
- Ocupación declara su límite a reservas cargadas y no afirma disponibilidad libre.
- El rango impide selección de fin previa a inicio dentro del control; backend conserva autoridad sobre filtros y conflictos.
- Estados existentes de carga/error/vacío y foco de teclado se preservan.
- Cada agenda distingue datos reales cargados de disponibilidad: reservas siguen siendo confirmadas por servidor.

## Fase 2

- Reorganizar Eventos como calendario principal con panel contextual de fecha para reducir desplazamiento y sostener consulta rápida.
- Refinar el diálogo institucional del dashboard con navegación diaria, tarjetas categorizadas y enlace a agenda completa.
- Consolidar rango, ocupación y tabla de Reservas sin duplicar capturas de fecha ni afirmar disponibilidad no verificada.
