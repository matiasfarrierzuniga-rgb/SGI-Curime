# Proposal

## Why

El frontend administrativo ya dispone de tokens institucionales y primitives compartidos, pero su adopción convive con tablas HTML, controles nativos, estilos legacy y patrones locales. Esa mezcla produce diferencias verificables en altura, padding, radios, foco, hover, filtros, overflow y mensajes de error; también eleva el costo de corregir accesibilidad y responsive por módulo.

El inventario está justificado ahora porque DS-F2 ya dejó un contrato reutilizable para `Input`, `Select`, `Textarea` y `FormField`, mientras los módulos administrativos siguen implementando variantes paralelas. La estandarización debe ser incremental y preservar contratos de API, rutas, capacidades, ERP Shell y cambios DS-F2/UserRequests existentes.

## What Changes

- Establecer un contrato visual y de comportamiento para controles, filtros, botones, estados, paginación y tablas administrativas basado en tokens DS-F1/DS-F2.
- Consolidar una superficie reutilizable para tabla/listado, filtros, estados, acciones, badges y paginación; extender primitives existentes solo cuando el inventario demuestre una necesidad común.
- Migrar progresivamente implementaciones locales de Usuarios, Afiliados, Solicitudes de registro, Solicitudes de afiliación y módulos administrativos priorizados, sin cambiar payloads, endpoints, rutas, permisos ni reglas de negocio.
- Corregir primero defectos visibles de alineación, foco, hover, overlay de iconos, estados disabled/loading/error y overflow horizontal; después uniformar tablas y extender el patrón al resto de módulos.
- Definir excepciones justificadas para tablas densas, reportes financieros, tablas accesibles auxiliares y formularios con comportamiento especializado.
- Añadir pruebas focalizadas de primitives, estados, teclado, accesibilidad y responsive; dejar la verificación completa para APPLY/VERIFY autorizado.
- Incorporar criterios UX verificables para personas con poca familiaridad informática: lenguaje claro, acciones predecibles, prevención de doble envío, feedback accionable, reducción de escritura, experiencia móvil completa y WCAG 2.2 AA como objetivo.
- Mantener fuera de alcance ERP Shell, backend, base de datos, autenticación, autorización, rutas, dependencias nuevas y cambios funcionales del registro comunitario.

## Capabilities

### New Capabilities

- `design-system/ui-consistency`: contratos reutilizables y verificables para presentación, interacción, accesibilidad y responsive de superficies administrativas.

### Modified Capabilities

- Ninguna. `affiliate-requests` y `erp-shell-presentation` ya contienen contratos funcionales/autorizativos; este cambio los conserva y no redefine sus requisitos de negocio o shell.

## Impact

- **Frontend:** `frontend/src/shared/ui/`, tokens en `frontend/src/tailwind.css`, y consumidores administrativos bajo `frontend/src/features/`, `frontend/src/pages/admin/`, `frontend/src/pages/inventory/` y `frontend/src/pages/erp/`.
- **Inventario medido:** 24 declaraciones de tabla renderizada en `frontend/src` no-test (22 tablas HTML locales y 2 consumidores de `DataTable`; `DataTable` es la primitive que renderiza las 2 últimas); 23 pertenecen a superficies administrativas/ERP y 1 a historial personal interno. El alcance administrativo/internal inspeccionado comprende 67 archivos TSX/JSX, incluidos diálogos y formularios consumidores.
- **Controles medidos en esa superficie:** 57 inputs nativos, 27 selects nativos, 15 textareas nativos, 63 `Input`, 20 `Select`, 9 `Textarea`, 1 `DatePicker`, 187 `Button`, 62 botones nativos, 19 `Pagination`, 29 `StatusBadge`, 9 `Badge` y 1 `SearchFilterBar`.
- **Contratos preservados:** APIs HTTP, modelos, payloads, capabilities, guards, rutas, server state TanStack Query y autoridad backend.
- **Dependencia principal:** DS-F2 (`sgi-ds-f2-institutional-forms`) aporta primitives y contrato de formularios; no se sobrescriben sus archivos ni se absorben sus cambios sin revisión.
- **Estado:** propuesta basada en inspección de código; no se ejecutaron build, verify ni pruebas completas durante Explore.
