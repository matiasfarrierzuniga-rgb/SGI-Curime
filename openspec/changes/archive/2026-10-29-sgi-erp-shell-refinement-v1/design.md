# Design

## Context

`ErpLayout` contiene Header, Sidebar desktop, drawer móvil, acciones globales, menú de cuenta y composición de contenido. `getErpNavigation(permissionCodes)` filtra destinos y `InternalErpRoute` más `RoleRoute` protegen acceso; esta propuesta no cambia esos contratos. Véase `proposal.md` y `specs/erp-shell-presentation/spec.md`.

La evidencia disponible es código y pruebas focalizadas; no se proporcionó captura ni sesión ejecutada. Hallazgos visuales se clasifican como implementación verificable o hipótesis que requiere revisión manual, no como defecto confirmado por render.

## Goals / Non-Goals

**Goals:**

- Dar al shell una jerarquía institucional sobria: navegación primero, contexto de página segundo, controles de sesión discretos.
- Unificar ritmo de controles, estados y áreas persistentes con tokens ERP existentes.
- Permitir navegación extensa en alturas reducidas sin sacrificar acciones globales.
- Mantener un drawer accesible y un Header que no compita con títulos de página.

**Non-Goals:**

- Alterar `erpNavigation`, React Router, guards, capacidades, APIs, datos de sesión o autorización backend.
- Implementar búsqueda global, cambiar contratos de notificaciones o crear estados sintéticos.
- Rediseñar Dashboard u otros módulos, cambiar marca, agregar dependencias, dark mode o motion decorativo.

## Decisions

### 1. Separar tres zonas de Sidebar

El Sidebar conservará: marca/control fijo superior, región central scrollable de navegación y bloque inferior fijo para acciones globales. La ilustración institucional se retira para liberar espacio vertical a la navegación y acciones reales.

En expandido: 248–260 px; marca con símbolo de 48–52 px, nombre y descriptor; navegación con secciones separadas por 20–24 px; enlaces de 48 px. En colapsado: 80–88 px; símbolos de 44–48 px, tooltip/nombre accesible; el marcador activo conserva rail, icono y superficie. Se usarán tokens ERP y una sola familia Lucide ya instalada.

**Alternativa descartada:** convertir cada sección en card. Aumenta ruido y compite con navegación densa.

### 2. Conservación de agrupación y active state actuales

Las áreas y el filtrado continuarán definidos en `erpNavigation.ts`. La selección combinará superficie, rail, peso y `aria-current`, no solo color. Acentos por área permanecen como clasificación visual; el ocre queda reservado para foco institucional y atención puntual, no para todos los activos.

**Alternativa descartada:** consolidar áreas, permisos o rutas durante el ajuste visual. Cambiaría comportamiento autorizado y supera alcance.

### 3. Scroll predictible y acciones siempre recuperables

La lista central será único scroll owner dentro del Sidebar desktop y drawer. Se conservará `scrollbar-gutter: stable`; se revisará contraste/anchura de scrollbar mediante estilos existentes o nativos sin introducir apariencia decorativa. Las acciones quedan fuera del scroll para que `Ver sitio público` y `Cerrar sesión` no desaparezcan en menús extensos.

Para viewport muy bajo, la región inferior conserva acciones al final y foco visible; la navegación central absorbe el scroll. Decisión final depende de prueba visual a 568 px y menor altura.

**Decisión aprobada:** retirar la ilustración institucional en todos los breakpoints. No hay una firma decorativa que compita con navegación y acciones esenciales.

### 4. Header por prioridad responsive

Desktop (`lg+`): Header de 72–76 px; contexto de ubicación, separador, notificaciones y cuenta alineados con el ancho actual del Sidebar. No se muestra búsqueda global hasta que exista contrato funcional aprobado. Tablet (`md` a `<lg`): Sidebar colapsable, breadcrumb compacto que informa ubicación y controles de cuenta. Smartphone (`<md`): disparador drawer 44 px+, contexto truncable y controles iconográficos con nombre accesible; nombre y rol no ocupan la fila cuando no hay espacio.

El Header permanece sticky, con superficie elevada y borde sutil. Título/acciones de cada página pertenecen a la región de contenido y no se duplicarán dentro del Header.

**Decisión aprobada:** retirar la búsqueda pasiva. Sin contrato funcional no se muestra superficie, input ni estado simulado de búsqueda.

