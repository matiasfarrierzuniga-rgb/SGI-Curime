# Design

## Context

See `proposal.md` for motivation and scope. Esta exploración inspeccionó archivos TSX/JSX no-test bajo `frontend/src`, rutas en `AppRoutes.tsx`, navegación ERP, `frontend/src/shared/ui/`, `frontend/src/tailwind.css`, `frontend/AGENTS.md`, `frontend/CONVENTIONS.md` y el cambio DS-F2 existente.

El código actual presenta tres capas visuales:

```text
DS-F1 tokens / DS-F2 primitives
        ├── Input, Select, Textarea, FormField, Button, StatusBadge, Pagination
        ├── DataTable (adoptado por Users y Reservations)
        └── SearchFilterBar (adoptado por UserFilters)

Implementaciones locales
        ├── tablas HTML con contratos propios
        ├── inputs/selects/textareas nativos con clases repetidas
        ├── filtros legacy (.filters, .card, .actions)
        └── botones nativos e iconos con semántica variable
```

### Inventory method and counts

Conteo estático de instancias JSX en archivos de implementación no-test; no cuenta imports, definiciones HTML internas de primitives como consumidores, líneas repetidas, datos runtime ni tests. La suma global detectada es:

| Tipo | Cantidad | Evidencia principal |
|---|---:|---|
| Declaraciones `<table>` locales | 22 | 20 archivos; `FinancialDashboardPage` y `InventoryItemsPage` tienen 2 cada uno |
| Consumidores `DataTable` | 2 | `features/users/ui/UsersTable.tsx`, `features/reservations/ui/ReservationAdminPage.tsx` |
| Tablas renderizadas declaradas en consumidores | 24 | 22 locales + 2 `DataTable`; `shared/ui/DataTable.tsx` renderiza la primitive |
| `<input>` nativo | 57 | Superficie administrativa/internal de 67 archivos inspeccionados |
| `<select>` nativo | 27 | Superficie administrativa/internal |
| `<textarea>` nativo | 15 | Superficie administrativa/internal |
| `Input` compartido | 63 | Superficie administrativa/internal |
| `Select` compartido | 20 | Superficie administrativa/internal |
| `Textarea` compartido | 9 | Superficie administrativa/internal |
| `DatePicker` | 1 | `ReservationAdminPage.tsx` |
| `Button` compartido | 187 | Superficie administrativa/internal |
| `<button>` nativo | 62 | Superficie administrativa/internal |
| `Pagination` | 19 | Superficie administrativa/internal |
| `StatusBadge` | 29 | Superficie administrativa/internal |
| `Badge` | 9 | Superficie administrativa/internal |
| `SearchFilterBar` | 1 | `features/users/ui/UserFilters.tsx` |

Los conteos de controles incluyen componentes de diálogo y formularios consumidores; incluyen algunas superficies internas no administrativas puras para no ocultar duplicación compartida. La matriz de migración separa explícitamente excepciones.

### UX quality alignment

Las skills disponibles fueron leídas antes de incorporar criterios. Se adoptan solo recomendaciones compatibles con arquitectura, identidad y DS-F1/DS-F2:

| Fuente | Criterio incorporado | Límite aplicado |
|---|---|---|
| `sgi-frontend-design` | Jerarquía clara, DM Sans y escala/tokens existentes, radios y sombras moderados, lenguaje de acción en voz activa, vacíos y errores accionables | No se agrega branding, fuente, gradiente ni decoración nueva |
| `sgi-responsive-accessibility` | Teclado, foco visible, labels, landmarks, nombres accesibles, contraste, estados disabled, errores asociados, mobile sin overflow accidental y reduced motion | Se conserva el shell y sus rutas actuales |
| `sgi-forms-validation` | Menos escritura, autocomplete, errores inline, backend como verdad, bloqueo de doble envío, conservación de valores y mensajes accionables | No se duplican reglas de backend ni se cambian payloads |
| `sgi-dashboard-ux` | Contexto de módulo, acciones visibles y truthful, capacidades como fuente de visibilidad | No se rediseña AppShell, Sidebar ni navegación |
| `sgi-frontend-architecture` / `sgi-development-foundation` | Reutilizar patrones existentes, extraer solo duplicación demostrada, mantener `app -> features -> shared`, aislar red y probar éxito/error | No se agrega biblioteca ni abstracción genérica por anticipación |
| `frontend/.agents/skills/accessibility` | Objetivo WCAG 2.2 AA, contraste 4.5:1/3:1, foco no oculto, 24 px mínimo y 44 px recomendado, nombres de iconos, auditoría axe + teclado | axe/Lighthouse complementan; no sustituyen revisión humana |
| `frontend/.agents/skills/shadcn` / `tailwind-css-patterns` | Usar primitives existentes, tokens semánticos, composición con `gap`, mobile-first, `cn()` para clases condicionales y evitar arbitrary values innecesarios | El proyecto usa Base UI y primitives locales; no se instala/reemplaza shadcn |
| `frontend/.agents/skills/tailwind-v4-shadcn`, `vite`, `vitest` | Preservar Tailwind v4/CSS-first y usar Vitest/Vite en pruebas focalizadas y gates existentes | No cambiar configuración durante Explore |

