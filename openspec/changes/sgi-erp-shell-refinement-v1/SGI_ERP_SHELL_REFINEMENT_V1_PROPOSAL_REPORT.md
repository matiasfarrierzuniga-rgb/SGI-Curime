# SGI_ERP_SHELL_REFINEMENT_V1_PROPOSAL_REPORT

## Estado

**Fase:** PROPOSE. **IMPLEMENTED:** no. **NOT_VERIFIED:** render visual, pruebas y validación frontend no ejecutados. Solo artefactos OpenSpec nuevos.

## 1. Git y ubicación

- Repositorio: `C:\Users\Estudiantes UNA\Desktop\SGI-Curime`.
- Worktree actual: principal; hay worktrees de recuperación e integración listados por Git. No se tocaron.
- Rama / HEAD: `recovery/preclass-functional-20261028` / `a28014298401a4cde2762930822ca5f111223241` (`test(frontend): stabilize Vitest environment`).
- Relación: `HEAD` está 6 commits delante de `origin/development` (`3db741c`); merge-base `9baf2c4`.
- Estado previo: `M frontend/src/test/setup.ts`; `?? frontend/pnpm-lock.yaml`. Cambios ajenos, preservados.
- OpenSpec: raíz local válida; no existía `sgi-erp-shell-refinement-v1`. Crearlo fue seguro porque no había cambios OpenSpec previos detectados. No hubo sincronización, merge, commit, push ni modificación de PR #117/#122.

## 2. Inventario y runtime path

| Responsabilidad | Evidencia |
| --- | --- |
| Shell real | `frontend/src/app/layouts/ErpLayout.tsx` |
| Rutas internas | `frontend/src/app/router/AppRoutes.tsx` → `InternalErpRoute` → `ErpLayout` |
| Navegación / áreas / íconos | `frontend/src/app/navigation/erpNavigation.ts` |
| Sesión | `features/auth/model/AuthContext.tsx` |
| Gate ERP | `features/auth/routing/InternalErpRoute.tsx` |
| Capability route guard | `features/auth/routing/RoleRoute.tsx` |
| Capability list / UI filter | `shared/security/access.ts`; `getErpNavigation()` |
| Notificaciones | `features/notifications/ui/NotificationCenter.tsx` + hooks TanStack Query |
| Primitivas | `shared/ui/button.tsx`, `sheet.tsx`; Base UI Menu/Popover |
| Tokens | `frontend/src/tailwind.css` líneas 54–74, 243–265 |
| Tests existentes | `ErpLayout.test.tsx`, `erpNavigation.test.ts`, `Notifications.test.tsx` |

`AppLayout.tsx` es layout legacy/no consumidor de estas rutas. No entra en alcance.

## 3. Diagnóstico basado en evidencia

### Confirmado por código

- Sidebar desktop fijo: 244 px expandido / 80 px compacto; Header y main recalculan padding/margin con mismo estado.
- Marca, control de colapso, navegación central scrollable, ilustración y acciones inferiores conviven en `ErpLayout`.
- Navegación tiene ocho áreas, acentos por área, rail activo, `aria-current`, `aria-expanded`, nombres alternativos compactos y controles de al menos 44 px en varios casos.
- Drawer móvil ya existe bajo `md`, con Sheet, nombre accesible y cierre al navegar.
- Header sticky ya compone búsqueda no disponible, breadcrumb móvil/tablet, NotificationCenter y menú Base UI.
- Notificaciones tienen datos reales, polling, carga, error recuperable, vacío en inbox, contador y `99+`; no requieren inventarse.
- Sesión, deep links y capacidades se protegen fuera de presentación por `InternalErpRoute` y `RoleRoute`.

### Candidatos de refinamiento; requieren validación visual

- Cabecera del Sidebar es composición monolítica de una línea JSX, con símbolo 56/64 px, nombre y botón 44/48 px: riesgo de densidad perceptiva, no defecto visual confirmado.
- Áreas usan ocho acentos hard-coded, incluido violeta/rosa para "Desarrollo comunitario"; revisar contraste, consistencia y carga cromática sobre verde antes de cambiarlos.
- Ilustración de 128/144 px más texto ocupa bloque fijo separado del scroll: puede competir con navegación o reducir altura disponible. Debe comprobarse a 568 px y menor.
- Expandir por hover modifica ancho de Sidebar y margen/padding de contenido; requiere revisión de reflow, foco y lectura en tablet.
- Búsqueda es `role="search"` sin campo ni acción y aparece desde `lg`; correcta como no disponible declarada, pero necesita tratamiento visual inequívoco para no parecer input inerte.
- Header combina search/breadcrumb y controles de sesión; revisar truncamiento de nombre/rol, ancho del popover y contador en 320/375.

No se recibieron capturas ni se arrancó entorno. No se afirma saturación, overflow, contraste insuficiente ni bug responsive como hecho.

## 4. Arquitectura y contratos RBAC

- `getErpNavigation(permissionCodes)` filtra item por `capability`, `anyOfCapabilities`, `allOfCapabilities` y elimina secciones vacías.
- `InternalErpRoute`: requiere sesión y `user.canAccessErp`; cuenta comunitaria sin ERP va a `/mi-comunidad`, otra sin acceso a `/servicios`.
- `RoleRoute`: directa sin capacidad → `/403`; navegación visual no sustituye esta capa ni API backend.
- Header y Sidebar leen sesión desde `useAuth`; notificaciones son server state en TanStack Query. No duplicar en estado local.
- Preservar capacidades/rutas actuales, incluidas `erp.dashboard.read`, `inv.inventory.read`, `fin.*`, `adm.*`, `usr.*`, `ent.ventures.read`, `vol.opportunities.read`, `aud.logs.read`, `res.reservations.read`, `don.donations.read` y `pub.events.manage`.

