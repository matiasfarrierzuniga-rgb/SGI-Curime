# Tasks

## 1. Baseline-safe shell composition

- [x] 1.1 En rama/worktree aprobado, recomponer únicamente `ErpLayout` para zonas de Sidebar (marca, navegación, firma institucional y acciones), preservando `getErpNavigation`, destinos, callbacks y `SidebarActions`; verificar con `ErpLayout.test.tsx` que navegación, sitio público y logout continúan disponibles.
- [x] 1.2 Normalizar medidas, padding, iconografía Lucide, jerarquía de encabezados y estados default/hover/active/focus con tokens ERP existentes; aprobación visual humana recibida y controles icon-only conservan nombre accesible.
- [x] 1.3 Ajustar modo colapsado sin cambiar semántica: destino identificable, control de expandir/colapsar, foco y grupos con hijos; verificado por `ErpLayout.test.tsx` (21 pruebas focalizadas PASSED).
- [x] 1.4 Retirar `SidebarInstitutionalArt` por decisión visual aprobada y preservar acciones inferiores; navegación central conserva scroll y las acciones quedan fuera de la región scrollable.

## 2. Header y controles reales

- [x] 2.1 Refinar Header sticky dentro de `ErpLayout` con contexto de ubicación, separación de controles y alineamiento reactivo al ancho del Sidebar; aprobación visual humana recibida y no se agrega título ni acción ficticia.
- [x] 2.2 Retirar búsqueda global pasiva mientras no exista contrato funcional; verificar ausencia de superficie, input, submit, navegación o resultados simulados.
- [x] 2.3 Ajustar presentación de `NotificationCenter` y `ProfileMenu` solo en límites necesarios, preservando consultas, mutaciones, acciones, teclado y estados actuales; `Notifications.test.tsx` (4 pruebas) y `ErpLayout.test.tsx` (21 pruebas) PASSED.
- [x] 2.4 Confirmar que overlays usan primitivas Base UI/shadcn existentes y foco visible sin reimplementación manual; `ErpLayout.test.tsx` verifica drawer y Escape en menú de cuenta; no se agregaron dependencias.

## 3. Responsive y accesibilidad

- [x] 3.1 Refinar drawer móvil existente y comportamiento tablet/desktop sin alterar rutas ni permisos; QA visual humana PASSED a 320×568, 375×667, 768×1024, 1024×768 y 1440×900, sin overflow horizontal; Sidebar expandido, colapsado y drawer verificados según viewport.
- [x] 3.2 Verificar con teclado orden de foco, skip link, foco visible no oscurecido, nombres de controles y estados `aria-current`/`aria-expanded`; QA humana PASSED para tabulación, skip-link, chevrons, Escape y retorno de foco; pruebas focalizadas preservan contratos automatizables.
- [x] 3.3 Verificar contraste de navegación, acentos por área, foco y logout; cálculo WCAG 2.2 registrado en `design.md`: ocho etiquetas ≥4.5:1 sobre `#075442`, indicadores de foco ≥3:1 y logout 8.09:1.
- [x] 3.4 Probar nombres/roles largos, grupos extensos, última opción del scroll, contador `99+`, estado de notificaciones loading/error/vacío y `prefers-reduced-motion`; QA humana PASSED y acciones esenciales permanecen alcanzables.

## 4. Contratos y validación integrada

- [x] 4.1 Revisar que `erpNavigation.ts`, `AppRoutes.tsx`, `InternalErpRoute.tsx`, `RoleRoute.tsx`, `access.ts`, servicios API y backend no cambien; diff confirma ausencia de cambios y `InternalErpRoute.test.tsx` + `RoleRoute.test.tsx` (17 pruebas) PASSED para `/403` y cuenta comunitaria fuera del ERP.
- [x] 4.2 Ejecutar validaciones frontend autorizadas: `ErpLayout.test.tsx` (21 PASSED), `Notifications.test.tsx` (4 PASSED), `npm run check:architecture` (PASSED), `npm run lint` (PASSED con warnings preexistentes) y `npm run build` (PASSED).
- [x] 4.3 Revisar `git diff --check` y diff final para confirmar que el incremento queda limitado al shell, sus pruebas y artefactos OpenSpec; no hay cambios a módulos ERP, rutas, RBAC, backend, Prisma, APIs ni dependencias.

## Workflow follow-up

- Solicitar revisión y autorización explícita antes de Apply.
- Archivar únicamente tras completar tareas, evidencia visual responsive y validación técnica real.
