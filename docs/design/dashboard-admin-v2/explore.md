# Explore — Frontend Admin Dashboard V2

**Proyecto:** SGI-Curime | **Auditoría:** FE-ADM-T01 | **Fecha:** 2026-10-25 | **Base:** rama remota `main` de `matiasfarrierzuniga-rgb/SGI-Curime` | **Estado:** auditoría estática documental concluida; validación de ejecución pendiente.

## Propósito

Comparar la composición aprobada visualmente (`wireframe-aprobado.png`) con el código existente del dashboard, AppShell, navegación, fuentes de eventos y permisos. Conservar capacidades previas y no introducir datos ficticios ni un segundo AppShell. Este archivo es **evidencia de exploración**, no una declaración de que el sistema fue probado en ejecución.

## Evidencia comprobada

| ID | Archivo fuente | Hallazgo | Consecuencia |
| --- | --- | --- | --- |
| E01 | `frontend/src/app/layouts/ErpLayout.tsx` | Header sticky con migas de ubicación, usuario y rol; sidebar expandible/compacto; Sheet móvil; logout; skip link; focus/reduced-motion | Reusar AppShell; refinamiento visual localizado; búsqueda y notificaciones no presentes en ese componente |
| E02 | `frontend/src/app/navigation/erpNavigation.ts` | Jerarquía por secciones, rutas y capabilities; `getErpNavigation` filtra elementos; `getErpEntryPath` deriva destino permitido | No duplicar catálogo; validar hijos y destinos con contrato de seguridad |
| E03 | `frontend/src/app/layouts/ErpLayout.test.tsx` | Pruebas para navegación, menú móvil y expansión, entre otras | Mantener pruebas; ampliar para el layout aprobado |
| E04 | `frontend/src/features/admin-dashboard/ui/AdminDashboard.tsx` | KPIs, atención requerida, panorama por módulo, accesos rápidos, actividad reciente no disponible; reutiliza Card, Skeleton, ErrorState, EmptyState | Refactorizar composición; no rehacer fetch ni mocks de negocio |
| E05 | `frontend/src/features/admin-dashboard/api/adminDashboard.api.ts` y `hooks/useAdminDashboard.ts` | TanStack Query consume `GET /admin-reports/dashboard` | Conservar API/hook y sus query keys |
| E06 | `frontend/src/features/admin-dashboard/model/adminDashboard.types.ts` | Datos de afiliados, solicitudes, reservas, finanzas, donaciones, inventario, asambleas, justificaciones; metadata | Reusar contadores; no inventar series de tiempo ni variaciones |
| E07 | `frontend/src/features/admin-dashboard/ui/AdminDashboard.test.tsx` | Casos de carga, indicadores, acceso condicional a solicitudes, atajos y reintento de error | Evitar regresiones; no se ejecutaron durante esta auditoría |
| E08 | `frontend/src/pages/erp/AppHomePage.tsx` | Render del AdminDashboard condicionado al nombre de rol `Administrador`; resumen especial para `Gestor de Inventario` | Dependencia RBAC existente, no corregir como efecto colateral visual |
| E09 | `frontend/src/app/router/AppRoutes.tsx` | `/app/dashboard` usa `RoleRoute capability="erp.dashboard.read"` | Contrato frontal basado en capability |
| E10 | `backend/src/admin-reports/admin-reports.controller.ts` | Reportes protegidos por `@Roles('Administrador')` y `RolesGuard` | Desalineación con E09; bloqueo de certificación |
| E11 | `frontend/src/features/events/api/events.api.ts`, `hooks/useEventsQueries.ts`, `model/events.types.ts` | `/public/events`, `/events`; `startAt`, `endAt`, `title`, `location`, `status`, publicación | Fuente real para calendario; distinguir públicos e internos |
| E12 | `backend/src/events/events.controller.ts` | `/public/events` público; `/events` administrativo exige `pub.events.manage` | Prohibido exponer eventos internos sin capability |
| E13 | `frontend/src/features/public-site/ui/components/AgendaSection.tsx` | Ya filtra próximos eventos programados públicos y muestra estados loading/error/empty | Reutilizar patrón de selección/estados sin acoplar la feature pública |
| E14 | `backend/src/assemblies/assemblies.controller.ts` | GET `/assemblies` exige `adm.assemblies.read` | Fuente potencial de actividades, integración condicionada |
| E15 | `backend/src/reservations/reservations.controller.ts` | GET `/reservations` exige `res.reservations.read`; backend tiene filtros de fecha documentados | Fuente potencial, no mezclar con agenda pública |
| E16 | `frontend/src/tailwind.css` + `frontend/CONVENTIONS.md` | Tokens semánticos ERP, verde/dorado, DM Sans y DM Serif, breakpoints, shadcn y restricciones de arquitectura | Preferir tokens existentes y evitar nuevos valores arbitrarios |
| E17 | `openspec/changes/reconcile-institutional-access-contract-v1/{proposal,tasks}.md` | Cambio RBAC existente con fases backend y frontend sin cerrar | Depender de ese cambio, no duplicarlo |

