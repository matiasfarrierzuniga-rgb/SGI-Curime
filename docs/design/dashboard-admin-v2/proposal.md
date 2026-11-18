# Proposal — Frontend Admin Dashboard V2

**Change ID propuesto:** `frontend-admin-dashboard-v2`  
**Épica:** `FE-V2-02`  
**Base de evidencia:** `explore.md` de FE-ADM-T01  
**Referencia visual obligatoria:** `wireframe-aprobado.png` (archivo adjunto del paquete)  
**Estado:** propuesta preparada, **no aplicada a GitHub / OpenSpec aún**.

## Why

El Dashboard Administrativo V1 es funcional y dispone de datos, navegación y pruebas, pero su composición y jerarquía visual no corresponden al wireframe V2 aprobado. El rediseño debe conservar lo construido, elevar los pendientes operativos, mejorar experiencia responsive y conectar eventos reales sin introducir simulaciones ni romper RBAC.

## What Changes

- Refactorizar visualmente el `AdminDashboard` existente y sus subcomponentes, conservando `GET /admin-reports/dashboard`, modelos, TanStack Query y datos válidos.
- Incorporar banner institucional con fotografía autorizada y alternativa sin fotografía; saludo a partir de sesión.
- Presentar cuatro KPIs existentes y documentados; sin tendencias sintéticas.
- Promover `AttentionPanel` como foco operacional, preservando enlaces autorizados.
- Modernizar `QuickActions`, `InstitutionalPanorama` y su orden en los breakpoints.
- Integrar calendario / próximas actividades V1 a partir de eventos públicos vigentes (`/public/events`) y reutilizar patrones de `usePublicEvents`, respetando visibilidad de publicación.
- Modernizar el contenedor sin replicar `ErpLayout`; cambios transversales de shell estrictamente compatibles y cubiertos por pruebas.
- Respetar tokens semánticos ya definidos en `frontend/src/tailwind.css`, estándares WCAG 2.2 AA, focus, teclado, motion reduction y estados loading/empty/error/403.
- Alinear divulgación de indicadores con política backend **solo después de la resolución/certificación del cambio RBAC separado**.

## Scope

**In:** `features/admin-dashboard/ui` y tests; integración a través del índice público de `features/events` si es necesaria; cambios mínimos aprobados de `ErpLayout` y tokens solo cuando la reutilización existente no alcance; documentación y pruebas visuales.

**Out:** rediseño del dashboard financiero, Home pública, formularios y módulos restantes; nuevo backend agregado; nuevas capabilities; modificación de guards/roles/Prisma/seed; calendario unificado de recursos/asambleas/reservas; actividad reciente simulada; ranking o KPI global sin denominador.

## Functional design

| Bloque | Fuente | Interacción | Visibilidad |
| --- | --- | --- | --- |
| Bienvenida | Sesión y asset aprobado | Presentación | Sólo sesión permitida |
| KPI | `AdminDashboardResponse.data` | Enlaces existentes a módulos | Política explícita por métrica y capacidad de lectura |
| Atención requerida | `AdminDashboardResponse` + solicitudes de cuenta autorizadas | Ir a bandeja correspondiente | No divulgar conteos restringidos |
| Accesos rápidos | Catálogo actual | Navegar | `hasCapability` + backend |
| Resumen por módulo | Panorama existente | Navegar | Alinear metadatos e indicadores autorizados |
| Calendario | `usePublicEvents` | Mes anterior/siguiente, seleccionar evento | Solo eventos publicados y públicos |
| Próximas actividades | Próximos eventos públicos programados | Abrir detalle `/eventos/:publicId` | Público |
| Estado de procesos | Por ahora no hay métrica transversal certificada | Diferido o estado explicativo | No inventar porcentajes |

## UX / responsive

- Escritorio ≥1024px: mantener sidebar, bienvenida compacta, 4 KPIs, 3 paneles principales y fila inferior.
- Tablet 768–1023px: sidebar compacta, KPIs 2 columnas, atención ancho completo, demás paneles 2 columnas o apilados.
- Móvil 320–767px: navegación Sheet, KPIs 2 columnas cuando quepan, pendientes primero, accesos y agenda apilados; sin overflow.
- Verificar expresamente 320, 375, 768, 1024, 1280, 1366 y 1440px, incluyendo teclado y zoom.