### UX acceptance matrix

Esta matriz convierte la intención UX en evidencia de Apply/Verify, con prioridad para personas con poca familiaridad informática:

| Superficie | Criterio verificable | Evidencia mínima | No conformidad |
|---|---|---|---|
| Tablas administrativas | Encabezados y acciones se entienden sin hover; filas tienen foco; status tiene texto; muchas columnas tienen overflow identificado o vista compacta | Prueba DOM/axe + teclado + revisión 320/375/768/1024/1440 | acción solo icono/color, tabla recortada o encabezado ambiguo |
| Formularios | Cada campo tiene label; ayuda/error inline asociado; lenguaje simple; autocomplete pertinente; valores sobreviven error; submit único con busy | Tests de FormField/feature + escenario de error/retry | placeholder usado como label, pérdida de datos o doble submit |
| Búsquedas/filtros | Se explica campo consultado y momento de aplicación; filtros activos visibles; limpiar es claro; cero resultados orienta | Test de cambio/reset/paginación + revisión de copy | botón desalineado, filtro silencioso, parámetros inventados |
| Vacío/carga/error | Estados son distintos, visibles y accesibles; error ofrece reintento válido; vacío explica siguiente paso | Tests de estados + `role=status`/`alert` | spinner sin contexto, datos viejos presentados como actuales o error vago |
| Navegación/acciones | Título y contexto identifican módulo; verbos indican resultado; acción primaria domina; destructivas explican consecuencia y confirman | Teclado + revisión de texto + rutas directas protegidas | jerarquía igual para todas acciones, acción técnica o guard bypass |
| Experiencia móvil | No hay overflow accidental; filtros/dialogs reflowan; acciones esenciales quedan alcanzables; foco no queda bajo overlay | Capturas/revisión manual por viewport + teclado | scroll de página bloqueado, botones fuera de pantalla o tabla ilegible |
| Accesibilidad | WCAG AA objetivo: foco visible/no oculto, contraste, target mínimo 24/recomendado 44, nombres, semántica, no color-only, reduced motion | axe focalizado + accessibility tree/lector + teclado | PASS basado solo en score automatizado |

### User-centered interaction rules

- Nombrar acciones por resultado: `Guardar cambios`, `Reintentar`, `Limpiar filtros`, `Ver detalle`; evitar `Enviar`, `Procesar` o iconos ambiguos cuando el resultado no sea obvio.
- Mantener el mismo verbo en botón, confirmación, estado busy y éxito para reducir aprendizaje accidental.
- Mostrar primero contexto y decisión requerida; reservar detalles técnicos para ayuda o detalle, no para títulos y acciones principales.
- Tratar vacío como orientación: explicar si no existen datos, si no hubo coincidencias o si la persona debe crear/ajustar algo.
- Tratar errores como recuperación: indicar qué falló, qué puede hacer la persona y conservar datos cuando el flujo sea formulario.

### Table inventory

