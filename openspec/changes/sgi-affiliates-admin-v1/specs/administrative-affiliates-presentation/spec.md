# Spec Delta

## Purpose

Define la presentación administrativa de afiliados fiel al wireframe aprobado sin ampliar operaciones, filtros ni contratos de la vertical existente.

## ADDED Requirements

### Requirement: Faithful administrative affiliates composition
La pantalla `/app/admin/affiliates` SHALL presentar cabecera, acción superior, filtros, resultados, tabla y paginación con jerarquía, orden y densidad equivalentes al wireframe aprobado, usando datos autorizados por el contrato vigente.

#### Scenario: Administrator views desktop list
- **WHEN** un usuario autorizado abre la ruta en viewport desktop
- **THEN** ve icono circular, título, descripción, tarjeta de filtros, tarjeta de resultados, tabla, avatares, estados y paginación en el orden del wireframe

#### Scenario: List has no results or fails to load
- **WHEN** la lista está vacía, cargando o falla
- **THEN** la pantalla conserva su estructura administrativa y presenta el estado existente con texto comprensible, sin datos inventados

### Requirement: Existing list behavior remains authoritative
La pantalla SHALL conservar listado paginado, búsqueda, filtro por estado, detalle, edición, activación y desactivación conforme a contratos existentes; no SHALL emitir solicitudes ni simular resultados para controles sin contrato.

#### Scenario: Administrator changes an implemented filter
- **WHEN** el administrador cambia búsqueda o estado
- **THEN** la lista consulta exclusivamente filtros soportados y vuelve a la primera página conforme al comportamiento vigente

#### Scenario: Wireframe control has no supported contract
- **WHEN** el wireframe muestra registro directo, tipo, fechas, Filtrar, menú contextual, observaciones o cantidad por página
- **THEN** la interfaz no presenta una acción funcional engañosa ni envía parámetros o mutaciones no soportados

### Requirement: Affiliate detail follows approved compact layout
El detalle de un afiliado SHALL presentar encabezado de identidad, avatar, estado, pestañas, información personal, información de afiliación y acciones existentes en composición compacta con contenido desplazable dentro del modal.

#### Scenario: Administrator opens existing affiliate detail
- **WHEN** selecciona ver detalle para un afiliado disponible
- **THEN** ve datos autoritativos del detalle y puede invocar únicamente Editar y Activar o Desactivar según el estado actual

#### Scenario: Detail lacks observations contract
- **WHEN** se selecciona la región Observaciones representada en el wireframe
- **THEN** no se inventa contenido, persistencia ni historial que el contrato actual no expone

### Requirement: Status confirmation is explicit and recoverable
Antes de activar o desactivar, el sistema SHALL presentar confirmación con afiliado afectado, consecuencia de negocio, cancelación y acción final; durante la mutación SHALL impedir envíos duplicados y comunicar fallos recuperables.

#### Scenario: Administrator confirms deactivation
- **WHEN** confirma desactivar un afiliado activo
- **THEN** la interfaz ejecuta la mutación existente una vez, muestra estado ocupado y actualiza datos invalidados al completarse

#### Scenario: Status mutation is rejected
- **WHEN** activación o desactivación devuelve error o conflicto
- **THEN** la interfaz expone mensaje disponible, libera el estado ocupado y conserva una ruta para actualizar el detalle autoritativo

### Requirement: Mobile list and interaction accessibility
La pantalla SHALL transformar la lista a una representación móvil equivalente, operable por teclado y lector de pantalla, sin overflow horizontal de página ni comunicación basada solo en color.

#### Scenario: Administrator views narrow viewport
- **WHEN** abre la ruta entre 320 y 767 px de ancho
- **THEN** ve una lista de afiliados con identidad, identificación, fecha, estado y affordance para abrir detalle, sin requerir tabla horizontal

#### Scenario: Keyboard user opens dialog or detail
- **WHEN** navega acciones de fila, modal o confirmación mediante teclado
- **THEN** los controles tienen nombre accesible, foco visible, orden lógico y retorno de foco al cerrar overlays
