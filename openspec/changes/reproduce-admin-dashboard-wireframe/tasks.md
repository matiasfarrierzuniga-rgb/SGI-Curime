# Tasks

## 1. Establish visual frame

- [ ] 1.1 Align `ErpLayout` desktop sidebar, topbar, search surface, authenticated identity treatment and content offsets with the 1536 × 1024 wireframe geometry; verify dashboard route displays a 244 px sidebar and 76 px topbar without horizontal overflow.
- [ ] 1.2 Preserve responsive sidebar drawer, keyboard focus and collapsed-navigation behavior while applying desktop geometry; verify 320, 768 and 1024 px layouts retain reachable navigation and visible focus.
- [ ] 1.3 Use only existing institutional theme tokens and repository assets for sidebar and banner presentation; verify no remote asset, new dependency or public Home component is added.

## 2. Reproduce dashboard composition with real sources

- [ ] 2.1 Render the banner as the wireframe hero composition using authenticated user name, generated dashboard date and existing institutional landscape asset; verify missing identity/date values degrade without prototype text.
- [ ] 2.2 Align four horizontal KPI cards with wireframe size, icon placement and spacing while retaining only `GET /admin-reports/dashboard` and authorized account-request data; verify values and links follow current capability checks.
- [ ] 2.3 Align the central three-panel region: attention rows, six quick actions in a 3 × 2 grid and compact calendar; verify every action targets an existing authorized route and calendar marks scheduled public events plus approved or confirmed reservations and non-cancelled assemblies only when their current read capabilities authorize each source, without exposing record detail.
- [ ] 2.4 Align the lower three-panel region: module summary, process-status placeholder and upcoming activities; verify unavailable process data shows a neutral state and activities derive only from scheduled public events.
- [ ] 2.5 Apply wireframe card density, typography, colors, dividers, hover and focus states across all dashboard regions; verify full keyboard traversal and contrast remain usable.

## 3. Validate visual acceptance without fabricated data

- [ ] 3.1 Run focused dashboard and ERP layout tests after visual changes; verify protected data, capability filtering, navigation state and empty/error/loading states remain covered.
- [ ] 3.2 Build the frontend and inspect direct dashboard routing with an authenticated local environment; verify no API, RBAC, route, business-process or Home-public regression.
- [ ] 3.3 Capture the authenticated dashboard at 1536 × 1024 with real SGI responses and compare all regions against `docs/design/dashboard-admin-v2/wireframe-aprobado.png`; verify composition before declaring visual work complete.

## Workflow follow-up

- Review visual evidence and implementation before archiving this change.