| Archivo/componente | Consumidor/ruta | Implementación | Reutilizable actual | Riesgo | Prioridad |
|---|---|---|---|---|---|
| `features/users/ui/UsersTable.tsx` | Usuarios `/admin/users` | `DataTable` + acciones/menu local | `DataTable`, `Badge`, `Button` | Medio: menú/foco y columnas | P1 |
| `features/affiliates/ui/AffiliatesTable.tsx` | Afiliados `/app/admin/affiliates` | HTML local | `StatusBadge`, `Button` | Bajo/medio: payload estable | P0 |
| `features/affiliate-requests/ui/AffiliateRequestsTable.tsx` | Solicitudes afiliación `/app/admin/requests` | HTML local | `StatusBadge`, `Button` | Medio: contrato funcional existente | P0 |
| `pages/admin/UserRequestsPage.tsx` | Solicitudes cuenta `/admin/user-requests` | HTML local + avatar local | `StatusBadge`, `Pagination`, `Button` | Alto: preservar flujo de revisión | P0 |
| `features/absence-justifications/ui/AbsenceJustificationsPage.tsx` | Justificaciones administrativas | HTML local | `StatusBadge`, `Pagination`, `Button` | Medio | P1 |
| `features/absence-justifications/ui/AffiliateJustificationsPage.tsx` | Historial personal interno | HTML local | Ninguno para tabla | Medio; no es admin puro | P2/excepción |
| `features/donations/ui/DonationsPage.tsx` | Donaciones `/app/donations` | HTML local + cards mobile | `Pagination`, `Button` | Medio: dual desktop/mobile | P2 |
| `features/entrepreneurship/ui/VenturesPage.tsx` | Directorio admin | HTML local + cards mobile | `StatusBadge`, `Pagination`, `Button` | Bajo/medio | P2 |
| `features/events/ui/EventsManagementPage.tsx` | Eventos `/app/events` | HTML local | `Badge`, `Button` | Medio: acciones workflow | P2 |
| `features/volunteering/ui/OpportunitiesPage.tsx` | Voluntariado admin | HTML local + cards mobile | `StatusBadge`, `Pagination`, `Button` | Bajo/medio | P2 |
| `features/institutional-board/ui/InstitutionalBoardPage.tsx` | Junta Directiva | HTML local | `Input`, `Select`, `Button` | Alto: reglas/person-first | P2 |
| `features/financial/ui/FinancialDashboardPage.tsx` | Dashboard financiero | HTML local + tabla accesible de gráfico | `StatusBadge` | Alto: mantener alternativa accesible | P1 |
| `features/financial/ui/FinancialMovementsPage.tsx` | Movimientos financieros | HTML local responsive por container | `StatusBadge`, `Pagination`, `Button` | Medio: columnas progresivas | P1 |
| `features/financial/ui/FinancialPage.tsx` | Cargos/pagos | HTML local | `StatusBadge`, `Pagination`, `Button` | Alto: pago condicionado por capability | P1 |
| `features/financial/ui/DinadecoAnnualReportPage.tsx` | Reporte DINADECO | HTML local de reporte | Ninguno para tabla | Alto: reporte, no CRUD | P2/excepción |
| `features/institutional-board/ui/InstitutionalBoardPage.tsx` | Junta Directiva | HTML local | `Input`, `Select`, `Button` | Alto: reglas de dominio | P2 |
| `pages/admin/AuditLogsPage.tsx` | Bitácora `/admin/audit-logs` | HTML local legacy + controles nativos | `Pagination`, `Modal` | Alto: archivo compacto legacy | P1 |
| `pages/inventory/InventoryCategoriesPage.tsx` | Inventario/categorías | HTML local legacy | Ninguno; `.actions`/nativo | Alto: múltiples modales | P1 |
| `pages/inventory/InventoryItemsPage.tsx` | Inventario/artículos | 2 HTML locales legacy | Ninguno; `.actions`/nativo | Alto: acciones y formularios densos | P1 |
| `pages/inventory/InventoryLoansPage.tsx` | Inventario/préstamos | HTML local legacy | Ninguno; `.actions`/nativo | Alto: fechas, búsqueda y estados | P1 |
| `pages/inventory/InventoryMovementsPage.tsx` | Inventario/movimientos | HTML local legacy | Ninguno; `.actions`/nativo | Medio/alto | P1 |
| `pages/inventory/InventoryReportsPage.tsx` | Inventario/reportes | HTML local legacy | Ninguno; `.actions`/nativo | Medio; filtros/reportes | P2 |
| `features/reservations/ui/ReservationAdminPage.tsx` | Reservas `/app/reservations` | `DataTable` + cards mobile | `DataTable`, `DatePicker`, `StatusBadge` | Bajo: piloto reusable | P1/reference |

