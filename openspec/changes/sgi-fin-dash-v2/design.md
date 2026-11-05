# Design

## Context

Ver `proposal.md` para motivación y `specs/financial-dashboard/spec.md` para comportamiento. El frontend ya concentra contratos, consultas y pantallas financieras en `src/features/financial`; `ErpLayout`, navegación, `RoleRoute`, TanStack Query, Recharts, Lucide React y primitivas UI están disponibles. El backend protege cada endpoint por capacidad y devuelve montos decimales como cadenas.

Evidencia vigente relevante:

- `GET /financial/movements/summary` y `GET /financial/movements` requieren `fin.movements.read`.
- `GET /financial/charges` requiere `fin.charges.read`; registrar pagos requiere `fin.payments.record`.
- `dateFrom` se aplica como `occurredAt >= fecha` y `dateTo` como `occurredAt <= fecha`.
- Movimientos se ordenan por `occurredAt DESC, id DESC`.
- Cargos paginados responden `{ data, total, page, limit }` y calculan `total` con conteo servidor.
- Registrar un pago confirma el cargo y crea un movimiento `INCOME` en la misma transacción, pero la invalidación frontend actual solo refresca cargos.
- `RoleRoute` acepta una sola capacidad; la nueva ruta necesita una disyunción de dos capacidades existentes.

## Goals / Non-Goals

**Goals:**

- Mantener un único feature financiero como propietario de API, modelos, consultas y UI del dashboard.
- Impedir consultas de dominios no autorizados, no solo ocultar sus resultados.
- Preservar precisión decimal en cálculos y validaciones derivados.
- Aislar carga y fallos por bloque para mantener información útil disponible.
- Incorporar la ruta sin cambiar autorización ni comportamiento de rutas financieras existentes.

**Non-Goals:**

- Crear un endpoint agregador o modificar semántica backend.
- Convertir el dashboard en fuente de conciliación o disponibilidad de caja.
- Sincronizar filtros por URL en las pantallas existentes durante este incremento.
- Crear abstracciones genéricas de gráficos o dashboards en `shared` antes de demostrar reutilización real.

## Decisions

### 1. Propiedad y composición frontend

Crear `FinancialDashboardPage` y componentes de presentación dentro de `frontend/src/features/financial/ui/`; exponer solo la página necesaria mediante `features/financial/index.ts`. Mantener API, tipos y claves en las carpetas actuales del feature. `AppRoutes` y `erpNavigation` solo componen ruta y navegación.

Composición propuesta:

- encabezado y selector mensual;
- `FinancialSummarySection` para FIN-DASH-01;
- `FinancialTrendSection` para FIN-DASH-02;
- `FinancialChargeStatusSection` para FIN-DASH-03;
- `RecentFinancialMovementsSection` para FIN-DASH-04;
- accesos contextuales dentro de cada dominio autorizado.

Cada sección monta sus propios hooks. Si falta una capacidad, la sección no se monta y no se emite su petición. Se reutilizan `PageHeader`, `MetricCard`, `LoadingState`, `EmptyState`, `ErrorState`, `Button`, tarjetas y patrones accesibles existentes. Componentes específicos permanecen en el feature; no se promueven a `shared`.

**Alternativa descartada:** página monolítica con todas las consultas. Acopla estados, facilita fallos totales y dificulta probar permisos parciales.

### 2. Autorización de ruta con disyunción explícita

Extender de forma compatible `RoleRoute` para expresar “cualquiera de estas capacidades”, tipado con capacidades conocidas. La autorización propuesta para `/app/financial/dashboard` exige simultáneamente:

1. sesión autenticada;
2. `canAccessErp === true`;
3. al menos una de `fin.movements.read` o `fin.charges.read`.

El comportamiento actual de `capability="..."` permanece sin cambios. Una lista vacía o capacidades ausentes mantiene default-deny. Endpoints continúan protegidos por backend; el dashboard condiciona montaje, enlaces y consultas según cada capacidad individual.

**Alternativas descartadas:**