Referencias a GitHub: https://github.com/matiasfarrierzuniga-rgb/SGI-Curime/tree/main

## Comparación imagen ↔ implementación

| Región aprobada | Cobertura actual | Decisión |
| --- | --- | --- |
| Sidebar | Existe y es responsive | Reusar layout y catálogo; cambiar acabado visual de modo controlado |
| Header | Breadcrumb, sesión/rol | Pulir; búsqueda y avisos solo si se especifican contratos reales |
| Banner institucional | No forma parte del AdminDashboard actual | Crear componente presentacional con fotografía autorizada y fallback |
| 4 KPI | Cuatro KPI actuales con datos reales | Mantener fuentes actuales; estética del wireframe; elección final de métricas documentada |
| Atención requerida | Implementada | Reposicionar arriba; no revelar métricas restringidas |
| Accesos rápidos | Implementados con filtro | Modernizar grid; no agregar rutas inexistentes |
| Calendario | No integrado en el dashboard | Primera fase: eventos públicos `SCHEDULED`, con metadata vigente y timezone Costa Rica |
| Resumen por módulo | `InstitutionalPanorama` | Mantener cómputo, ajustar cards; revisar permisos por dato, no solo por link |
| Estado de procesos | No hay donut definido | No introducir porcentaje global artificial; posponer hasta denominador verificable |
| Próximas actividades | Agenda pública existente, fuera del dashboard | Integrar subset de eventos publicados; fuentes privadas son futuras extensiones autorizadas |
| Feedback | Skeleton/empty/error en dashboard y agenda | Preservar y extender por sección |

## Hallazgos y riesgos

**R01 — Bloqueador de seguridad:** `RoleRoute(erp.dashboard.read)` no equivale al guard de reportes basado en `Administrador`. Pertenece al OpenSpec de reconciliación institucional, tarea 4.5 y certificación por actor.

**R02 — Divulgación de métricas:** El `AdminDashboard` muestra algunas métricas agregadas aun cuando las capabilities solo gobiernan los enlaces. Validar control de visibilidad por dato y backend antes de abrir dashboard a otros roles.

**R03 — Persona/rol:** `AppHomePage` usa etiquetas de roles para elegir variante de dashboard; cambiarlo requiere contrato RBAC certificado.

**R04 — Calendarización:** Eventos públicos e internos tienen visibilidad diferente. Fechas usan timestamps ISO; formatear en `America/Costa_Rica`, sin asumir huso del navegador.

**R05 — Dato insuficiente:** Backend agregado actual no define series temporales, variaciones, calendario combinado ni porcentaje homogéneo de procesos. No simular gráficas ni porcentajes de la imagen.

**R06 — Riesgo de expansión:** el AppShell es transversal. En V2-02 preferir cambios compatibles y limitados; cambios amplios al shell deben tener pruebas regresivas de todos los módulos.

**R07 — Fuente visual:** imagen aprobada de referencia incluida en este paquete; cifras, nombres y eventos dibujados son exclusivamente ilustrativos.

## Decisiones para la propuesta

1. Refactorizar `AdminDashboard` **en el lugar**; conservar su API, hook, tipos y pruebas.
2. Reutilizar `ErpLayout`/`erpNavigation`; no montar un segundo shell.
3. Orden visual: bienvenida → KPI → atención / accesos / calendario → resumen / estado / actividades.
4. Calendario V2 primer corte: solo eventos públicos publicados y vigentes; usar solo datos de `/public/events` con estados reales. Cualquier fuente interna exige especificación de permisos independiente.
5. Gráfico de procesos solo si se define un conjunto único de estados; de lo contrario, sección de estado vacío informativo o fuera del incremento.
6. Definir explícitamente dato visible vs. acción disponible. Backend autoritativo para datos sensibles.
7. Usar tokens de `tailwind.css`, WCAG 2.2 AA, dispositivos 320/375/768/1024/1280/1366/1440.
8. Seguridad como dependencia separada: no tocar guards, Prisma o seeds en este cambio visual.

## Estado y límites de cierre

**FE-ADM-T01 — CERRADA como auditoría estática de `main`:** se identificaron componentes, hooks, rutas, fuentes y riesgos; el resultado permite elaborar `propose`.

**No certificados:** código local/worktrees, versiones de ramas no integradas, render visual en navegador, ejecución de tests, permisos reales en base de datos, datos reales de producción y disponibilidad de assets fotográficos autorizados.

Siguiente puerta: validar base Git y resolver o documentar bloqueo RBAC antes de aprobar implementación funcional. La referencia visual es obligatoria para las revisiones V2.
