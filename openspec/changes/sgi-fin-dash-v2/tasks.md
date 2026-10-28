# Tasks

## 1. Precondiciones de APPLY

- [x] 1.1 Seleccionar con aprobaciÃ³n humana la rama base estable y registrar el estado de integraciÃ³n de PR #111, #117 y #118; verificar que ninguna incompatibilidad de rutas, contratos financieros o Dashboard Administrativo V2 quede sin resolver antes de editar cÃ³digo.
- [x] 1.2 Confirmar `America/Costa_Rica` como zona normativa de perÃ­odos mensuales o registrar la alternativa aprobada; verificar con ejemplos aprobados el primer y Ãºltimo instante de un mes.
- [x] 1.3 Capturar rama, HEAD y estado del Ã¡rbol antes de APPLY; verificar que el plan de archivos excluya cambios locales ajenos y detenerse si no existe un workspace seguro autorizado.

## 2. FIN-DASH-05 â€” Ruta, navegaciÃ³n y autorizaciÃ³n parcial

- [x] 2.1 Extender `RoleRoute` con una opciÃ³n compatible de â€œcualquiera de estas capacidadesâ€, preservando autenticaciÃ³n, `canAccessErp`, capacidad Ãºnica y default-deny; aÃ±adir pruebas para ambas capacidades, cada capacidad aislada, ninguna capacidad, sesiÃ³n ausente y lista vacÃ­a, y entregar comando focalizado para validaciÃ³n humana.
- [x] 2.2 Registrar `/app/financial/dashboard` dentro de `ErpLayout` usando solo `fin.movements.read` y `fin.charges.read`; verificar mediante pruebas de rutas que acceso completo y parcial funciona, ninguna capacidad redirige a forbidden y las rutas financieras existentes mantienen sus guards.
- [x] 2.3 Incorporar â€œDashboard financieroâ€ en sidebar y navegaciÃ³n financiera cuando exista al menos una capacidad de lectura; verificar que usuarios sin capacidades no ven el enlace y que `/app/financial`, movimientos, DINADECO y donaciones conservan destinos y visibilidad actuales.
- [x] 2.4 Crear el contenedor `FinancialDashboardPage` en el feature financiero y exportarlo por su API pÃºblica; verificar que monta solo secciones autorizadas y que no emite consultas del dominio sin capacidad.

## 3. FIN-DASH-01 â€” Resumen financiero

- [x] 3.1 Implementar utilidades de perÃ­odo mensual con zona aprobada y lÃ­mites inclusivos no superpuestos; aÃ±adir pruebas para mes actual, mes seleccionado, cambio de aÃ±o y fronteras exactas, y entregar comando focalizado para validaciÃ³n humana.
- [x] 3.2 Implementar parser y operaciones monetarias exactas desde cadenas hacia unidades menores `bigint`, sin aritmÃ©tica binaria para totales; aÃ±adir pruebas de suma, resta, cero, negativos, formato invÃ¡lido y lÃ­mite seguro de visualizaciÃ³n.
- [x] 3.3 Integrar el resumen del mes seleccionado mediante `GET /financial/movements/summary`; verificar parÃ¡metros `dateFrom`/`dateTo`, moneda CRC, valores exactos y texto que diferencia balance registrado de saldo disponible o conciliado.
- [x] 3.4 AÃ±adir carga, vacÃ­o, error y reintento independientes para el resumen; verificar semÃ¡ntica accesible y que un fallo no oculta cargos autorizados.

## 4. FIN-DASH-02 â€” EvoluciÃ³n de ingresos y egresos

- [x] 4.1 Construir seis intervalos mensuales consecutivos desde el mes seleccionado y consultar sus resÃºmenes con claves estables; verificar que ninguna frontera se duplica y que cada intervalo usa parÃ¡metros ISO explÃ­citos.
- [ ] 4.2 Construir la serie con valores decimales exactos y adaptaciÃ³n segura para Recharts; verificar con prueba contractual que la suma de seis intervalos equivale al resumen del perÃ­odo total y que no se agregan pÃ¡ginas de movimientos.
- [x] 4.3 Implementar barras agrupadas con verde institucional, dorado, etiquetas mensuales, valores CRC, tooltip y alternativa semÃ¡ntica; verificar que tipo y valor se entienden sin depender solo del color y que valores fuera del rango seguro mantienen representaciÃ³n textual exacta.
- [x] 4.4 Implementar carga y fallo parcial de intervalos con reintento del bloque; verificar que el dashboard no colapsa ni presenta una serie incompleta como completa.