## Dependencies and constraints

- **Bloqueante para certificación funcional:** OpenSpec `reconcile-institutional-access-contract-v1`: endpoint `/admin-reports/dashboard` con guard legacy `Administrador`; ruta requiere `erp.dashboard.read`; elección actual por nombre de rol en `AppHomePage`; control por dato y no solo por enlace. No modificar estos contratos dentro del trabajo puramente visual.
- Revisar assets y derechos antes de incluir la imagen de Curime en repositorio.
- Confirmar, con respuesta real, visibilidad y estado de publicación de eventos; preservar `America/Costa_Rica` en representación temporal.
- Usar dependencias ya instaladas, sin adoptar nueva librería de calendario sin necesidad probada.

## Task breakdown (aplicar sólo tras aprobación del propose)

- [ ] 1. Congelar commit base/branch/estado local y conservar la imagen aprobada versionada como referencia (sin datos ficticios).
- [ ] 2. Verificar dependencia de RBAC y matriz de divulgación de KPI; bloquear entrega funcional hasta resolver.
- [ ] 3. Reorganizar `AdminDashboard` en piezas UI testables, manteniendo contrato API y pruebas.
- [ ] 4. Implementar cabecera visual y KPIs, con fallback para foto y sesión.
- [ ] 5. Refinar atención, accesos y panorama reutilizando navegación actual.
- [ ] 6. Integrar próximos eventos públicos, un calendario básico accesible y estados aislados; no agregar eventos internos.
- [ ] 7. Afinar shell sólo cuando sea imprescindible, manteniendo navegación, focus, sticky header y drawer.
- [ ] 8. QA responsive + accesibilidad + permisos + datos + regresión de módulos.
- [ ] 9. Ejecutar `npm run verify`, `git diff --check`; validar en navegador y documentar evidencia.
- [ ] 10. PR revisada, integración y OpenSpec archive tras cumplir Definition of Done.

## Acceptance criteria

1. La jerarquía visual corresponde a la imagen aprobada, tolerando adaptaciones funcionalmente necesarias y documentadas.
2. No se muestran cifras de demostración, actividad falsa, porcentajes, tendencias o eventos inventados.
3. Se conservan fetches, modelos, contratos y rutas existentes; se prueba ausencia de regresiones.
4. Indicadores privados y acciones cumplen la matriz de capabilities y la decisión efectiva del backend; `401`/`403` preservan semántica.
5. El calendario/actividades del primer corte solo refleja eventos públicos publicados y vigentes con carga, vacío y error propios.
6. La pantalla es usable a 320, 375, 768, 1024, 1280, 1366, 1440 y navegación por teclado, con WCAG 2.2 AA como objetivo.
7. Validaciones automatizadas aprobadas + revisión manual visual documentada.
8. PR integrada y OpenSpec archivado sin tareas pendientes disfrazadas de completadas.

## Risks and rollback

- **RBAC:** no elevar permisos por motivos de presentación; suspender despliegue funcional hasta resolver el contrato existente.
- **Calendario:** no mezclar fuentes públicas e internas; aislar errores de consulta por panel.
- **Layout transversal:** cambios del shell pueden impactar todos los módulos; revertir commits visuales separables ante regresión.
- **Evidencia:** fuentes/variaciones no disponibles se ocultan, no se reemplazan por mocks en producción.

Rollback: revertir commits de presentación conservando `ErpLayout`, servicios, tipos, routes y banco de pruebas V1. No hay migración de base de datos prevista.

## Impact

Frontend: `features/admin-dashboard`, integración por API pública de `features/events`, eventuales ajustes focalizados de `app/layouts/ErpLayout.tsx` y CSS de tema. Backend: sin cambios en este incremento. Datos: sin migración. Documentación: spec y evidencia visual versionada.

## Governance / OpenSpec

Usar `explore` como evidencia ya levantada y este archivo como borrador de `propose`; revisar el plan de trabajo contra el OpenSpec RBAC existente y el commit vigente antes de ejecutar `apply`. Archivar sólo después de pruebas y PR integrada. **No declarar listo el dashboard por similitud visual únicamente.**