Nota: `DataTable` itself is shared infrastructure, not an additional consumer row. La cuenta administrativa es 23 de 24 tablas; el historial personal se conserva como excepción hasta que exista PBI explícito.

### Control and duplication map

| Patrón | Compartido existente | Duplicación observada | Riesgo visible |
|---|---|---|---|
| Texto/búsqueda | `Input`, `SearchInput` | Inventario, auditoría, finanzas y modales usan `<input>` con clases propias | alturas y foco distintos; iconos de búsqueda no tienen wrapper común |
| Select | `Select` | Inventario, auditoría, finanzas y formularios usan `<select>` nativo | padding, flecha, invalid/disabled y alineación divergentes |
| Textarea | `Textarea` | UserRequests, AffiliateRequestDetail, inventario y finanzas usan nativos | min-height, borde y feedback no uniformes |
| Campo/label | `FormField`, Base UI `Field` | labels directos, `Field`, `FormField` y `.filters card` coexisten | asociación y `aria-describedby` varían |
| Tabla | `DataTable` | 22 HTML locales con min-width/padding/radius/hover propios | cabeceras, borde, filas, overflow y estados no equivalentes |
| Acción | `Button` | 62 botones nativos; clases `primary`, `actions`, `min-h-10` | estados loading/focus/disabled y objetivos táctiles distintos |
| Estado | `StatusBadge`, `Badge`, mensajes legacy | estados por color, `Badge` genérico y texto local | semántica y contraste no siempre homogéneos |
| Filtros | `SearchFilterBar` | solo UserFilters lo adopta; AffiliateFilters y solicitudes tienen layouts propios | botones al fondo/alineación cambian entre pantallas |
| Paginación | `Pagination` | 19 usos comparten primitive, pero tablas legacy no comparten layout | separación y contexto pueden variar según contenedor |
| Avatar | ninguno específico | `UserRequestsPage` genera iniciales/tone local | patrón sin contrato compartido; no bloquear P0 |

## Goals / Non-Goals

**Goals:**

- Definir una capa de composición reusable encima de primitives existentes, no un nuevo design system paralelo.
- Hacer equivalentes los contratos de foco, error, disabled, loading, hover, overflow, estados y objetivos táctiles.
- Migrar por lotes con primero Usuarios/Afiliados/Solicitudes y después inventario/finanzas/resto.
- Mantener trazabilidad por archivo, consumidor, riesgo y criterio de aceptación.

**Non-Goals:**

- No rediseñar `ErpLayout`, Sidebar, Header ni navegación.
- No cambiar APIs, TanStack Query, endpoints, rutas, capabilities, permisos, roles, backend o base de datos.
- No sobrescribir ni refactorizar DS-F2 dentro de este cambio sin evidencia de contrato faltante.
- No crear un `shared/ui/UserTable`, `AffiliateTable` u otro primitive con lógica de dominio.
- No imponer tarjetas móviles a reportes o tablas auxiliares accesibles donde overflow sea más fiel.

## Decisions

### 1. Extender primitives; no crear duplicados por dominio

`Input`, `Select`, `Textarea`, `Button`, `StatusBadge`, `Pagination` y `DataTable` siguen siendo fuentes compartidas. Las necesidades comunes se agregan como props/slots o wrappers genéricos; lógica de dominio permanece en features. Se descarta crear una tabla por módulo porque repetiría el problema y rompería `app -> features -> shared`.

### 2. Definir contrato de tabla en dos niveles

`DataTable` será referencia para contenedor, `scope`, encabezado, celdas, fila, overflow, loading/empty/error y paginación. Las tablas con columnas especiales pueden continuar HTML semanticamente equivalente, pero deben cumplir el mismo contrato. La tabla auxiliar de `FinancialDashboardPage` se mantiene como excepción de accesibilidad del gráfico.

### 3. Unificar composición de filtros sin ocultar diferencias de negocio

Se reutilizará la composición de `SearchFilterBar`/`FormField` cuando el filtro sea búsqueda + selects + acciones. Los filtros con aplicación diferida de correo de solicitudes de afiliación conservan su semántica y feedback, pero adoptan geometría común. No se agregan query params ni se altera cuándo se solicita al backend.

