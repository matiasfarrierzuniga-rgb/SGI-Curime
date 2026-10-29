# Spec Delta

## Purpose

Define un shell ERP institucional que conserve acceso autorizado y permita navegación clara, responsive y accesible en todos los tamaños previstos.

## ADDED Requirements

### Requirement: Institutional Sidebar presentation
El sistema SHALL presentar la navegación ERP visible agrupada por áreas institucionales, con marca SGI-Curime, íconos, etiquetas, estado actual no dependiente solo del color y acciones globales identificables.

#### Scenario: Current module is identified
- **WHEN** una persona visita una ruta ERP autorizada presente en la navegación
- **THEN** el módulo actual SHALL mostrar etiqueta, icono, superficie y marcador de selección, conservando `aria-current="page"`

#### Scenario: Navigation is filtered for session capabilities
- **WHEN** una sesión no tiene una capacidad requerida por un módulo o grupo
- **THEN** el Sidebar SHALL no presentar ese destino ni un grupo vacío

### Requirement: Responsive ERP navigation
El sistema SHALL mostrar navegación persistente expandida o colapsable cuando haya espacio y un drawer accesible en viewport móvil, sin ocultar acciones de sitio público o cierre de sesión.

#### Scenario: Mobile navigation opens and closes accessibly
- **WHEN** una persona activa el control de navegación móvil
- **THEN** el drawer SHALL exponer nombre accesible, recibir foco conforme a la primitiva vigente y cerrarse tras navegar o descartarse

#### Scenario: Compact navigation preserves destination identity
- **WHEN** la navegación lateral está colapsada
- **THEN** cada control SHALL conservar nombre accesible, objetivo táctil adecuado y medio no visual para identificar su destino

### Requirement: Header session and operational controls
El sistema SHALL presentar contexto de ubicación, búsqueda solo como estado no disponible mientras no exista contrato funcional, notificaciones reales y menú de cuenta con acciones existentes.

#### Scenario: Search remains non-functional by contract
- **WHEN** la búsqueda global no tenga endpoint ni comportamiento aprobado
- **THEN** el Header SHALL comunicar que no está disponible y SHALL NOT aparentar aceptar o ejecutar búsquedas

#### Scenario: Notification states remain truthful
- **WHEN** se abre el control de notificaciones
- **THEN** el sistema SHALL presentar únicamente sus estados existentes de carga, error recuperable, vacío o datos obtenidos del servicio de notificaciones

#### Scenario: Account actions remain available
- **WHEN** una persona abre el menú de cuenta
- **THEN** el sistema SHALL exponer las acciones existentes de perfil, cambio de contraseña y cierre de sesión mediante controles operables por teclado

### Requirement: Shell responsive and focus safety
El sistema SHALL conservar contenido principal legible, foco visible y controles operables sin overflow horizontal en los viewports definidos, incluidas alturas reducidas.

#### Scenario: Persistent chrome does not obscure focus
- **WHEN** una persona navega por teclado entre controles del Sidebar, Header, overlays o contenido
- **THEN** el foco SHALL permanecer visible y no quedar completamente cubierto por elementos persistentes del shell

#### Scenario: Long navigation remains reachable
- **WHEN** el menú visible excede la altura del viewport
- **THEN** la región navegable SHALL desplazarse internamente sin desplazar ni ocultar permanentemente las acciones globales

### Requirement: Authorization boundaries remain unchanged
El refinamiento visual SHALL NOT otorgar acceso, modificar capacidades, rutas, roles, datos de sesión, contratos API ni autorización backend.

#### Scenario: Direct protected route remains guarded
- **WHEN** una sesión navega directamente a una ruta ERP sin capacidad requerida
- **THEN** el sistema SHALL conservar guard de ruta existente y redirigir a `/403`

#### Scenario: Community account remains outside ERP
- **WHEN** una cuenta comunitaria autenticada sin acceso ERP solicita una ruta interna
- **THEN** el sistema SHALL conservar la redirección vigente hacia su destino comunitario o de servicios
