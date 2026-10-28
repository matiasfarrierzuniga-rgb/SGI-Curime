# Spec Delta

## Purpose

Define una navegación lateral ERP más eficiente que conserva la equivalencia de acceso institucional, rutas y autorización existente.

## ADDED Requirements

### Requirement: Sidebar administrative presentation
El sistema SHALL presentar el sidebar administrativo de escritorio sin ilustración decorativa de montañas, sol ni lema, conservando la identificación visual SGI-Curime en un encabezado compacto y los colores de acento de cada área funcional.

#### Scenario: Desktop sidebar renders
- **WHEN** una persona autenticada abre una ruta del ERP en vista de escritorio
- **THEN** observa encabezado compacto con identificación SGI-Curime, áreas con sus colores de acento y sin ilustración decorativa

### Requirement: Navigation access equivalence
El sistema SHALL conservar todos los módulos, accesos, submenús, etiquetas, íconos, rutas y destinos que la navegación ERP existente expone para las capacidades efectivas de la persona autenticada.

#### Scenario: Authorized navigation is rendered
- **WHEN** una persona autenticada tiene acceso a uno o más módulos ERP
- **THEN** cada acceso y submenú autorizado conserva su etiqueta, ícono, jerarquía y destino existente

#### Scenario: Unauthorized navigation remains hidden
- **WHEN** una persona autenticada no tiene la capacidad requerida por un acceso o no conserva hijos autorizados en un submenú
- **THEN** el sidebar no muestra ese acceso o submenú

### Requirement: Sidebar navigation modes
El sistema SHALL conservar navegación expandida, navegación colapsada y navegación móvil, con desplazamiento vertical accesible para los accesos visibles y sin ocultar las acciones permanentes.

#### Scenario: Collapsed sidebar is used
- **WHEN** la persona contrae el sidebar de escritorio
- **THEN** puede identificar y activar los accesos mediante sus íconos y nombres accesibles, y puede expandir nuevamente la navegación

#### Scenario: Mobile sidebar is used
- **WHEN** la persona abre la navegación en una vista móvil
- **THEN** puede recorrer y usar las secciones, accesos y submenús autorizados sin perder sus destinos

### Requirement: Persistent sidebar actions
El sistema SHALL mantener disponibles las acciones «Ver sitio público» y «Cerrar sesión» en los modos de sidebar pertinentes, con sus destinos y efectos actuales.

#### Scenario: Public site action is activated
- **WHEN** la persona activa «Ver sitio público» desde el sidebar
- **THEN** el sistema navega al sitio público mediante el destino existente

#### Scenario: Logout action is activated
- **WHEN** la persona activa «Cerrar sesión» desde el sidebar
- **THEN** el sistema ejecuta el cierre de sesión actual y redirige al destino de acceso existente
