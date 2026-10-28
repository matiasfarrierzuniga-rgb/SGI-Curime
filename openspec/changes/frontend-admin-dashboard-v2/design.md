# Diseño técnico — Dashboard Administrativo V2

## Arquitectura
Mantener `ErpLayout` y `AppHomePage` como shell/entrada. `AdminDashboard` conserva `useAdminDashboard` y el modelo `AdminDashboardResponse` con TanStack Query. Los subcomponentes visuales pueden separarse dentro de `features/admin-dashboard/ui` cuando la responsabilidad lo justifique. Integración de eventos únicamente mediante API pública del feature `events`.

## Mapa del wireframe aprobado
1. Sidebar: usar `ErpLayout` + `erpNavigation`, rutas y capacidades existentes.
2. Header: contexto de usuario ya disponible; búsqueda y campana son diferidos salvo contrato real.
3. Bienvenida: sesión y fecha es-CR; asset auténtico autorizado con fallback y texto accesible.
4. KPIs: cuatro datos reales de `AdminDashboardData`, sin crecimiento o minigráficos simulados.
5. Atención requerida: primero en jerarquía operativa; elementos con permiso y destino real.
6. Accesos rápidos: `quickActions` existente filtrado por `hasCapability`.
7. Calendario: eventos `SCHEDULED` obtenidos de `usePublicEvents`, fechas calculadas con `America/Costa_Rica`; navegación de meses y acceso a evento público.
8. Resumen por módulo: reutilizar `InstitutionalPanorama`, sometido a política de divulgación por métrica.
9. Estado de procesos: NO mostrar porcentaje mezclado; diferido hasta definir proceso específico y denominador.
10. Próximas actividades: próximos eventos públicos ordenados por `startAt`, estado vacío/error independientes.

## Responsive
- 320–767: Sheet móvil existente, KPIs 1–2 columnas sin overflow, pendientes sobre elementos secundarios, agenda apilada.
- 768–1023: sidebar compacta, KPIs 2 columnas y atención a ancho completo.
- 1024+: cuatro KPIs, zona central con pendientes/accesos/calendario, zona inferior resumen/actividades; no depender de alturas rígidas.

## Seguridad
Evitar request de endpoints protegidos antes de resolver la autorización. `403` no es error de red ni razón para exponer cifras. El backend decide acceso a valores. Dependencia externa formal: `reconcile-institutional-access-contract-v1`.

## Verificación
Pruebas Vitest existentes, casos de error de cada widget, calendario con fechas y zonas horarias, filtrado por capacidades, navegación por teclado, responsive manual, lint, arquitectura, tests, build. No declarar completado solo por captura visual.
