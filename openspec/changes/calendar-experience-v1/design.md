# Design

## Sources and authorization

| Experience | Source | Access | Boundary |
| --- | --- | --- | --- |
| Agenda | `useAdminEvents` → `GET /events` | route `pub.events.manage` | Events with `SCHEDULED` and non-`ARCHIVED` status only |
| Occupancy | `useReservationsList` → `GET /reservations` | `res.reservations.read` | Active rows from currently loaded result page only |
| Availability | `GET /reservations/availability` | authenticated request route | Existing boolean check remains authoritative |
| Date range | `DatePicker` controlled ISO values | caller-owned validation | UI limit only; no business calculation |

## Composition

Agenda is a local feature component: toolbar, four non-mutating views and semantic events list. Month view uses calendar cells and selection; week/day/list expose the same real events as chronological rows.

Reservation occupancy remains distinct: a compact resource-oriented month grid inside administrative reservations, explicitly labeled as loaded-result occupancy. It never paints hypothetical free slots. The existing public request route remains the action for validating actual availability.

`DateRangePicker` composes two existing `DatePicker` controls rather than forcing calendar agenda behavior into form fields. It forwards controlled ISO values and constrains the opposite picker when a bound is selected.

## Shared utilities and accessibility

`shared/lib/calendar.ts` centralizes Costa Rica civil-day keys, calendar month generation, date formatting and month navigation. Calendar grids expose `role=grid`/`gridcell`, descriptive labels, visible focus and text alternatives. No interaction relies only on color.

## Risks and mitigations

- Reservation list pagination is not full resource scheduling data → label scope as loaded results and retain server validation.
- Event API has no date filter → agenda derives views client-side from current real admin response.
- Time zones → day grouping and formatting use `America/Costa_Rica`.
