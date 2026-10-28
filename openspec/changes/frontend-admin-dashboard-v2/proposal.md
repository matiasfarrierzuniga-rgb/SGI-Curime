# frontend-admin-dashboard-v2 — Proposal

## Why
El Dashboard Administrativo V1 ya tiene servicios, estado remoto, indicadores y pruebas. La presentación aún difiere del wireframe V2 aprobado para SGI-Curime. Es necesario mejorar la jerarquía de atención, identidad institucional, calendario y experiencia responsive sin perder contratos existentes ni comprometer RBAC.

## What Changes
- Refactor visual incremental de `AdminDashboard`, sus indicadores, pendientes, accesos rápidos y panorama por módulo.
- Bienvenida institucional con saludo de sesión, fotografía real autorizada o fallback sin fotografía.
- Agenda y calendario de primera fase con `usePublicEvents` y eventos públicos publicados; navegar a detalle público.
- Aplicar tokens institucionales existentes, estados loading/empty/error, teclado y WCAG 2.2 AA.
- Mantener `ErpLayout`, servicios, rutas y pruebas existentes; cambios mínimos al shell únicamente con evidencia.
- No inventar actividad, tendencias o porcentajes sin fuente real.

## Scope
Incluye `features/admin-dashboard`, composición visual y pruebas; integración con API pública de `features/events`; ajustes muy focalizados en app shell/tokens si son imprescindibles. Excluye Dashboard Financiero, Home pública, nuevos endpoints, Prisma, guards, seeds, RBAC, calendario fusionado con reservas/asambleas y búsqueda/notificaciones sin backend.

## Dependencias
`reconcile-institutional-access-contract-v1` debe certificar `erp.dashboard.read` vs `@Roles('Administrador')`, rol nominal en `AppHomePage` y autorización de la divulgación de KPIs antes de declarar entrega funcional. No mezclar su implementación con este change.

## Reference
Wireframe visual elegido por el usuario, aportado como `wireframe-aprobado.png` en paquete de diseño; **pendiente incorporar binario bajo control de versiones**. Los números y la identidad ficticia del mockup son solo ilustración.

## Success
Dashboard visualmente consistente con la referencia y plenamente basado en datos reales, con permisos correctos, responsive 320/375/768/1024/1280/1366/1440, pruebas automatizadas y QA manual, revisión de PR y archive solo tras Definition of Done.

## Impact
Frontend `features/admin-dashboard`, integración de `features/events`, posibles ajustes mínimos de `ErpLayout`; sin migraciones ni cambio de reglas de negocio.