## 5. Propuesta Sidebar V1

**Expandido (≥1024 cuando espacio suficiente):** 248–260 px. Marca fija: símbolo 48–52 px, "SGI-Curime" + "ADI Curime", botón 48 px. Área central scrollable única: título de área, 8 px hacia enlaces, 20–24 px entre áreas; ícono 20–24 px y enlace 48 px. Activo: rail, superficie suave, peso y `aria-current`; no color único.

**Colapsado (tablet/acción explícita):** 80–88 px. Símbolos 44–48 px, nombre accesible, tooltip visual opcional; solo destino activo o primer destino por área conforme comportamiento existente. Hover no será única vía de expansión: botón y teclado permanecen suficientes.

**Móvil:** drawer existente; Header conserva disparador ≥44 px. Sheet debe contener foco, cerrar con Escape, cerrar tras navegación y conservar `Ver sitio público`/logout.

**Firma inferior:** conservar paisaje y tríada "Comunidad · Organización · Desarrollo" pero reducir su altura/prioridad cuando viewport sea corto. Acciones globales quedan separadas, persistentes o alcanzables al final, nunca suprimidas.

**Estados:** default texto blanco; hover superficie verde; active rail + superficie + label; focus ocre con 3 px/offset; disabled solo donde contrato real lo produzca, usando semántica nativa y texto no interactivo.

## 6. Propuesta Header V1

- **Desktop:** sticky 72–76 px, búsqueda pasiva 320–480 px máximo, divisor sutil, notificación 40–44 px, perfil con avatar, nombre y rol. No insertar H1 ni CTA de página.
- **Tablet:** Sidebar colapsable; breadcrumb compacto `Área de gestión / Página`; búsqueda oculta; notificación y cuenta conservadas.
- **Smartphone:** drawer trigger, breadcrumb truncable, notificación y avatar. No forzar nombre/rol si rompe fila; menú conserva identidad completa.
- **Dropdown cuenta:** superficie elevada 288 px aprox., identidad, perfil, cambiar contraseña, separación y logout. Base UI conserva keyboard/Escape.
- **Notificaciones:** mantener popover de ancho actual adaptable, carga, error + reintentar, vacío/datos reales. Badge conserva número pero su label anuncia no leídas.
- **Búsqueda:** superficie pasiva, texto "Buscar en el sistema…" y comunicación no disponible; no simular input, resultados ni atajos.

## 7. Responsive y accesibilidad verificable

| Tamaño | Comprobar |
| --- | --- |
| 320×568 | Sin overflow X; drawer, popovers y menú dentro viewport; acciones alcanzables |
| 375×667 | Header una línea; badge no tapa Bell; breadcrumb/name truncan correctamente |
| 768×1024 | Sidebar compacto operable por teclado; foco y tooltip/nombre disponibles |
| 1024×768 | Scroll interno alcanza último módulo; arte y acciones no ocultan foco |
| 1440×900 | Sidebar expandido, búsqueda proporcionada, contenido no comprimido |
| Altura reducida | Último ítem y acciones globales recuperables; foco no queda bajo Header/footer |

Todos: contraste AA; `aria-label` icon-only; `aria-current` y `aria-expanded`; 44×44 px objetivo táctil; color no único indicador; `prefers-reduced-motion`; lector de pantalla para drawer, badge, menú y logout.

## 8. Skills consultadas y aplicación

- `sgi-frontend-design`: identidad institucional, DM Sans, verde/marfil/ocre, sombras/bordes sobrios.
- `sgi-responsive-accessibility`: desktop persistente, tablet colapsable, drawer móvil, foco y nombres accesibles.
- `sgi-frontend-architecture`: preservar AppShell/configuración/logic fuera de JSX; no reorganizar especulativamente.
- `sgi-dashboard-ux`: Sidebar representa dominios, no pantallas internas; `Ver sitio público` visible.
- `design-taste-frontend`: lectura trust-first institucional; densidad media, movimiento mínimo, no template/glass/gradientes.
- `ui-ux-pro-max`: búsqueda focal confirmó foco visible/no oculto y z-index intencional; aplicado a sticky/overlays.
- `baseline-ui`: primitivas existentes, icon controls nombrados, sin gradientes/motion decorativo, `min-h-dvh`.
- `improve-ui`: separó evidencia runtime de hipótesis visuales; no declaró hallazgos sin render.
- `react-best-practices`, `composition-patterns`: no instaladas/disponibles en catálogo actual; no sustituidas ni instaladas.

## 9. Task list, riesgos y dependencias

Task list completa: `tasks.md`. Riesgos: reflow del hover-expand, contraste de ocho acentos, scroll/foco con viewport corto, overlays sobre Header, y tratamiento de búsqueda para que no prometa función inexistente. Dependencias: `ErpLayout`, navegación, Auth, NotificationCenter, Base UI/shadcn, tokens ERP y aprobación de revisión visual; ninguna dependencia nueva.

## 10. Archivos OpenSpec generados

- `proposal.md`
- `design.md`
- `specs/erp-shell-presentation/spec.md`
- `tasks.md`
- Este reporte.

## 11. Aprobación requerida

**BLOCKED para Apply hasta aprobación explícita del responsable.** Apply debe hacerse en rama dedicada/worktree aislado, con árbol seguro, sin incluir cambios ajenos actuales. Luego: pruebas focalizadas, validación autorizada, QA manual responsive/teclado/lector de pantalla y evidencia real antes de Archive.
