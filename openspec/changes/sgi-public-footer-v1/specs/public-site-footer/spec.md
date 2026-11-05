# Spec Delta

## Purpose

Define footer público institucional que preserve contenido, navegación y sesión mientras ofrece composición compacta, adaptable y accesible en cada viewport.

## ADDED Requirements

### Requirement: Composición institucional responsive
El sistema SHALL presentar footer público con fondo institucional marrón, onda decorativa y marca oficial, limitado a 1200 px de contenido, con cuatro columnas en escritorio, dos en tablet y distribución legible sin overflow en móvil.

#### Scenario: Visitante abre una página pública en escritorio
- **WHEN** viewport es de al menos 1024 px
- **THEN** footer muestra sus cuatro regiones de contenido en cuatro columnas dentro de un contenedor centrado de máximo 1200 px

#### Scenario: Visitante abre una página pública en tablet o móvil
- **WHEN** viewport es menor de 1024 px
- **THEN** footer muestra dos columnas en tablet y un flujo adaptable en móvil, sin ocultar contenido ni desbordamiento horizontal

### Requirement: Ritmo compacto del footer
El sistema SHALL aplicar padding vertical de 40 px en escritorio, 32 px en tablet y 28 px en móvil al contenido principal del footer, sin introducir regiones vacías ni controles sobredimensionados.

#### Scenario: Footer se muestra en cada breakpoint
- **WHEN** visitante observa el footer en escritorio, tablet o móvil
- **THEN** padding vertical corresponde al breakpoint y contenido conserva separación legible y proporcionada

### Requirement: Contenido y navegación preservados
El sistema SHALL conservar los datos institucionales y enlaces definidos en `publicSiteContent`, además de destino de acceso al sistema según estado autenticado y capacidad ERP del usuario.

#### Scenario: Visitante no autenticado usa enlaces del footer
- **WHEN** visitante abre el footer sin sesión
- **THEN** puede acceder a contacto, redes, enlaces rápidos, inicio de sesión y solicitud de cuenta con los destinos definidos actualmente

#### Scenario: Usuario autenticado usa acceso al sistema
- **WHEN** usuario autenticado abre el footer
- **THEN** observa destino al panel o servicios según su capacidad y puede cerrar sesión sin alterar la lógica de autenticación existente

### Requirement: Acción de cierre de sesión integrada al footer
El sistema SHALL presentar `Cerrar sesión` con texto legible y superficie transparente o institucional sobre el fondo marrón; sus estados hover, foco y deshabilitado no SHALL usar superficie blanca ni perder contraste.

#### Scenario: Usuario autenticado enfoca o interactúa con Cerrar sesión
- **WHEN** usuario autenticado navega con teclado, puntero o estado deshabilitado
- **THEN** control conserva contraste, foco visible, área táctil utilizable y jerarquía visual consistente con el footer
