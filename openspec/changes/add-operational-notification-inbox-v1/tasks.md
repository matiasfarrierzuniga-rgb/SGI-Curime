# Tasks

## 1. Persistencia y base de módulo

- [x] 1.1 Añadir enums, modelo `Notification`, relación inversa de `User`, vencimiento a 365 días, índices y clave única de deduplicación en Prisma; crear migración aditiva y verificarla sólo en PostgreSQL desechable.
- [x] 1.2 Extender el contexto `notifications` con servicio/repositorio de bandeja y acceso transaccional Prisma, sin alterar el puerto ni la entrega de correo; verificar tests unitarios de construcción de clave, expiración y dedupe.
- [x] 1.3 Añadir acciones de auditoría para lectura individual y masiva sin registrar contenido sensible; verificar sanitización y actor correcto en pruebas unitarias.

## 2. API de bandeja y autorización

- [x] 2.1 Implementar DTO de consulta y `GET /notifications` con paginación, filtros `ALL`/`UNREAD`, vencimiento y respuesta propia; verificar orden, límites, vacío y filtro en pruebas de servicio/controlador.
- [x] 2.2 Implementar `GET /notifications/unread-count` derivado exclusivamente de registros propios activos; verificar cero, conteo exacto y aislamiento entre usuarios.
- [x] 2.3 Implementar `PATCH /notifications/:id/read` y `PATCH /notifications/read-all` con JWT, idempotencia y auditoría; verificar lectura propia, lectura repetida y denegación no reveladora de notificación ajena.
- [x] 2.4 Implementar resolución server-side de acciones de recurso sin URL del cliente; verificar que se omiten enlaces para capacidad/rol insuficiente y se preservan para destinatario autorizado.

## 3. Productores transaccionales iniciales

- [x] 3.1 Conectar creación confirmada de `UserRequest(PENDING)` a revisores activos con `usr.user-requests.read` y `usr.user-requests.review`; verificar destinatarios positivos/negativos, una notificación por reintento y cero avisos tras fallo.
- [x] 3.2 Conectar creación confirmada de `AffiliateRequest(PENDING)` a administradores activos conforme a `RolesGuard` vigente; verificar que no se expone identidad o contacto de la solicitud en título/cuerpo.
- [x] 3.3 Conectar creación confirmada de `Reservation(PENDING)` a responsables activos con lectura y aprobación; verificar concurrencia, dedupe y rollback atómico.
- [x] 3.4 Conectar aprobación y rechazo confirmados de reserva a `requesterUserId`; verificar que un solicitante sin `res.reservations.read` recibe resultado sin enlace y que fallos/conflictos no crean aviso.

## 4. Frontend ERP

- [x] 4.1 Crear feature `notifications` con tipos, cliente HTTP, claves y hooks TanStack Query; verificar respuestas, filtros y errores aislando HTTP en pruebas.
- [x] 4.2 Convertir la campanita ERP en control accesible con contador real, popover de recientes, carga, vacío, error y reintento; verificar teclado, foco, Escape y que no muestra datos simulados.
- [x] 4.3 Añadir bandeja completa protegida en ERP con filtros Todas/No leídas, lectura individual/masiva y navegación sólo hacia acciones entregadas por servidor; verificar responsive, estados y sincronización contador/listas.
- [x] 4.4 Configurar actualización HTTP a 60 segundos y al recuperar foco, con invalidación después de mutaciones; verificar que no se instala WebSocket ni se deriva el contador de KPI.

## 5. Integración y verificación

- [x] 5.1 Ejecutar pruebas backend enfocadas de destinatario, lectura, dedupe, autorización negativa y productores; verificar que ninguna usa datos reales ni entrega correo.
- [x] 5.2 Ejecutar pruebas frontend enfocadas de campanita, popover y bandeja; verificar contador, filtros, error, vacío y acciones autorizadas.
- [x] 5.3 Ejecutar lint/build aplicables y `git diff --check`; verificar compatibilidad de Dashboard V2, perfil, sidebar, rutas directas y viewport móvil/escritorio.
- [x] 5.4 Validar migración/rollback en entorno PostgreSQL desechable con copia restaurable; documentar comando, resultado y cualquier prueba no ejecutada antes de solicitar archive.

## Workflow follow-up

- Revisar y aprobar esta propuesta antes de iniciar OpenSpec apply.
- Archivar sólo después de implementación, evidencia de migración y validación acordada.
