# Design

## Sources and authorization

| Experience | Source | Access | Boundary |
| --- | --- | --- | --- |
| Agenda | `useAdminEvents` → `GET /events` | route `pub.events.manage` | Events with `SCHEDULED` and non-`ARCHIVED` status only |
| Occupancy | `useReservationsList` → `GET /reservations` | `res.reservations.read` | Active rows from currently loaded result page only |
| Availability | `GET /reservations/availability` | authenticated request route | Existing boolean check remains authoritative |
| Date range | `DatePicker` controlled ISO values | caller-owned validation | UI limit only; no business calculation |
| Dashboard calendar | Existing events, reservations and assemblies queries | existing capability checks | Only sources currently loaded and authorized |

## Composition

Agenda is a local feature component: toolbar, four non-mutating views and semantic events list. Month view uses calendar cells and selection; week/day/list expose the same real events as chronological rows.

V1.1 uses FullCalendar Standard React package for events agenda (MIT, month/week/day/list only; no Premium scheduler plugins). It receives existing scheduled non-archived event records and opens a read-only detail dialog. The compact dashboard preserves capability-filtered sources; selecting a day opens a responsive consultation dialog with month/week/day/agenda views.

The v7 agenda imports its structural `skeleton.css`, Monarch theme plugin, `theme.css` and green palette stylesheet. Monarch variables are scoped to `InstitutionalAgenda` and map to SGI semantic tokens; native FullCalendar toolbar is disabled in favor of the existing responsive navigation, title and view controls. This replaces the incomplete skeleton-only styling configuration and does not change event data, RBAC or view behavior.

Reservation occupancy remains distinct: a compact resource-oriented month grid inside administrative reservations, explicitly labeled as loaded-result occupancy. It never paints hypothetical free slots. The existing public request route remains the action for validating actual availability.

`DateRangePicker` renders one controlled calendar surface for a continuous start/end interval. It forwards controlled ISO values, disables min/max invalid dates and clears/restarts selection when a new earlier date is chosen. The public request form maps date bounds back to existing `datetime-local` values and keeps time controls, availability validation and conflict authority unchanged.

## Shared utilities and accessibility

`shared/lib/calendar.ts` centralizes Costa Rica civil-day keys, calendar month generation, date formatting and month navigation. Calendar grids expose `role=grid`/`gridcell`, descriptive labels, visible focus and text alternatives. No interaction relies only on color.

## Risks and mitigations

- Reservation list pagination is not full resource scheduling data → label scope as loaded results and retain server validation.
- Event API has no date filter → agenda derives views client-side from current real admin response.
- Time zones → day grouping and formatting use `America/Costa_Rica`.

## Fase 2 composition

Eventos usa una grilla desktop de calendario y panel contextual; en móvil se apila. El panel siempre muestra la fecha seleccionada, sus eventos cronológicos o vacío compacto. El diálogo del dashboard conserva sus fuentes autorizadas y muestra navegación por fecha, vistas existentes y ruta de agenda. Reservas mantiene selector de recurso, rango controlado único, ocupación de resultados cargados y tabla con scroll aislado.

### Criterios visuales de aceptación

- `/app/events`: el calendario mensual y el panel de fecha seleccionada mantienen proporción aproximada 2:1 en escritorio; la selección es visible, los eventos son bloques semánticos, y Mes/Semana/Día/Agenda conservan navegación funcional. El panel muestra horario, lugar, estado, detalle y hasta tres actividades posteriores reales; en pantallas estrechas se apila.
- `/app`: al seleccionar un día, el diálogo centrado destaca fecha completa y agenda institucional, permite navegar entre fechas y conserva vistas Mes/Semana/Día/Agenda. Cada actividad muestra categoría, horario, lugar cuando existe y enlace a ruta autorizada; vacío breve cuando no hay datos.
- `/app/reservations`: la ocupación se limita explícitamente a filas activas cargadas, con calendario y consulta del día sin declarar días libres. Rango y selector siguen controlados; tabla y paginación existentes mantienen overflow aislado.
- `/servicios/reservas`: rango continuo, horario y resultado de disponibilidad se agrupan como bloque principal responsive. Ningún estado visual sustituye `GET /reservations/availability`; la acción de revisión solo se habilita tras confirmación del servidor.
