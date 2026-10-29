# Tasks

## 1. Listado público de eventos

- [x] 1.1 Recomponer `PublicEventsPage` con encabezado compacto y jerarquía visible `estado → título → resumen → fecha/lugar → detalle`, reutilizando tokens existentes; verificar que cada evento publicado exponga esos datos y su acción sin interacción adicional.
- [ ] 1.2 Equilibrar la distribución de tarjetas para resúmenes de distintas longitudes y reducir espacio vertical improductivo sin ocultar información; verificar visualmente 320, 375, 768, 1024 y 1440 px.
- [x] 1.3 Preservar y cubrir estados de carga, error, vacío y evento pasado en la pantalla de listado; verificar con las pruebas focalizadas de `PublicEventsPage` y escenarios de datos representativos.

## 2. Detalle público de evento

- [x] 2.1 Reorganizar `PublicEventDetailPage` para diferenciar encabezado, resumen, metadata y descripción opcional dentro de un flujo editorial coherente; verificar que los campos disponibles conserven orden de lectura y jerarquía clara.
- [x] 2.2 Mantener visible y accesible el retorno a `/eventos`, omitir bloques de ubicación o descripción cuando no existan y conservar la comunicación de evento pasado; verificar rutas, nombres accesibles y escenarios de contenido opcional.
- [x] 2.3 Preservar estados de carga y error del detalle sin contenido fabricado; verificar con las pruebas focalizadas de `PublicEventDetailPage` y recuperación hacia el listado.

## 3. Validación responsive y accesible

- [ ] 3.1 Revisar teclado, foco visible, semántica de encabezados, nombres de enlaces, contraste y áreas táctiles en listado y detalle; verificar las tareas de encontrar evento, abrir detalle, leer metadata y regresar a la agenda.
- [ ] 3.2 Confirmar ausencia de overflow horizontal de página y legibilidad de texto en 320, 375, 768, 1024 y 1440 px, incluyendo títulos y resúmenes extremos; verificar mediante revisión visual documentada por viewport.
- [ ] 3.3 Confirmar que el diff final queda limitado a las dos pantallas de eventos y que no cambia rutas, hooks, servicios, endpoints, footer, formulario de afiliación, ERP ni primitives compartidos; verificar inspeccionando el diff y ejecutando la validación focalizada autorizada.

## Evidencia de verificación

- Revisión responsive manual del usuario: satisfactoria en 320 × 568, 375 × 667, 768 × 1024, 1024 × 768 y 1440 × 900. No confirma explícitamente títulos ni resúmenes extremos.
- Diff focalizado de las dos pantallas: sin cambios en contratos, hooks ni rutas.
- Vitest focalizado: 2 suites y 10 pruebas aprobadas; setup y teardown funcionales.
- La corrección de entorno cambió el pool de Vitest a `vmThreads`; su impacto sobre otras pruebas y la suite global permanece `NOT_VERIFIED`.
- Pruebas focalizadas cubren loading, error, vacío, eventos pasados, campos opcionales, inicio/finalización y retorno a `/eventos`.

## Estado de transferencia

- Estado autorizado por usuario: `VISUALLY_ACCEPTED / TECHNICALLY_PARTIAL`. Se aprueba continuar con el siguiente incremento; no constituye certificación técnica completa ni autoriza archivar este cambio.
- Tareas completadas conservadas: 1.1, 1.3, 2.1, 2.2 y 2.3.
- Pendiente 1.2: verificar tarjetas con resúmenes de distintas longitudes, incluidos textos extremos.
- Pendiente 3.1: revisión manual de teclado, foco visible, contraste, áreas táctiles y flujos de listado/detalle.
- Pendiente 3.2: revisión visual documentada por viewport con títulos y resúmenes extremos, incluida ausencia de overflow horizontal.
- Pendiente 3.3: validar el diff final autorizado; impacto de `vmThreads` sobre otras pruebas y suite global permanece `NOT_VERIFIED`.
