# Design

## Context

Ver `proposal.md` y `specs/administrative-affiliates-presentation/spec.md`. El contrato actual ofrece `GET /affiliates` con `search`, `status`, `page` y `limit`; detalle; edición; activación y desactivación. `AffiliatesPage` fija límite 20 y los componentes actuales muestran una tabla desplazable, un modal por secciones y confirmación existente. La referencia obligatoria es `C:\Users\Estudiantes UNA\Downloads\Panel administrativo de afiliados en SGI-Curime.png`.

El wireframe añade composición aprobada y regiones que no tienen respaldo de API o modelo. Los límites de Apply deben conservar `api/`, hooks TanStack Query, modelos, rutas, capability y semántica de las mutations.

## Goals / Non-Goals

**Goals:**

- Traducir fielmente las tres vistas aprobadas —desktop, detalle/confirmación y móvil— a la feature existente.
- Mantener datos reales, estados asíncronos y accesibilidad de controles, overlays y navegación.
- Hacer explícita toda diferencia entre referencia visual y contrato funcional antes de editar código.
- Permitir validación reproducible en 1440, 1024, 768, 390 y 320 px.

**Non-Goals:**

- Crear `POST /affiliates`, ampliar filtros, observaciones, acciones contextuales o paginación variable.
- Alterar `EditAffiliateModal`, backend, Prisma, RBAC, auth, nombramientos o rutas.
- Rediseñar AppShell, sidebar, topbar o primitives compartidos.
- Cambiar dominio o comportamiento de `/afiliacion` y SGI-FORMS-V1.

## Decisions

### 1. Límite de implementación y propiedad

Apply se limita a:

- `frontend/src/features/affiliates/ui/AffiliatesPage.tsx`
- `frontend/src/features/affiliates/ui/AffiliateFilters.tsx`
- `frontend/src/features/affiliates/ui/AffiliatesTable.tsx`
- `frontend/src/features/affiliates/ui/AffiliateDetailsModal.tsx`

El primer incremento verificará si `EditAffiliateModal.tsx` puede permanecer intacto; no se modifica para mejorar apariencia indirecta. Las API, hooks, modelos y shared UI no cambian.

**Razón:** brecha confirmada es composición de feature; contratos y primitives ya contienen data fetching, focus trap, scroll lock, estado busy y paginación.

**Alternativa descartada:** rediseñar `Modal`, `ConfirmDialog`, `Pagination` o AppShell para igualar una única pantalla. Aumentaría blast radius y riesgo para trabajo paralelo.

### 2. Composición desktop aprobada

Dentro de la región de contenido que aporta AppShell, `AffiliatesPage` organizará: breadcrumb/contexto existente, cabecera horizontal, tarjeta de filtros y tarjeta de resultados. La cabecera usa círculo marfil con icono de personas, `text-heading-1`/font heading para “Afiliados”, descripción y acción superior derecha. El botón Registrar afiliado no se presentará como accionable hasta contar con contrato; en Apply debe resolverse según la tabla de dependencias, no simular creación.

Tarjetas: superficie blanca cálida, borde sutil, radio/elevación existentes y separación visual del fondo marfil. El contenido usa gutter 16 px móvil, 24 px tablet y 24–32 px desktop; densidad de tabla y filtros se aproxima a referencia sin tamaños arbitrarios ni tokens nuevos.

### 3. Filtros: contract-first con correspondencia visual explícita

`AffiliateFilters` mantiene búsqueda live y estado como únicos filtros vinculados a query. Diseño: búsqueda amplia, estado, regiones visuales de tipo y fecha, limpiar y Filtrar alineados a la referencia.

Una región sin contrato no puede aparentar que filtra: no usa `disabled` como sustituto silencioso ni expone valores/mock. Apply debe escoger una representación explícita aprobada (por ejemplo, omitir control no soportado y conservar alineación, o mostrarse como dependencia no interactiva con mensaje accesible). La elección requiere aceptación humana si altera fidelidad visible. `Filtrar` tampoco puede sustituir la aplicación live actual sin decisión funcional; búsqueda y estado siguen con comportamiento vigente.

