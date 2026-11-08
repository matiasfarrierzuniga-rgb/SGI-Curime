# Spec Delta

## Purpose

Define cómo SGI-Curime clasifica, selecciona y presenta activos visuales reemplazables durante el prototipo académico sin confundir referencias provisionales con recursos autorizados para publicación.

## ADDED Requirements

### Requirement: Visual assets have an explicit publication classification
El sistema SHALL clasificar cada activo como `PROVISIONAL_ACADEMIC` o `AUTHORIZED_PUBLICATION` y SHALL registrar fuente, formato, dimensiones, orientación, uso previsto, autoría conocida, licencia, crédito y evidencia disponible.

#### Scenario: Web-search photograph is cataloged
- **WHEN** se registra una fotografía cuya licencia o autoría no puede verificarse
- **THEN** queda clasificada como `PROVISIONAL_ACADEMIC` y no como fotografía oficial o autorizada

#### Scenario: Asset becomes authorized
- **WHEN** existe evidencia verificable de procedencia, licencia o autorización, transformaciones permitidas y crédito aplicable
- **THEN** el activo puede clasificarse como `AUTHORIZED_PUBLICATION` con referencia a esa evidencia

### Requirement: Provisional assets are excluded from public delivery
El sistema MUST NOT copiar, transformar, empaquetar ni servir desde la aplicación pública un activo `PROVISIONAL_ACADEMIC` de licencia desconocida.

#### Scenario: P03 remains provisional
- **WHEN** se implementa el prototipo y P03 continúa sin licencia verificada
- **THEN** P03 sirve solo como referencia de composición y no aparece en recursos públicos ni markup desplegable

### Requirement: About visual source is replaceable
About SHALL obtener su presentación visual desde una referencia configurable que permita alternar entre placeholder local y recurso autorizado sin cambiar su estructura, texto, enlace ni jerarquía.

#### Scenario: No authorized photograph is available
- **WHEN** About no tiene una fotografía `AUTHORIZED_PUBLICATION`
- **THEN** muestra un placeholder local que conserva la composición prevista y no simula una autorización inexistente

#### Scenario: Authorized photograph is configured later
- **WHEN** una fotografía autorizada reemplaza el placeholder
- **THEN** About conserva la misma composición y presenta los metadatos accesibles y créditos exigidos

### Requirement: Public deployment enforces asset readiness
El despliegue público SHALL considerar listo un activo fotográfico solo cuando su clasificación, procedencia, autorización o licencia, transformaciones permitidas, crédito y derivados estén verificados.

#### Scenario: Deployment review finds pending rights
- **WHEN** un activo referenciado por una superficie pública carece de cualquiera de las evidencias requeridas
- **THEN** la revisión de despliegue lo marca bloqueado y exige usar el placeholder o retirarlo

### Requirement: Original assets remain unchanged
El sistema SHALL conservar fotografías y logotipos fuente sin sobrescritura, renombrado ni transformación, y SHALL crear cualquier variante autorizada como derivado separado y trazable.

#### Scenario: Authorized derivatives are generated
- **WHEN** se preparan formatos o encuadres de un activo autorizado
- **THEN** el original permanece intacto y cada derivado registra su relación con la fuente

### Requirement: About presentation is responsive and accessible
La región visual de About SHALL reservar dimensiones, evitar overflow y desplazamientos inesperados, y mantener significado accesible en 320, 375, 768, 1024 y 1440 px.

#### Scenario: Placeholder is displayed
- **WHEN** About usa el placeholder local
- **THEN** la región conserva sus proporciones y comunica de forma neutral que la imagen publicable está pendiente

#### Scenario: Authorized image is displayed
- **WHEN** About usa una fotografía autorizada
- **THEN** ofrece alt factual, fallback compatible, carga diferida y crédito visible cuando sea obligatorio

### Requirement: Reserved assets remain outside current presentation
P03 SHALL permanecer como referencia académica de About; P02 SHALL permanecer como referencia futura de Hero; P01 y P04 SHALL permanecer reservadas, sin incorporarse a superficies públicas dentro de este cambio.

#### Scenario: Current change is implemented
- **WHEN** finaliza el alcance de identidad visual V1
- **THEN** Hero, Header, Footer, Community, Latest News, Eventos y demás módulos conservan sus activos y presentación actuales