### 4. Priorizar controles de bajo riesgo antes de tablas de alto riesgo

P0 corrige defectos de control y filtro en cuatro superficies comparables: `Users`, `Affiliates`, `UserRequests` y `AffiliateRequests`. P1 uniforma tablas y estados en esas superficies y luego inventario/finanzas; P2 extiende módulos restantes; P3 atiende revisión residual responsive/accesible. No se migran simultáneamente reglas institucionales de Junta/Asambleas.

### 5. Iconos requieren wrapper y nombre, no estilos aislados

Los iconos de búsqueda y acciones deben quedar en composición estable (`relative` + affordance no superpuesta) y el control interactivo debe ser `Button` o equivalente semántico. El icono no recibirá hover independiente que tape el control ni reemplazará el nombre accesible.

### 6. Validación por evidencia y por viewport

Cada lote tendrá pruebas focalizadas y revisión manual en 320/375/768/1024/1440 px, teclado, foco, lector de pantalla, contraste y overflow. `npm run verify` no se ejecuta en Explore; queda reservado para APPLY/VERIFY autorizado. Ninguna observación visual se marca como PASSED sin evidencia.

## Migration Plan

```text
P0  Controls + filters
    Users / Affiliates / UserRequests / AffiliateRequests
          ↓
P1  Tables + states
    same four → Inventory legacy → Financial lists
          ↓
P2  Remaining admin modules
    absence, donations, ventures, events, volunteering, board, reports
          ↓
P3  Residual QA
    responsive, keyboard, contrast, exception review, docs
```

1. Congelar el inventario y registrar baseline de clases/estados por lote; no tocar modificaciones DS-F2/UserRequests ajenas.
2. Acordar contrato de tabla/filtros y excepciones antes del primer Apply.
3. Migrar P0 con cambios de presentación solamente; mantener APIs, props, callbacks, query keys, capabilities y payloads.
4. Agregar cobertura de estados y accesibilidad; probar rutas directas y acciones protegidas en los módulos afectados.
5. Migrar P1–P2 un módulo por PR/lote, dejando rollback en el último commit verificado.
6. Cerrar P3 con matriz de viewports y revisión de excepciones; no Archive hasta verificar implementación contra esta propuesta.

Rollback: revertir el lote frontend correspondiente al último commit verificado. No hay migración de datos ni rollback backend.

## Risks / Trade-offs

- **Cambios DS-F2 sin integrar completamente** → consumir primitives existentes y declarar dependencia; no reemplazar archivos modificados en el árbol.
- **Tablas locales contienen reglas de presentación móvil y acciones** → separar shell visual de callback/estado; cubrir desktop y mobile antes de retirar markup.
- **UserRequests V2 y solicitudes de afiliación tienen contratos distintos** → mantener pantallas, rutas y capacidades separadas; estandarizar solo superficie.
- **Inventario legacy usa `.filters`, `.card`, `.actions` y botones nativos** → migrarlo después de P0, con snapshot de estados y sin mezclarlo con cambios de API.
- **Tabla financiera accesible puede parecer duplicada** → mantener alternativa HTML explícita para datos del gráfico; documentar excepción.
- **Conteo estático no prueba comportamiento runtime** → reportar cantidades como inventario de código, no como validación funcional.
- **Pruebas completas tienen evidencia histórica de interferencia** → ejecutar focused/serializado en VERIFY autorizado y reportar fallos sin atribuirlos a este cambio sin diff/evidencia.

## Open Questions

- ¿Se aprueba una primitive genérica adicional para avatar/initials? No es necesaria para P0; queda pendiente si más de un módulo demuestra duplicación.

## Resolved Scope Decision

`DataTable` y `ReservationAdminPage` quedan como baseline de comparación y no entran en P0. El primer lote se limita a `Users`, `Affiliates`, `UserRequests` y `AffiliateRequests`, decisión confirmada durante Explore.

## Validation Status

- **Git safety:** VERIFICADO en Explore: rama `feat/design-system-ds-f2`, HEAD `35775f6`, árbol sucio con cambios preexistentes preservados.
- **OpenSpec:** propuesta, spec, design y tasks creados; estado de planificación completo.
- **Código:** inspeccionado; no modificado.
- **Build/verify/tests:** NOT_VERIFIED / no ejecutados por restricción Explore.
