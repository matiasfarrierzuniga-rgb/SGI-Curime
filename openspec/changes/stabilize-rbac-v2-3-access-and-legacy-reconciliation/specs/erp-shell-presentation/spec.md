# Spec Delta

## MODIFIED Requirements

### Requirement: Institutional Sidebar presentation
El sistema SHALL presentar la navegación ERP visible agrupada por áreas institucionales, con marca SGI-Curime, íconos, etiquetas, estado actual no dependiente solo del color y únicamente destinos respaldados por una operación implementada y una capacidad efectiva de la sesión.

#### Scenario: Current module is identified
- **WHEN** una persona visita una ruta ERP autorizada presente en la navegación
- **THEN** el módulo actual SHALL mostrar etiqueta, icono, superficie y marcador de selección, conservando `aria-current="page"`

#### Scenario: Navigation is filtered for session capabilities
- **WHEN** una sesión no tiene una capacidad requerida por un módulo o grupo
- **THEN** el Sidebar SHALL no presentar ese destino ni un grupo vacío

#### Scenario: Capability has no implemented destination
- **WHEN** una sesión posee una capacidad sin ruta y operación backend equivalentes
- **THEN** el Sidebar SHALL no presentar un destino ficticio ni sustituirlo por acceso general al módulo

### Requirement: Authorization boundaries remain unchanged
El shell SHALL aplicar las capacidades efectivas resueltas por servidor a navegación, dashboard, rutas y acciones sin otorgar acceso, confiar en etiquetas de rol ni sustituir autorización backend. Cada dato o acción protegida SHALL conservar un guard API equivalente.

#### Scenario: Direct protected route remains guarded
- **WHEN** una sesión navega directamente a una ruta ERP sin capacidad requerida
- **THEN** el sistema SHALL impedir contenido y solicitudes protegidas y redirigir a `/403`

#### Scenario: Community account remains outside ERP
- **WHEN** una cuenta comunitaria autenticada sin acceso ERP solicita una ruta interna
- **THEN** el sistema SHALL conservar la redirección vigente hacia su destino comunitario o de servicios

#### Scenario: Shared dashboard is capability composed
- **WHEN** una sesión abre el dashboard compartido
- **THEN** cada consulta, dato, tarjeta, enlace y acción SHALL corresponder a una capacidad efectiva y una operación backend implementada

#### Scenario: Hidden action is invoked directly
- **WHEN** una acción no visible se invoca directamente sin su capacidad
- **THEN** el backend SHALL denegarla aunque la interfaz haya ocultado el control

## ADDED Requirements

### Requirement: Events navigation remains operation coherent
La presentación ERP SHALL mostrar gestión de Eventos solo cuando exista al menos una capacidad de operación de eventos implementada, y cada acción SHALL exigir su capacidad exacta.

#### Scenario: Event manager opens direct route
- **WHEN** una sesión posee una capacidad implementada de creación, revisión, aprobación o publicación de eventos
- **THEN** `/app/events` es alcanzable y la pantalla muestra únicamente acciones autorizadas

#### Scenario: Session lacks event capability
- **WHEN** una sesión sin capacidad de eventos abre `/app/events`
- **THEN** no se renderiza contenido protegido ni se solicitan datos de gestión

#### Scenario: Visitor uses public events
- **WHEN** una persona visita `/eventos` o un detalle público
- **THEN** conserva el acceso público independiente de capacidades ERP

### Requirement: Volunteering deep links preserve public and ERP boundaries
El sistema SHALL mantener voluntariado público sin cuenta y proteger la ruta administrativa, sus datos y acciones mediante capacidades efectivas equivalentes.

#### Scenario: Authorized administrative deep link
- **WHEN** una sesión posee `vol.opportunities.read` y abre `/app/admin/volunteering`
- **THEN** la ruta carga la proyección administrativa autorizada

#### Scenario: Unauthorized administrative deep link
- **WHEN** una sesión carece de `vol.opportunities.read` y abre `/app/admin/volunteering`
- **THEN** recibe comportamiento forbidden antes de renderizar datos protegidos

#### Scenario: Visitor uses public volunteering
- **WHEN** una persona sin cuenta abre una oportunidad pública o envía una postulación permitida
- **THEN** el flujo permanece disponible sin exigir `User`, `Affiliate` ni acceso ERP
