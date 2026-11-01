# Design

## Composition

`InventoryPageLayout` permanece como shell de la pantalla. El dashboard se organiza en cinco zonas:

1. Encabezado con acciones a artículos y alertas.
2. Banda institucional de indicadores: artículos, stock bajo, préstamos activos y vencidos.
3. Lecturas gráficas: categoría y estado de préstamos.
4. Centro de atención junto a actividad de movimientos.
5. Actividad reciente de movimientos y préstamos, seguida de accesos a reportes e historial.

La composición usa una columna flexible para gráficos y una columna secundaria para atención; en pantallas pequeñas todos los bloques pasan a una columna. Los wrappers de gráficos usan `min-w-0` y `ResponsiveContainer`.

## Data flow

- La consulta de resumen es requisito para montar el contenido principal.
- Consultas auxiliares se ejecutan en paralelo después del resumen y se manejan con `Promise.allSettled`.
- Stock se consulta con página 1 y límite 100 para derivar la distribución visible por categoría; si el total excede la muestra, el texto lo declara.
- Movimientos y préstamos agregados se visualizan desde sus reportes, sin descargar páginas para inventar series temporales.
- Actividad reciente usa las primeras cinco filas de cada endpoint existente y conserva el orden entregado por backend.
- Alertas se muestran desde `InventoryAlerts`; el centro no recrea reglas de negocio en frontend.

## Visual and accessibility decisions

- Verde institucional estructura encabezado e indicadores; ocre/crema comunica atención sin depender solo del color.
- Lucide identifica acciones y tipos de lectura.
- Recharts se limita a barras y dona apropiadas para agregados existentes.
- Cada gráfico tiene nombre accesible y lista o leyenda equivalente.
- Estados de error, carga y vacío usan primitivas compartidas.
- Enlaces mantienen foco visible por `buttonVariants` y etiquetas accionables.

## Failure behavior

Un fallo del resumen conserva el error principal existente. Un fallo de cualquier consulta auxiliar deja disponibles indicadores principales y muestra una advertencia neutral de bloques no disponibles. La ausencia de filas produce un estado vacío específico, no valores de relleno.

## Rollback

Restaurar `InventoryDashboardPage.tsx` y retirar este directorio OpenSpec. No hay cambios de datos ni migraciones.