## 5. FIN-DASH-03 â€” Estado actual de cargos

- [x] 5.1 Consultar `PENDING`, `PAID` y `CANCELLED` por separado con `page: 1` y `limit: 1`; verificar que cada conteo proviene de `total` y no de `data.length`.
- [x] 5.2 Implementar donut, leyenda y total de cantidades, identificado como â€œEstado actualâ€ e independiente del mes; verificar suma de conteos, ausencia de formato monetario y actualizaciÃ³n visual con respuestas paginadas.
- [x] 5.3 AÃ±adir acceso autorizado al listado existente sin introducir todavÃ­a filtros URL; verificar navegaciÃ³n a `/app/financial` y ausencia de acciones de pago sin `fin.payments.record`.
- [x] 5.4 Reemplazar donut por estado vacÃ­o cuando los tres conteos sean cero y aislar errores/reintentos del bloque; verificar cero total, error de un conteo y conservaciÃ³n de bloques de movimientos.

## 6. FIN-DASH-04 â€” Movimientos recientes

- [x] 6.1 Consultar una pÃ¡gina reciente con `page: 1` y lÃ­mite fijo de 5; verificar contrato de parÃ¡metros y que el frontend conserva el orden recibido `occurredAt DESC, id DESC` sin ordenar por descripciÃ³n u otros campos.
- [x] 6.2 Mostrar fecha, descripciÃ³n, tipo y monto desde movimientos reales, con acceso al detalle existente y al historial; verificar que no aparecen estados de aprobaciÃ³n ni categorÃ­as inferidas.
- [x] 6.3 AÃ±adir estados independiente de carga, vacÃ­o, error y reintento; verificar que el vacÃ­o conserva acceso al historial y que un fallo no oculta cargos autorizados.

## 7. ActualizaciÃ³n de cachÃ© tras pagos

- [x] 7.1 Ampliar `useRecordPayment` para invalidar listas y detalle de cargos, listas de movimientos y todos los resÃºmenes tras Ã©xito; aÃ±adir pruebas de query keys y entregar comando focalizado para validaciÃ³n humana.
- [x] 7.2 Preservar manejo de conflicto `409` refrescando lista y detalle del cargo sin tratar el pago como exitoso ni invalidar movimientos innecesariamente; verificar el comportamiento con prueba focalizada de concurrencia simulada.

## 8. FIN-DASH-06 â€” Calidad visual, accesibilidad y resiliencia

- [x] 8.1 Refinar composiciÃ³n responsive dentro de `ErpLayout` con tokens institucionales, DM Sans, Lucide y primitivas existentes; verificar visualmente 1440, 1366, 1280, 1024, 768, 375 y 320 px sin desbordamiento horizontal de pÃ¡gina.
- [ ] 8.2 Verificar teclado, foco visible, jerarquÃ­a de encabezados, nombres accesibles, contraste y alternativas semÃ¡nticas de grÃ¡ficos; registrar resultados WCAG 2.2 AA y corregir solo defectos dentro del dashboard.
- [ ] 8.3 AÃ±adir pruebas integradas del dashboard para datos completos, vacÃ­os, errores parciales, capacidades completas/parciales/ausentes y ausencia de cifras ficticias; entregar comandos focalizados para ejecuciÃ³n humana y registrar resultados como `NOT_EXECUTED`, `PASSED` o `FAILED` segÃºn evidencia.
- [ ] 8.4 Solicitar ejecuciÃ³n humana de `npm run verify` desde `frontend/` y `git diff --check`; revisar evidencia, confirmar arquitectura `app -> features -> shared` y verificar que el diff final no modifica backend, migraciones, dependencias ni mÃ³dulos funcionales existentes fuera del alcance aprobado.

## Workflow follow-up

- No iniciar APPLY hasta resolver tareas 1.1 a 1.3 y recibir autorizaciÃ³n explÃ­cita.
- Tras implementaciÃ³n y verificaciÃ³n aprobadas, revisar el cambio antes de considerar archivo OpenSpec; archivar requiere fase separada.
