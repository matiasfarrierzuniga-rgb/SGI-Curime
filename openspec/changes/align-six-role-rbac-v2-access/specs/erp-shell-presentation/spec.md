# Spec Delta

## MODIFIED Requirements

### Requirement: Institutional Sidebar presentation
El sistema SHALL presentar navegación ERP agrupada por áreas institucionales, mostrando solo destinos con operación backend implementada y autorizada por las capacidades resueltas de la sesión. La marca, íconos, etiquetas y estado actual SHALL conservar identificación no dependiente solo del color.

#### Scenario: Current module is identified
- **WHEN** una persona visita una ruta ERP autorizada presente en la navegación
- **THEN** el módulo actual SHALL mostrar etiqueta, icono, superficie y marcador de selección, conservando `aria-current="page"`

#### Scenario: Navigation is filtered for session capabilities
- **WHEN** una sesión no tiene una capacidad requerida por un módulo o grupo
- **THEN** el Sidebar SHALL no presentar ese destino ni un grupo vacío

#### Scenario: Capability has no implemented destination
- **WHEN** una sesión tiene una capacidad persistida sin ruta y operación backend equivalentes
- **THEN** el Sidebar SHALL no presentar un destino ficticio ni sustituirlo por acceso general al módulo

### Requirement: Authorization boundaries remain unchanged
El shell SHALL preservar default-deny y aplicar el contrato canónico verificado a rutas, navegación, dashboard y acciones. Reutilizar composición visual SHALL NOT ampliar capacidades, omitir guards backend, confiar en el nombre del rol para autorizar ni exponer datos sin operación implementada.

#### Scenario: Direct protected route remains guarded
- **WHEN** una sesión navega directamente a una ruta ERP sin capacidad requerida
- **THEN** el sistema SHALL impedir renderizar contenido protegido y presentar `/403`

#### Scenario: Community account remains outside ERP
- **WHEN** una cuenta comunitaria autenticada sin acceso ERP solicita una ruta interna
- **THEN** el sistema SHALL conservar la redirección vigente hacia su destino comunitario o de servicios

#### Scenario: Shared dashboard is capability composed
- **WHEN** un perfil canónico autorizado abre el dashboard administrativo compartido
- **THEN** cada tarjeta, dato, enlace y acción SHALL corresponder a capacidades de la sesión y a operaciones backend implementadas

#### Scenario: Specialized existing dashboard is reused
- **WHEN** Tesorería u Operador tienen acceso a una experiencia financiera o de inventario existente
- **THEN** el shell SHALL dirigir al dashboard especializado autorizado sin crear un dashboard independiente por rol
