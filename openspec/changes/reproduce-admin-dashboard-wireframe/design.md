# Design

## Context

See `proposal.md` for motivation. The dashboard already obtains aggregate administrative data through TanStack Query, conditionally obtains account-request counts according to capability, and reads public events for calendar and upcoming-activity regions. The calendar additionally reads reservations only with `res.reservations.read` and assemblies only with `adm.assemblies.read`; it exposes only their date and category, never their requester, purpose, location, attendance or other operational detail. The ERP shell provides persistent desktop navigation, responsive navigation and authenticated user context.

The approved reference at `docs/design/dashboard-admin-v2/wireframe-aprobado.png` defines visual composition only. It contains sample names, counts, trends, activity labels and process percentages that cannot be represented as SGI data unless an existing source supplies them.

## Goals / Non-Goals

**Goals:**

- Match the reference's 1536 × 1024 composition: 244 px desktop navigation, 76 px topbar, photo hero, four KPI cards, three central panels and three lower panels.
- Preserve server-state ownership, authenticated identity, authorization filtering and existing routes.
- Use existing institutional assets only, including the approved public landscape asset when present.
- Keep each unavailable metric's visual region with an explicit neutral empty or unavailable state.
- Retain responsive and keyboard-accessible behavior outside desktop reference dimensions.

**Non-Goals:**

- Create notification, search, trend, process-percentage, user-photo or event data sources.
- Change APIs, backend rules, database schema, permissions, routes or public Home components.
- Copy prototype counts, people, labels, statuses or percentages into runtime UI.

## Decisions

### Treat wireframe as geometry and styling, not a data contract

The implementation will map existing data to identical panel positions and visual hierarchy, but never map reference fixture values into display text. Regions with no verified data source retain their dimensions and use a clear unavailable state.

Alternative considered: reproduce every reference value for visual parity. Rejected because it misrepresents operational information.

### Keep presentation in current ERP shell and dashboard feature boundaries

`ErpLayout` owns sidebar/topbar geometry; `AdminDashboard` owns dashboard surfaces. Query hooks, services and capability checks remain unchanged. This preserves `app → features → shared` direction and avoids duplicate server state.

Alternative considered: create a standalone dashboard page with a parallel shell. Rejected because it would duplicate navigation, auth context and responsive behavior.

### Use institutional assets already served by the frontend

The hero uses an existing repository public image with a contrast overlay. Sidebar branding remains based on repository assets/tokens; no external images, remote fonts or generated assets are introduced.

Alternative considered: extract the wireframe photo or user portrait for runtime use. Rejected because the reference is not a production asset and embeds prototype content.

### Design visual-only controls as non-deceptive

Search, notifications and customization remain absent or explicitly unavailable unless they have working contracts. Interactive controls only navigate to existing authorized routes or operate existing calendar state.

Alternative considered: render inert controls to exactly match reference. Rejected because false affordances damage usability and accessibility.

### Reconcile calendar sources with authorized operational data

The compact calendar marks scheduled public events for every viewer, plus approved or confirmed reservations and non-cancelled assemblies only when their existing read capabilities are present. It renders date-category markers and a matching legend, while preserving unavailable sources as explicitly inaccessible. Calendar civil-day grouping and month boundaries use `America/Costa_Rica`.

Alternative considered: show all sources to every dashboard viewer. Rejected because the dashboard must not bypass existing reservation or assembly authorization, and the calendar does not need record detail to communicate institutional activity.

### Capture is an acceptance gate, not a source of runtime data

An authenticated local environment with real API responses is required to create the final 1536 × 1024 evidence image. The capture will not use mock fixtures or production secrets.

Alternative considered: capture a mocked visual harness. Rejected because acceptance requires real SGI data.

## Risks / Trade-offs

- [Reference uses unavailable trend/process/notification data] → Preserve panel placement with unavailable states and omit fabricated values.
- [Real data yields more or fewer rows than reference] → Constrain row density, use truncation and accessible empty states without hiding authorized records.
- [Landscape asset contrast varies by viewport] → Use responsive overlay and verify readable foreground contrast.
- [Full-shell geometry affects other ERP routes] → Scope layout adjustments to shared shell tokens/classes and review direct-route/mobile behavior during implementation.
- [No authenticated capture environment] → Do not mark visual acceptance complete; document exact capture command and prerequisites.