- Proteger la ruta solo con `fin.movements.read`: excluye usuarios válidos de cargos.
- Protegerla solo con `fin.charges.read`: excluye usuarios válidos de movimientos.
- Crear `fin.dashboard.read`: capacidad no aprobada.
- Duplicar la misma ruta bajo dos guards: genera ramas ambiguas y mantenimiento duplicado.
- Usar nombre de rol: contradice autorización basada en capacidades.

### 3. Navegación y acceso parcial

Agregar “Dashboard financiero” como hijo visible cuando exista cualquiera de las dos capacidades de lectura. Con ambas, se muestran todos los bloques. Con una sola, la cuadrícula se recompone sin huecos y muestra solo el dominio autorizado. Accesos rápidos verifican la capacidad del destino.

Las rutas existentes conservan sus destinos y guards. Los segmentos de cargos pueden navegar al listado existente; el deep-link con filtro de estado se difiere porque `FinancialPage` mantiene filtros en estado local y este incremento no debe alterar esa pantalla. Incorporar filtros URL será un incremento separado si se aprueba.

**Alternativa descartada:** convertir `/app/financial` en dashboard. Sustituiría la pantalla actual de cargos y rompería el alcance de compatibilidad.

### 4. Contratos de consulta

Reutilizar `financialApi` y contratos actuales:

| Bloque | Consulta | Parámetros propuestos |
|---|---|---|
| Resumen | `GET /financial/movements/summary` | `dateFrom`, `dateTo` del mes seleccionado |
| Evolución | seis llamadas al mismo resumen | un intervalo por mes, mes seleccionado y cinco anteriores |
| Cargos | tres `GET /financial/charges` | `status`, `page: 1`, `limit: 1` |
| Recientes | `GET /financial/movements` | `page: 1`, límite pequeño fijo (propuesto: 5) |

El donut usa solo `total`; nunca suma `data.length`. Movimientos recientes respetan el orden servidor, sin reordenamiento ni inferencias frontend. Resumen, evolución, cargos y recientes conservan query keys distintas y pueden reintentarse de forma independiente.

**Alternativa descartada:** descargar páginas de movimientos o cargos para agregarlas. Produce resultados incompletos, más transferencia y duplicación de lógica backend.

### 5. Intervalos mensuales inclusivos

Como backend aplica límites inclusivos (`gte`/`lte`), generar intervalos cerrados sin superposición:

- `dateFrom`: primer instante del mes calendario;
- `dateTo`: instante inmediatamente anterior al inicio del mes siguiente;
- siguiente intervalo: inicio exacto del mes siguiente.

El mes seleccionado es ancla de la serie y se incluyen sus cinco meses anteriores. Los límites se serializan como ISO-8601 con zona explícita. Antes de APPLY debe confirmarse la zona institucional usada para “mes”; propuesta: `America/Costa_Rica`, coherente con operación de Curime. Costa Rica no observa horario de verano, pero la utilidad debe producir instantes UTC desde límites `-06:00`, no depender de la zona del navegador.

Pruebas de frontera cubrirán primer instante, último instante, cambio de año y exclusión del primer instante del mes siguiente. Una prueba contractual sumará los seis intervalos con aritmética decimal exacta y comparará contra el resumen del intervalo total equivalente. Esta comprobación no exige una séptima petición permanente en producción.

**Alternativas descartadas:** usar el mismo instante como `dateTo` de un mes y `dateFrom` del siguiente, porque duplicaría movimientos; usar zona local del navegador, porque dos usuarios podrían consultar períodos distintos.

### 6. Precisión monetaria

Conservar valores API como cadenas. Para sumas y comparaciones internas, convertir cadenas CRC de dos decimales a unidades menores enteras (`bigint`) mediante un parser estricto; restar y sumar enteros y volver a cadena antes de formatear. No usar `parseFloat`, `Number` ni acumuladores binarios para totales.

Recharts requiere valores numéricos. La adaptación al gráfico ocurre al final, desde unidades menores validadas y solo si el valor cabe en el rango entero seguro de JavaScript; texto, tooltip y tabla accesible usan la cadena decimal exacta. Si un valor excede el rango seguro, el bloque conserva representación textual exacta y evita una visualización numérica engañosa.

