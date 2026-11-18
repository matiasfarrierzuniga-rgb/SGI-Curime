# FE-ADM-T01 — Exploración técnica Dashboard Administrativo V2

Estado: AUDITORÍA ESTÁTICA CONCLUIDA sobre `main` remoto; no certifica entorno local ni ejecución.

## Referencia visual
Wireframe administrativo verde institucional elegido por el usuario (archivo original `wireframe-aprobado.png` del paquete de diseño de SGI-Curime). La imagen es referencia visual obligatoria para `apply`; su binario **aún no está versionado en esta rama**. No reemplazarlo por otra imagen ni considerar las cifras del mockup como datos reales.

## Evidencia y reutilización
- `frontend/src/app/layouts/ErpLayout.tsx`: header sticky, sidebar colapsable, Sheet móvil, agrupación y navegación contextual; preservar comportamiento y pruebas `ErpLayout.test.tsx`.
- `frontend/src/app/navigation/erpNavigation.ts`: catálogo de rutas filtrado mediante capabilities; evitar duplicar navegación.
- `frontend/src/features/admin-dashboard/ui/AdminDashboard.tsx`: KPIs reales, InstitutionalPanorama, AttentionPanel, QuickActions y RecentActivity explícitamente no disponible. Reutilizar y refactorizar, nunca reescribir de cero.
- `frontend/src/features/admin-dashboard/model/adminDashboard.types.ts`, `hooks/useAdminDashboard.ts`, `api/adminDashboard.api.ts`: contrato real y fetch mediante TanStack Query a `/admin-reports/dashboard`.
- `frontend/src/features/admin-dashboard/ui/AdminDashboard.test.tsx`: pruebas existentes de carga, datos, capacidades, acciones y errores.
- `frontend/src/tailwind.css` y `frontend/CONVENTIONS.md`: tokens ERP, tipografía DM Sans / DM Serif Display, capas app/features/shared y accesibilidad.

## Agenda real
- `frontend/src/features/events/api/events.api.ts`: `listPublic()` -> `GET /public/events`; `listAdmin()` -> `GET /events`.
- `frontend/src/features/events/hooks/useEventsQueries.ts`: `usePublicEvents` y `useAdminEvents`.
- `frontend/src/features/events/model/events.types.ts`: `startAt`, `endAt`, `title`, `location`, `status`; eventos internos además tienen `publicationStatus`.
- `frontend/src/features/public-site/ui/components/AgendaSection.tsx`: patrón verificado de ordenamiento y filtrado de eventos públicos programados. Reutilizar lógica sin importar el componente de página pública.
- `backend/src/events/events.controller.ts`: la consulta administrativa exige `pub.events.manage`; la consulta pública no. Primer calendario V2 basado en eventos públicos publicados, sin exponer internos.
- `backend/src/assemblies/assemblies.controller.ts`: lectura `adm.assemblies.read`; `backend/src/reservations/reservations.controller.ts`: lectura `res.reservations.read`. Integración de estas dos fuentes diferida.

## Riesgos / dependencias
- `frontend/src/pages/erp/AppHomePage.tsx` sigue seleccionando dashboard mediante nombre del rol `Administrador`, no exclusivamente capacidades.
- Ruta `/app/dashboard` requiere `erp.dashboard.read` mientras `backend/src/admin-reports/admin-reports.controller.ts` conserva `@Roles('Administrador')`.
- En `InstitutionalPanorama`, la capability controla el enlace pero los conteos agregados pueden renderizarse igualmente. Certificar divulgación por métrica antes de habilitar acceso más amplio.
- El cambio `openspec/changes/reconcile-institutional-access-contract-v1` es dueño de RBAC; no duplicar migraciones de guards ni inventar capabilities.
- El Header no contiene búsqueda global ni centro de notificaciones verificados: ninguno debe representarse como funcional sin contrato real.
- Un estado global porcentual de procesos de distintos módulos carece de denominador homogéneo y se difiere.

## Resultado FE-ADM-T01
CERRADA para inventario estático y decisión de diseño; pendientes por fuera del alcance: validación en navegador, estado de worktrees locales, autorización certificada y pruebas de ejecución.
