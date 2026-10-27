# Spec Delta

## Purpose

Provee una bandeja interna persistente para que cada usuario autenticado reciba, lea y atienda notificaciones operativas autorizadas.

## ADDED Requirements

### Requirement: Bandeja propia autenticada
El sistema SHALL permitir a un usuario autenticado listar únicamente sus notificaciones activas, ordenadas de más reciente a más antigua, con paginación y filtro `ALL` o `UNREAD`.

#### Scenario: Usuario consulta todas sus notificaciones
- **WHEN** un usuario autenticado solicita su bandeja con filtro `ALL`
- **THEN** recibe únicamente su página solicitada, total, tipo, categoría, prioridad, título, cuerpo, fecha, estado de lectura y acción autorizada cuando exista

#### Scenario: Usuario consulta sólo no leídas
- **WHEN** un usuario autenticado solicita su bandeja con filtro `UNREAD`
- **THEN** recibe únicamente sus notificaciones activas sin fecha de lectura

#### Scenario: Solicitud sin sesión
- **WHEN** un visitante solicita la bandeja o cualquier operación de lectura
- **THEN** el sistema rechaza la operación como no autenticada

### Requirement: Contador real de no leídas
El sistema SHALL exponer al usuario autenticado el conteo de sus notificaciones activas sin fecha de lectura, sin derivarlo de KPI ni de recursos ajenos.

#### Scenario: Existen notificaciones no leídas
- **WHEN** el usuario consulta su contador
- **THEN** recibe el número exacto de sus notificaciones activas no leídas

#### Scenario: No existen notificaciones no leídas
- **WHEN** el usuario consulta su contador y no tiene notificaciones no leídas
- **THEN** recibe cero

### Requirement: Lectura persistente propia
El sistema SHALL permitir al usuario autenticado marcar como leída una notificación propia y marcar todas sus notificaciones activas como leídas. La lectura individual será idempotente.

#### Scenario: Usuario marca una notificación propia
- **WHEN** el usuario marca como leída una notificación propia no leída
- **THEN** el sistema persiste su fecha de lectura y actualiza su contador

#### Scenario: Usuario marca nuevamente la misma notificación
- **WHEN** el usuario marca como leída una notificación propia ya leída
- **THEN** el sistema conserva su fecha original y responde sin crear un cambio adicional

#### Scenario: Usuario intenta modificar notificación ajena
- **WHEN** el usuario intenta marcar una notificación cuyo destinatario es otro usuario
- **THEN** el sistema no revela ni modifica esa notificación

### Requirement: Acciones de recurso autorizadas
El sistema SHALL incluir una acción hacia un recurso asociado sólo cuando el usuario destinatario conserva autorización para acceder a esa ruta y recurso según reglas actuales del servidor.

#### Scenario: Destinatario conserva acceso al recurso
- **WHEN** una notificación posee recurso asociado y el destinatario cumple la autorización vigente
- **THEN** la respuesta incluye la acción de navegación autorizada

#### Scenario: Destinatario no conserva acceso al recurso
- **WHEN** una notificación posee recurso asociado y el destinatario no cumple la autorización vigente
- **THEN** la respuesta omite la acción y no expone detalles adicionales del recurso

### Requirement: Emisión transaccional de eventos iniciales
El sistema SHALL crear avisos operativos sólo después de confirmar cambios exitosos para solicitudes de cuenta, solicitudes de afiliación y reservas; no SHALL crear avisos por validaciones, conflictos o transacciones fallidas.

#### Scenario: Se crea solicitud de cuenta pendiente
- **WHEN** se confirma una solicitud de cuenta `PENDING`
- **THEN** cada usuario activo autorizado para revisar y leer solicitudes de cuenta recibe una sola notificación operativa asociada a la lista administrativa

#### Scenario: Se crea solicitud de afiliación pendiente
- **WHEN** se confirma una solicitud de afiliación `PENDING`
- **THEN** cada administrador activo autorizado por el flujo vigente recibe una sola notificación operativa asociada a la lista administrativa

#### Scenario: Se crea reserva pendiente
- **WHEN** se confirma una reserva `PENDING`
- **THEN** cada usuario activo autorizado para leer y aprobar reservas recibe una sola notificación operativa asociada a la lista de reservas

#### Scenario: Se resuelve una reserva
- **WHEN** una reserva pendiente se aprueba o rechaza correctamente
- **THEN** su solicitante recibe una sola notificación informativa del resultado, con acción sólo si conserva acceso vigente a reservas

### Requirement: Duplicados y retención acotada
El sistema SHALL impedir un aviso repetido para la misma combinación de destinatario, tipo de evento y recurso, y SHALL mantener cada notificación disponible por 365 días desde su creación.

#### Scenario: Reintento de emisión del mismo evento
- **WHEN** un proceso reintenta emitir el mismo tipo de evento para el mismo destinatario y recurso
- **THEN** el sistema conserva una sola notificación

#### Scenario: Notificación expirada
- **WHEN** han transcurrido 365 días desde la creación de una notificación
- **THEN** deja de estar disponible en bandeja y de aportar al contador

### Requirement: Centro de notificaciones ERP
El ERP SHALL presentar campanita con contador real, panel de recientes y bandeja completa con filtros de lectura, carga, vacío y error recuperable; no SHALL simular notificaciones sin respuesta del servidor.

#### Scenario: Se abre la campanita
- **WHEN** el usuario abre el control de notificaciones
- **THEN** el sistema muestra las notificaciones recientes disponibles y una acción a la bandeja completa

#### Scenario: La bandeja no tiene resultados
- **WHEN** la API devuelve una página vacía
- **THEN** el ERP muestra un estado vacío explícito para el filtro activo

#### Scenario: La consulta falla
- **WHEN** falla la consulta de contador o bandeja
- **THEN** el ERP conserva controles accesibles, muestra un error recuperable y permite reintentar

#### Scenario: Actualización HTTP
- **WHEN** el ERP está activo o recupera foco
- **THEN** actualiza contador y recientes mediante HTTP con intervalo razonable, sin WebSockets ni infraestructura adicional
