# Spec Delta

## Purpose

Establecer una base visual y de gobernanza verificable para que SGI-Curime evolucione de forma consistente, accesible y compatible entre el sitio público, acceso y ERP.

## ADDED Requirements

### Requirement: Fuente documental de identidad y tokens
La gobernanza SHALL documentar la fuente técnica existente para la paleta Curime y tokens de marca y semánticos sin valores contradictorios. Este requisito no exige cambiar tokens ni consumidores existentes.

#### Scenario: Revisión de paleta institucional
- **WHEN** una persona compara la paleta documentada con los tokens vigentes
- **THEN** nombres, valores y usos declarados coinciden o las diferencias de compatibilidad quedan identificadas explícitamente

#### Scenario: Uso semántico de color
- **WHEN** una interfaz representa una acción, superficie, borde, foco o estado
- **THEN** usa el token semántico correspondiente y no atribuye significado de estado a un token de marca

### Requirement: Distinción visual entre contextos
La gobernanza SHALL definir tratamientos permitidos para sitio público, acceso y ERP sin fragmentar identidad ni convertir diferencias visuales en contratos de dominio. Aplica a cambios nuevos o adoptados progresivamente.

#### Scenario: Contexto público
- **WHEN** se presenta una superficie del sitio público
- **THEN** conserva la identidad Curime, sus assets oficiales y los aliases compatibles aprobados

#### Scenario: Contexto ERP
- **WHEN** se presenta una superficie ERP
- **THEN** utiliza su paleta semántica contextual sin alterar colores de estado, capacidades, rutas ni significado institucional

### Requirement: Escalas visuales compartidas
La gobernanza SHALL documentar las escalas existentes para espaciado, radios, bordes, alturas, sombras, elevación, contenedores y breakpoints. Componentes nuevos o migrados SHALL evitar valores reutilizables arbitrarios sin justificación verificable.

#### Scenario: Nueva decisión visual transversal
- **WHEN** una modificación necesita una medida visual reutilizable
- **THEN** reutiliza una escala vigente o documenta consumidores, motivo y validación antes de proponer un token nuevo

#### Scenario: Revisión responsive
- **WHEN** se valida una superficie transversal
- **THEN** se comprueba al menos en 320, 375, 768, 1024 y 1440 píxeles sin overflow horizontal de página

### Requirement: Jerarquía tipográfica institucional
Componentes nuevos o adoptados progresivamente SHALL usar DM Sans como fuente general y SHALL reservar DM Serif Display para encabezados display aprobados, mediante la escala semántica documentada. Los consumidores heredados se preservan hasta su migración explícita.

#### Scenario: Texto de interfaz
- **WHEN** se presenta navegación, control, formulario, tabla, diálogo, reporte o texto corporal
- **THEN** su fuente semántica es DM Sans y la jerarquía no depende de introducir otra familia

#### Scenario: Encabezado display aprobado
- **WHEN** un encabezado requiere expresión institucional autorizada
- **THEN** puede usar DM Serif Display mediante el token semántico de heading y conserva jerarquía, legibilidad y contraste

### Requirement: Estados interactivos accesibles
Todo componente nuevo o adoptado progresivamente SHALL comunicar de forma perceptible y compatible con teclado sus estados aplicables de focus visible, hover, active, disabled, loading e invalid, sin depender únicamente del color. DS-F1 no certifica consumidores heredados.

#### Scenario: Navegación mediante teclado
- **WHEN** una persona recorre controles con teclado
- **THEN** el foco visible mantiene contraste, no queda oculto y el orden conserva la semántica de la interfaz

#### Scenario: Estado no disponible o en proceso
- **WHEN** un control está disabled o loading
- **THEN** impide acciones incompatibles y comunica su estado mediante semántica y texto o nombre accesible cuando corresponda

#### Scenario: Entrada inválida
- **WHEN** un campo contiene un error conocido
- **THEN** el campo y su mensaje quedan asociados programáticamente y el error no se comunica solo por color

### Requirement: Contraste, movimiento y adaptación
Todo componente nuevo o adoptado progresivamente SHALL demostrar WCAG 2.2 AA aplicable, teclado, reducción de movimiento y composición utilizable en breakpoints institucionales. DS-F1 define el gate; no certifica retroactivamente toda la aplicación.

