# Design

## Context

`/eventos` y `/eventos/:publicId` se renderizan dentro de `PublicLayout` y consumen datos mediante los hooks públicos de eventos. Las pantallas ya poseen estados de carga, error, vacío, evento programado y evento pasado; este cambio ajusta únicamente su presentación.

La dirección aprobada es **Editorial institucional**: marfil, verde bosque, ocre y tipografías/tokens existentes. El formulario público de afiliación aporta referencia de ritmo y contenedores, pero no se reutilizará como plantilla literal.

El análisis seguirá Kendall & Kendall: identificar necesidades de lectura y decisión, organizar salidas según prioridad informativa, revisar la interacción de navegación y evaluar usabilidad mediante escenarios observables en los anchos definidos.

## Goals / Non-Goals

**Goals:**

- Hacer visible antes del primer scroll el propósito de la agenda y la información esencial de cada evento.
- Reducir espacio vertical improductivo sin convertir el portal en una interfaz densa.
- Separar visualmente contenido principal y metadata en el detalle.
- Mantener navegación de retorno, estados existentes, semántica y foco.
- Expresar un comportamiento responsive explícito para 320, 375, 768, 1024 y 1440 px.

**Non-Goals:**

- Cambiar endpoints, modelos, hooks, rutas, permisos o estados de dominio.
- Agregar filtros, búsqueda, paginación, contenido editorial o fotografía externa.
- Modificar `PublicHeader`, `PublicFooter`, `AffiliationPage`, ERP o primitives compartidos.
- Introducir dependencias, animaciones nuevas o migraciones globales de CSS.

## Decisions

### 1. Mantener los límites actuales de feature

La implementación quedará limitada a las dos pantallas de eventos. Se reutilizarán `public-container`, tokens de `tailwind.css`, `LoadingState`, `ErrorState`, `EmptyState` y la presentación de estado de evento ya existente.

**Alternativa descartada:** crear un componente público global de tarjeta o detalle. La evidencia actual no demuestra que un nuevo primitive sea necesario para este único incremento.

### 2. Composición del listado

El listado tendrá una introducción compacta y una región de eventos donde cada unidad mantendrá esta prioridad:

```text
estado → título → resumen → fecha/lugar → ver detalle
```

La acción permanecerá asociada al evento y el contenido se distribuirá para evitar alturas artificialmente grandes. La solución conservará una cuadrícula en anchos amplios y una sola columna en móvil.

**Alternativa descartada:** reemplazar el listado por una tabla cronológica. La tabla favorece densidad, pero contradice el carácter público/editorial y reduce la lectura cómoda de resúmenes.

### 3. Composición del detalle

El detalle conservará el retorno visible al listado. El contenido seguirá un flujo único, con una región de encabezado y resumen, una región distinguible de metadata y una región de descripción cuando exista.

```text
volver a eventos
estado + título + resumen
fecha / lugar
descripción opcional
```

En escritorio se podrá aprovechar una relación principal/secundaria entre contenido y metadata; en móvil todo se apilará en orden de lectura. No se crearán bloques vacíos para campos opcionales ausentes.

**Alternativa descartada:** una única card grande con todos los elementos sin separación. Es la causa principal del aislamiento visual identificado durante Explore.

### 4. Responsive y accesibilidad

- 320 y 375 px: una columna, acciones con área táctil mínima de 44 px y texto sin clipping.
- 768 px: dos columnas solo cuando cada columna conserve medida legible.
- 1024 px: composición amplia sin forzar el menú público a una densidad ilegible.
- 1440 px: contenido centrado y limitado, evitando líneas de texto excesivamente largas.
- Mantener HTML semántico, títulos jerárquicos, enlaces con nombres claros, foco visible y estados anunciados.
- No agregar animación; las transiciones existentes deben respetar reducción de movimiento.

### 5. Método de evaluación de salida e interacción

La revisión manual se organizará por tareas de usuario:

1. Encontrar rápidamente el próximo evento.
2. Identificar fecha, hora y lugar.
3. Abrir el detalle.
4. Leer descripción completa.
5. Regresar a la agenda.
6. Entender ausencia de eventos, error o evento pasado.

Cada tarea se revisará en los cinco anchos definidos, considerando jerarquía, esfuerzo de escaneo, claridad de affordances, foco y ausencia de overflow.

## Risks / Trade-offs

- [Resumen largo puede desequilibrar tarjetas] → mantener prioridad visual estable y validar con longitudes distintas sin ocultar información esencial.
- [Contenido opcional ausente puede crear huecos] → renderizar únicamente regiones respaldadas por datos.
- [Breakpoint personalizado de 375 px] → validar explícitamente 320 y 375; no asumir breakpoints Tailwind estándar.
- [Cascada legacy de `index.css`] → mantener cambios locales y reportar cualquier bloqueo antes de ampliar alcance.
- [Diseño editorial puede volverse demasiado espacioso] → usar el formulario de afiliación como referencia de ritmo y revisar el contenido antes del primer scroll.

## Migration Plan

1. Ajustar composición del listado público.
2. Revisar estados de listado en los cinco anchos.
3. Ajustar composición del detalle y navegación de retorno.
4. Revisar estados de detalle, metadata opcional y evento pasado.
5. Ejecutar validación focalizada autorizada y comparar contra los criterios de la especificación.

Rollback: revertir los cambios presentacionales de las dos pantallas; no existe migración de datos ni rollback de API.

## Open Questions

Ninguna. Las decisiones visuales necesarias quedaron definidas en Explore y no requieren alterar los contratos existentes.