### 4. Resultados, tabla y lista móvil

Desktop usa tabla semántica con columnas del wireframe: nombre/avatar, identificación, contacto, tipo, fecha, estado y acciones. Avatar se deriva determinísticamente de `fullName` y no requiere datos persistidos; texto alternativo no duplica el nombre de la fila. “Ver detalle” conserva el único handler actual.

La acción de elipsis del wireframe no se implementa sin menú y permisos definidos. No se muestra si induce expectativa de acción. A 320–767 px, la tabla se reemplaza visualmente por lista de botones/filas que conserva nombre, identificación, fecha, badge de estado y affordance de detalle; no se exige scroll horizontal de página. A 768–1023 px se puede mantener tabla si columnas siguen legibles dentro de contenedor focalizable; si no, se aplica lista antes del overflow.

Paginación conserva `page`, `total` y `limit=20`; puede reubicarse dentro de tarjeta y adoptar botones/número visuales solo si no inventa salto de página o límite seleccionable.

### 5. Detalle y confirmación

`AffiliateDetailsModal` conserva `useAffiliateDetail`, mutations y protección anti doble envío. La cabecera del modal presenta avatar, nombre, fecha de afiliación y badge. Las pestañas se implementan solo para contenido que el contrato ya expone: “Información general” muestra datos personales y afiliación; “Contacto y actividad” muestra datos existentes. “Observaciones” no puede crear una pestaña con contenido simulado ni persistencia; se trata como dependencia bloqueante de fidelidad o se declara “No disponible” solo con aprobación explícita de copy/UX.

La zona de contenido debe tener `max-height` dependiente de viewport y `overflow-y-auto`, preservando cabecera y acciones accesibles. Acciones existentes permanecen: Editar y Activar/Desactivar. La confirmación reutiliza `ConfirmDialog` y conserva una explicación clara, aviso informativo no contractual y botón danger cuando corresponde; el backend sigue siendo fuente de verdad ante conflictos.

### 6. Accesibilidad, estados y responsive

- DOM semántico: `table` para desktop; lista con controles nombrados para móvil; no duplicar elementos interactivos entre breakpoints.
- Uso de labels/aria existentes, foco visible, hover/focus/disabled y contraste con tokens SGI.
- `Modal` existente mantiene foco, Escape, click exterior y body scroll; cambios locales no rompen su stack.
- `aria-live` de paginación y feedback loading/error/empty permanecen disponibles.
- Breakpoints: 1440/1024 desktop, 768 tablet, 390/320 móvil. Ningún control clave debe perder etiqueta o requerir color como único estado.

### 7. Matriz de correspondencia visual y contrato

| Referencia aprobada | Destino Apply | Estado de contrato | Decisión de implementación |
|---|---|---|---|
| Círculo, icono, título y descripción | `AffiliatesPage` | existente | Reproducir composición y jerarquía con tokens vigentes. |
| Registrar afiliado | cabecera | **sin `POST /affiliates`** | Dependencia; no crear CTA funcional ni modal ficticio. |
| Búsqueda y Estado | `AffiliateFilters` | existente | Conservar consulta live y reset de página. |
| Tipo de afiliado | filtros | campo existe, filtro no | Dependencia; no enviar parámetro. |
| Desde/Hasta | filtros | fecha existe, filtro no | Dependencia; no enviar parámetros. |
| Filtrar | filtros | no existe submit aplicado | Dependencia; no cambiar live filtering sin decisión. |
| Limpiar | filtros | existente | Reproducir estilo y conservar limpieza de filtros soportados. |
| Tabla, avatar, contacto, badges | `AffiliatesTable` | existente | Reproducir; avatar derivado de nombre. |
| Elipsis contextual | tabla | sin menú/acciones contrato | Omitir; no sustituir por acción ambigua. |
| Paginación con selector de cantidad | página/paginación | pages existe; selector no | Reubicar/estilizar paginación; no crear selector. |
| Detalle, Editar, Activar/Desactivar | `AffiliateDetailsModal` | existente | Reproducir estructura y conservar mutations. |
| Observaciones | detalle | sin campo/endpoint | Dependencia; no simular pestaña con datos. |
| Confirmación desactivar | `ConfirmDialog` vía detalle | existente | Reproducir copy y énfasis danger localmente. |
| Lista móvil | `AffiliatesTable` | mismos datos existentes | Añadir representación responsive sin nuevo contrato. |