#### Scenario: Contraste de contenido y controles
- **WHEN** se revisan texto, iconos funcionales, bordes de controles y foco
- **THEN** la evidencia registra cumplimiento de los umbrales WCAG 2.2 AA aplicables

#### Scenario: Preferencia de movimiento reducido
- **WHEN** el usuario activa `prefers-reduced-motion: reduce`
- **THEN** animaciones y transiciones no esenciales se reducen sin ocultar estado ni bloquear interacción

### Requirement: Responsabilidad y compatibilidad CSS
La gobernanza SHALL separar documentalmente tokens, base y estilos globales vigentes de reglas legacy. DS-F1 SHALL conservar CSS existente; modificaciones o retiros requieren un cambio posterior con inventario suficiente de consumidores.

#### Scenario: Inventario representativo legacy
- **WHEN** DS-F1 clasifica compatibilidad legacy
- **THEN** registra categorías, selectores críticos y consumidores representativos con riesgo y condición de retiro, sin pretender inventario exhaustivo

#### Scenario: Cambio CSS posterior
- **WHEN** un cambio posterior pretende modificar o retirar una regla legacy
- **THEN** amplía el inventario de los selectores afectados, demuestra consumidores y define evidencia visual y rollback antes de editar CSS

### Requirement: Contrato documental de formularios
La gobernanza frontend SHALL reconocer React Hook Form con Zod como patrón activo comprobado y SHALL describir TanStack Form únicamente como evaluación histórica o futura hasta que exista una adopción aprobada por separado.

#### Scenario: Consulta de convenciones de formularios
- **WHEN** una persona consulta el patrón vigente para formularios existentes o nuevos
- **THEN** encuentra React Hook Form y Zod sin una instrucción contradictoria que presente TanStack Form como activo

#### Scenario: Cambio futuro de herramienta
- **WHEN** se propone reemplazar o ampliar el patrón de formularios
- **THEN** se exige consumidor piloto, evidencia de necesidad, compatibilidad y cambio OpenSpec independiente

### Requirement: Gobernanza de componentes
La gobernanza SHALL distinguir primitivas genéricas, patrones reutilizables y componentes de dominio; SHALL preferir reutilización compatible de `shared/ui`; y SHALL exigir consumidores y contrato estable antes de crear una abstracción compartida.

#### Scenario: Componente genérico reutilizable
- **WHEN** un componente carece de lógica de negocio y tiene reutilización demostrada
- **THEN** puede pertenecer a `shared/ui` con propiedades tipadas, estados accesibles y compatibilidad documentada

#### Scenario: Componente de dominio
- **WHEN** un componente expresa permisos, estados, datos o reglas de un dominio
- **THEN** permanece en su feature y no se mueve a `shared/ui` para aparentar reutilización

#### Scenario: Variante nueva
- **WHEN** se propone una variante o propiedad compartida
- **THEN** se documentan necesidad, consumidores, estados, accesibilidad, compatibilidad y criterios de aceptación antes de adoptarla

#### Scenario: Familia pendiente
- **WHEN** una familia de componentes queda fuera del alcance de DS-F1
- **THEN** esta base no inventa su API, variantes ni estrategia de migración definitiva

### Requirement: Adopción gradual sin regresiones
Las adopciones futuras del sistema visual SHALL preservar contratos de componentes, comportamiento funcional, arquitectura `app → features → shared`, rutas, permisos y assets institucionales, sin exigir reorganización ni dependencias nuevas. DS-F1 actual es documental.

#### Scenario: Apply documental DS-F1
- **WHEN** se aplica DS-F1
- **THEN** solo cambian `frontend/CONVENTIONS.md` y seguimiento OpenSpec, sin CSS, APIs de componentes, formularios, calendarios, tablas, feedback, shell, backend, Prisma ni RBAC

#### Scenario: Evidencia de adopción
- **WHEN** una fase futura migra un consumidor
- **THEN** registra baseline, archivos afectados, evidencia visual y accesible, validación, riesgos y estrategia de rollback antes de retirar compatibilidad