No se añade biblioteca decimal: `bigint` cubre CRC con escala contractual de dos decimales y evita una dependencia nueva.

### 7. Gráficos accesibles

Usar Recharts solo como capa visual. El gráfico de barras usa verde institucional para ingresos y dorado para egresos; el donut distingue estados con color, texto y leyenda. Cada gráfico incluye título, descripción y alternativa tabular o lista semántica con los mismos valores. Tooltips admiten foco/activación según capacidades de la versión instalada y muestran etiquetas completas.

Con cero cargos se reemplaza el donut por estado vacío. Gráficos deben responder al contenedor y no fijar anchos que provoquen desbordamiento. Movimiento decorativo se evita y se respeta `prefers-reduced-motion`.

### 8. Caché después de pagos

Ampliar `useRecordPayment` para invalidar, tras éxito:

- todas las listas de cargos;
- detalle del cargo afectado;
- todas las listas de movimientos;
- todos los resúmenes de movimientos.

Estas familias cubren dashboard, historial y cualquier intervalo mensual activo. En conflicto `409`, conservar actualización defensiva de lista y detalle del cargo; no invalidar movimientos como si el pago hubiera sido creado. Añadir pruebas sobre query keys, éxito y conflicto.

**Alternativa descartada:** actualizar manualmente cada caché con el payload del pago. No contiene todos los agregados ni garantiza coherencia frente a concurrencia.

### 9. Resiliencia y validación

No envolver todo el dashboard en un único estado de error. Cada bloque muestra skeleton/carga, vacío, error con reintento y contenido independientemente. Un `401/403` sigue las políticas HTTP y de ruta vigentes; un `403` de una consulta no habilita fallback a otro endpoint.

Pruebas focalizadas cubrirán contratos de parámetros, capacidades completas/parciales/ausentes, ausencia de consultas no autorizadas, orden recibido, totales paginados, límites temporales, precisión, invalidación y fallos parciales. Validación manual responsive: 1440, 1366, 1280, 1024, 768, 375 y 320 px; teclado, foco, contraste y lector de pantalla.

## Risks / Trade-offs

- **[Seis resúmenes generan seis peticiones]** → Ejecutarlas en paralelo con claves estables; medir antes de proponer endpoint agregador.
- **[Zona mensual no aprobada]** → Bloquear APPLY hasta confirmación humana de `America/Costa_Rica` o zona alternativa.
- **[Guard any-of puede ampliar acceso por error]** → Mantener requisitos de sesión y ERP, tipar capacidades, default-deny y probar todas las combinaciones.
- **[Recharts puede no ofrecer interacción de teclado suficiente por defecto]** → Proveer alternativa semántica equivalente y pruebas de nombres/foco.
- **[Una PR dependiente puede cambiar rutas, dashboard o contratos]** → Revisar #111, #117 y #118 contra rama base elegida antes de editar código.
- **[Invalidación amplia aumenta refetch]** → Limitar a familias financieras afectadas; corrección prevalece sobre caché obsoleta.
- **[Deep-link filtrado de cargos no existe]** → Navegar al listado sin modificarlo; tratar filtros URL en cambio separado.

## Migration Plan

1. Antes de APPLY, seleccionar rama base estable y comprobar estado real de PR #111, #117 y #118.
2. Confirmar zona institucional para límites mensuales y compatibilidad de contratos backend.
3. Implementar guard compatible y pruebas sin cambiar rutas existentes.
4. Añadir consultas, utilidades decimales, página, bloques y navegación del dashboard en incrementos FIN-DASH.
5. Ampliar invalidación de pagos y ejecutar validaciones focalizadas autorizadas.
6. Integrar tras revisión; rollback consiste en retirar ruta, entrada de navegación y componentes nuevos, y restaurar la invalidación anterior sin migración de datos.

## Open Questions

- Confirmación humana pendiente: ¿`America/Costa_Rica` será la zona normativa para interpretar períodos mensuales?
- Confirmación operativa pendiente: ¿cuál rama contiene la combinación aprobada de PR #111, #117 y #118 para iniciar APPLY?