### 8. Plan incremental de Apply

1. **Baseline aislado:** confirmar contratos, captura baseline y aislar los cuatro archivos autorizados; detenerse si SGI-FORMS-V1 introduce cambios en ellos.
2. **Estructura principal:** cabecera, tarjetas, filtros existentes y resultados/paginación dentro de `AffiliatesPage`/`AffiliateFilters`.
3. **Datos de lista:** tabla desktop, avatar derivado, acciones existentes y lista móvil en `AffiliatesTable`.
4. **Overlays:** detalle compacto, tabs respaldadas por datos y confirmación de estado en `AffiliateDetailsModal`.
5. **Estados y evidencia:** loading, error, vacío, disabled, responsive y comparación lado a lado contra wireframe.

Cada incremento mantiene el anterior usable; no se fusiona una dependencia funcional pendiente como atajo de fidelidad.

### 9. Estrategia futura de validación visual

Antes de declarar Apply completado:

1. Abrir referencia local y pantalla autenticada con datos representativos, sin modificar datos productivos.
2. Capturar desktop a 1536×1024 o tamaño original de referencia, más 1440×900 y 1024×768; comparar orden, proporciones, densidad, superficies, iconos, columnas, acciones y paginación.
3. Capturar detalle y confirmación; verificar avatar, tabs, scroll interno, acciones y estados busy/error.
4. Capturar 768×1024, 390×844 y 320×568; confirmar lista móvil, ausencia de overflow y objetivos táctiles de al menos 44 px.
5. Navegar teclado: filtro, resultado, detalle, confirmación, Escape, cierre y retorno de foco. Revisar lector de pantalla para etiquetas, estados y diálogos.
6. Registrar diferencias no resolubles por contratos ausentes como `NOT_VERIFIED` o `BLOCKED`, nunca como equivalencia visual alcanzada.

## Risks / Trade-offs

- [Wireframe contiene seis controles sin contrato] → mantener dependencia explícita; requerir cambio funcional independiente antes de activarlos.
- [Fidelidad literal puede chocar con información inexistente] → priorizar datos reales y anunciar diferencia en evidencia visual.
- [Cambios de SGI-FORMS-V1 comparten directorio o primitives] → limitar archivos y no tocar frontend público/shared; revisar diff antes de Apply.
- [Un modal compacto puede ocultar contenido] → altura máxima y scroll interno, sin eliminar información ni romper foco.
- [Avatar derivado puede variar por locales] → algoritmo determinístico y paleta limitada con texto siempre presente.
- [Tablet no admite siete columnas legibles] → cambiar a lista en breakpoint temprano, no comprimir ni ocultar contenido crítico.

## Migration Plan

1. Aplicar cambios solo en archivos de feature autorizados por incrementos.
2. Validar contratos existentes, estados y matriz visual.
3. Si falla fidelidad o comportamiento, revertir únicamente el incremento presentacional afectado; no hay migraciones, datos ni cambios API que revertir.

## Open Questions

Ninguna diferible. La activación de controles sin contrato exige cambio funcional y aprobación antes de Apply; no es una pregunta de implementación visual.
