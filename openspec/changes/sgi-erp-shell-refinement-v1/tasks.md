# Tasks

## 1. Baseline-safe shell composition

- [x] 1.1 En rama/worktree aprobado, recomponer únicamente `ErpLayout` para zonas de Sidebar (marca, navegación, firma institucional y acciones), preservando `getErpNavigation`, destinos, callbacks y `SidebarActions`; verificar con `ErpLayout.test.tsx` que navegación, sitio público y logout continúan disponibles.
- [ ] 1.2 Normalizar medidas, padding, iconografía Lucide, jerarquía de encabezados y estados default/hover/active/focus con tokens ERP existentes; verificar visualmente que activo no dependa solo de color y que controles icon-only tengan nombre accesible.
- [ ] 1.3 Ajustar modo colapsado sin cambiar semántica: destino identificable, control de expandir/colapsar, foco y grupos con hijos; verificar por prueba focalizada de Sidebar colapsado, pointer y teclado.
- [ ] 1.4 Reducir protagonismo de `SidebarInstitutionalArt` sin eliminarla y preservar acciones inferiores; verificar en altura reducida que ilustración, `Ver sitio público` y `Cerrar sesión` no quedan inaccesibles.

## 2. Header y controles reales

- [ ] 2.1 Refinar Header sticky dentro de `ErpLayout` con jerarquía búsqueda pasiva, contexto de ubicación y separación de controles; verificar que Header no agrega título ni acción ficticia de página.
- [ ] 2.2 Conservar búsqueda como estado explícitamente no disponible, sin convertirla en input ni asociarla a endpoint; verificar semántica y ausencia de submit, navegación o resultados simulados.
- [ ] 2.3 Ajustar presentación de `NotificationCenter` y `ProfileMenu` solo en límites necesarios, preservando consultas, mutaciones, acciones, teclado y estados actuales; verificar pruebas focalizadas de notificaciones y menú de cuenta.
- [ ] 2.4 Confirmar que overlays usan primitivas Base UI/shadcn existentes y foco visible sin reimplementación manual; verificar Escape, cierre, retorno de foco y que no se usa una nueva dependencia.

## 3. Responsive y accesibilidad

- [ ] 3.1 Refinar drawer móvil existente y comportamiento tablet/desktop sin alterar rutas ni permisos; verificar a 320×568, 375×667, 768×1024, 1024×768 y 1440×900 ausencia de overflow horizontal y una jerarquía de una fila en Header.
- [ ] 3.2 Verificar con teclado orden de foco, skip link, foco visible no oscurecido, nombres de controles y estados `aria-current`/`aria-expanded`; añadir o actualizar pruebas focalizadas donde el contrato sea automatizable.
- [ ] 3.3 Verificar contraste de navegación, acentos por área, foco ocre y logout; registrar valores/fallos reales y conservar indicadores redundantes cuando color comunique estado.
- [ ] 3.4 Probar nombres/roles largos, grupos extensos, última opción del scroll, contador `99+`, estado de notificaciones loading/error/vacío y `prefers-reduced-motion`; verificar que acciones esenciales siguen alcanzables.

## 4. Contratos y validación integrada

- [ ] 4.1 Revisar que `erpNavigation.ts`, `AppRoutes.tsx`, `InternalErpRoute.tsx`, `RoleRoute.tsx`, `access.ts`, servicios API y backend no cambien; verificar navegación filtrada, deep-link sin capacidad → `/403` y cuenta comunitaria fuera del ERP.
- [ ] 4.2 Ejecutar validaciones frontend autorizadas: `npm run test -- --run src/app/layouts/ErpLayout.test.tsx src/features/notifications/ui/Notifications.test.tsx`, `npm run check:architecture`, `npm run lint`, `npm run build` o `npm run verify`; registrar salida real como `PASSED`, `FAILED` o `NOT_VERIFIED`.
- [ ] 4.3 Revisar `git diff --check` y diff final para confirmar que el incremento queda limitado al shell, sus pruebas y artefactos OpenSpec; verificar ausencia de cambios a módulos ERP, rutas, RBAC, backend, Prisma, APIs y dependencias.

## Workflow follow-up

- Solicitar revisión y autorización explícita antes de Apply.
- Archivar únicamente tras completar tareas, evidencia visual responsive y validación técnica real.