### 5. Overlays y foco gestionados por primitivas vigentes

Drawer, Popover y Menu conservarán Base UI/shadcn existente. No se reimplementará teclado, Escape ni manejo de foco manualmente. Todo control icon-only conservará nombre accesible; menú/dropdown comunicará estado expandido a través de la primitiva; foco usará `erp-focus` y offset suficiente sobre fondos verde y claro.

**Alternativa descartada:** reemplazar primitivas o añadir librería de componentes. No hay necesidad demostrada y eleva riesgo transversal.

### 6. Movimiento funcional mínimo

Mantener transiciones actuales solo para colapso/expansión y feedback local; máximo 200–250 ms, propiedades de composición y `motion-reduce`. No añadir animación a ilustración, badges o paneles completos.

**Alternativa descartada:** motion decorativo. No comunica estado y compite con aplicación institucional.

## Responsive Acceptance Matrix

| Viewport | Sidebar / Header esperado | Criterio observable |
| --- | --- | --- |
| 320×568 | Drawer; breadcrumb truncable; controles ≥44 px | Sin overflow X; foco, cierre y acciones disponibles |
| 375×667 | Drawer; Header una fila | Badge no cubre icono; menú no sale de viewport |
| 768×1024 | Sidebar colapsable; breadcrumb | Íconos nombrados; hover no es único modo de expandir |
| 1024×768 | Sidebar expandible; Header sin búsqueda si ancho insuficiente | Región nav scrollable; acciones inferiores recuperables |
| 1440×900 | Sidebar expandido; contexto y controles alineados | Contenido no pierde ancho ni compite con Header |
| Altura reducida | Sidebar conserva scroll y foco | Ningún control esencial queda permanentemente inaccesible |

## Risks / Trade-offs

- [Sidebar hover-expand cambia ancho de contenido] → revisar reflow, foco y lectura en 768/1024; preservar transición reducida para `prefers-reduced-motion`.
- [Menú de navegación crece] → usar región central scrollable, conservar acciones fuera de ella y probar último ítem por teclado.
- [Colores de áreas pierden contraste sobre verde] → medir cada encabezado/acento, no asumir que color claro es suficiente.
- [Overlay sobre Header sticky] → verificar escala z vigente y foco no oculto para drawer, notificaciones y menú.
- [Se solicita búsqueda sin contrato] → mantener Header sin superficie de búsqueda hasta aprobación funcional.
- [Texto largo de nombre/rol] → truncar visualmente sin borrar nombre accesible ni romper layout.

## Verification evidence

- Aprobación visual humana del refinamiento Sidebar y Header V1 recibida durante cierre. No sustituye evidencia desagregada de la matriz manual de viewport, contraste y lector de pantalla; esas comprobaciones permanecen pendientes en `tasks.md`.
- Contraste WCAG 2.2: las etiquetas de área (`text-caption`, texto normal) se midieron contra el peor fondo del Sidebar `#075442`; umbral AA 1.4.3 = 4.5:1. Cyan `#75B9FF` → `#89C3FF` (4.30 → 4.80), terracotta `#F19A60` → `#F4AF81` (4.05 → 4.79) y violet `#B69AF1` → `#C9B5F5` (3.77 → 4.84). Los ocho acentos finales: lime 5.79, green 4.80, cyan 4.80, blue 4.59, teal 5.14, maize 6.11, terracotta 4.79 y violet 4.84.
- Indicadores de foco: ocre `#C98A2D` conserva 3.04:1 sobre Sidebar (WCAG 1.4.11 para componentes UI ≥3:1); superficies claras usan verde institucional `#064C3C` (9.97:1 sobre blanco) para evitar el 2.93:1 del ocre. Texto logout `#FEE2E2` sobre fondo compuesto `#1D4B3C` mide 8.09:1.

## Migration Plan

1. Confirmar rama dedicada aprobada y árbol limpio o worktree aislado antes de Apply.
2. Ajustar composición visual dentro de `ErpLayout` y reutilizar primitivas existentes; no mover contratos funcionales.
3. Actualizar pruebas focalizadas de layout, navegación y notificaciones para contratos preservados.
4. Ejecutar validación autorizada y revisión manual de matriz responsive/teclado/lector de pantalla.
5. Rollback: revertir únicamente commit del cambio; no hay migración de datos, API, ruta ni permiso.
