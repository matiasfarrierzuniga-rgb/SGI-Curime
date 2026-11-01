# Inventory Dashboard V2

## Why

La pantalla inicial de Inventarios solo mostraba tarjetas de resumen y enlaces. Esto obligaba a recorrer varias pantallas para detectar reposición, préstamos vencidos y actividad reciente.

## What changes

- Reemplazar la composición visual de `/inventory` por un centro de control operativo.
- Mostrar indicadores reales de artículos, stock bajo, préstamos activos y préstamos vencidos.
- Integrar distribución por categoría, estado de préstamos y actividad de movimientos usando reportes existentes.
- Incorporar centro de atención para reposición y préstamos vencidos, actividad reciente y accesos contextuales.
- Mantener estados de carga, error, vacío y degradación parcial sin presentar datos ficticios.

## Scope

- `frontend/src/pages/inventory/InventoryDashboardPage.tsx`.
- Artefactos de este cambio OpenSpec.
- Reutilización de servicios, tipos, capacidades, tokens, Lucide y Recharts existentes.

## Exclusions

- Backend, Prisma, migraciones, permisos y contratos API.
- Finanzas, Dashboard administrativo, Calendarios y sidebar global.
- Nuevas dependencias, endpoints agregadores o series históricas inventadas.
- Commit, push, PR, merge y archivado de este cambio.

## Data and access

La ruta conserva la protección existente `inv.inventory.read`. Los datos provienen de `inventoryReportsService.summary/stock/movements/loans`, `inventoryAlertsService.get`, `inventoryMovementsService.list` e `inventoryLoansService.list`. Los enlaces solo llevan a rutas existentes del módulo.

## Acceptance criteria

- La pantalla comunica jerarquía operativa clara y conserva identidad institucional SGI-Curime.
- Indicadores y visualizaciones representan exclusivamente respuestas reales disponibles.
- Gráficos incluyen leyenda, tooltip y alternativa textual/listada.
- Layout usa `min-w-0`, contenedores responsivos y no fuerza overflow horizontal con sidebar expandido o contraído.
- Fallos secundarios no ocultan el resumen principal; estados vacíos son explícitos.
- No hay cambios fuera del alcance ni aprobación visual declarada antes de revisión humana.
