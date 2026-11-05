# Spec Delta

## Purpose

Esta capacidad define superficies administrativas visualmente consistentes, accesibles y responsive, con contratos compartidos para captura, filtros, listados, estados y acciones sin alterar comportamiento de negocio.

## ADDED Requirements

### Requirement: Administrative controls share a consistent interaction contract

Los controles administrativos de texto, búsqueda, número, correo, fecha, textarea y select SHALL conservar una altura, borde, radio, padding, foco visible, disabled y error coherentes con el contrato institucional vigente.

#### Scenario: Enabled control receives keyboard focus
- **WHEN** una persona enfoca un control habilitado mediante teclado
- **THEN** el control SHALL mostrar un indicador de foco visible, conservar su etiqueta y no desplazar ni ocultar el contenido adyacente

#### Scenario: Invalid or disabled control is rendered
- **WHEN** un control tiene error o está deshabilitado
- **THEN** SHALL comunicar el estado semánticamente, conservar contraste legible y prevenir interacción cuando corresponda

### Requirement: Labels and feedback remain associated with controls

Cada control administrativo SHALL tener nombre accesible asociado y SHALL exponer descripción, error y requerido mediante texto visible y relaciones semánticas cuando esos estados existan.

#### Scenario: Field displays validation feedback
- **WHEN** una validación falla
- **THEN** el mensaje SHALL estar asociado al control, indicar el problema en texto y no depender solo del color, icono o placeholder

#### Scenario: Filter has no visible label space
- **WHEN** un filtro usa una presentación compacta
- **THEN** SHALL conservar un nombre accesible equivalente aunque la etiqueta visible esté abreviada o visualmente oculta

### Requirement: Forms reduce effort and prevent avoidable errors

Los formularios administrativos SHALL usar lenguaje claro, agrupación comprensible, autocomplete pertinente y validación inline, conservando valores ante error y evitando doble envío.

#### Scenario: Person completes a form with an avoidable repeated value
- **WHEN** el dato puede completarse mediante autocomplete, selección o información ya disponible
- **THEN** la interfaz SHALL preferir esa vía antes que exigir escritura manual redundante

#### Scenario: Form submission is pending or fails
- **WHEN** una solicitud está pendiente o devuelve error
- **THEN** SHALL deshabilitar el envío duplicado, comunicar el progreso, conservar los valores y ofrecer un mensaje accionable asociado al problema

### Requirement: Search and filters are predictable

Las búsquedas y filtros administrativos SHALL indicar qué campo se consulta, cuándo se aplican, cómo se limpian y qué resultados afectan, sin inventar parámetros ni estados de dominio.

#### Scenario: Filter changes the result set
- **WHEN** una persona cambia un filtro soportado
- **THEN** SHALL comunicarse el resultado actualizado, reiniciarse la paginación cuando corresponda y conservarse visibles los filtros activos

#### Scenario: No result matches active filters
- **WHEN** la consulta válida no devuelve resultados
- **THEN** el vacío SHALL explicar que no hubo coincidencias y SHALL ofrecer limpiar o ajustar filtros cuando esa acción sea válida

### Requirement: Navigation and actions are learnable and truthful

Las pantallas administrativas SHALL usar títulos, acciones y mensajes consistentes en lenguaje de usuario, con una jerarquía visual que distinga acción primaria, secundaria, destructiva y cancelación.

#### Scenario: Person unfamiliar with the system reaches a module
- **WHEN** una persona abre una pantalla administrativa
- **THEN** SHALL identificar contexto, objetivo principal, estado actual y siguiente acción en lenguaje sencillo sin depender de conocimiento técnico

#### Scenario: Destructive or irreversible action is available
- **WHEN** una acción puede rechazar, desactivar, cancelar o eliminar
- **THEN** SHALL explicitar su consecuencia, requerir confirmación cuando corresponda y no usar un icono o color como única señal

### Requirement: Mobile administrative experience remains complete

Las superficies administrativas SHALL ser operables en 320, 375 y 768 píxeles, preservando lectura, acciones esenciales, foco y acceso a datos sin overflow accidental.

#### Scenario: Dense table is opened on mobile
- **WHEN** una tabla excede el ancho disponible
- **THEN** SHALL ofrecer scroll horizontal identificado o una vista compacta equivalente, manteniendo visibles las acciones esenciales y sin romper el orden de lectura

#### Scenario: Dialog or filter actions render on mobile
- **WHEN** un diálogo, filtro o formulario se muestra en viewport estrecho
- **THEN** SHALL conservar botones alcanzables, orden lógico, foco visible y cierre operable sin que contenido quede fuera de pantalla

### Requirement: Accessibility quality is verified at WCAG 2.2 AA targets

La estandarización SHALL verificar teclado, nombres accesibles, foco no oculto, contraste, objetivos táctiles y comunicación no dependiente del color, además de pruebas automatizadas focalizadas.

#### Scenario: Interactive surface is audited
- **WHEN** se revisa una pantalla migrada con teclado, árbol accesible o axe
- **THEN** no SHALL existir control sin nombre, foco invisible/oculto, trampa de teclado, error sin asociación o estado comunicado solo por color

#### Scenario: Motion or transition is present
- **WHEN** una superficie usa animación o transición
- **THEN** SHALL respetar `prefers-reduced-motion` y la transición SHALL comunicar una respuesta de usuario o relación espacial, no decoración obligatoria

### Requirement: Filter rows preserve alignment and responsive order

Las barras y paneles de filtros SHALL alinear etiquetas, controles y acciones en una secuencia comprensible, sin botones desplazados por alturas variables y sin requerir scroll horizontal para completar la acción principal.

#### Scenario: Filters have different supporting text
- **WHEN** un filtro muestra ayuda o error adicional junto a otros filtros
- **THEN** las acciones SHALL mantener alineación intencional y el orden de lectura SHALL seguir siendo correcto

#### Scenario: Filters render on a narrow viewport
- **WHEN** la pantalla mide 320, 375 o 768 píxeles de ancho
- **THEN** los controles y acciones SHALL reflowar, conservar objetivos táctiles operables y no quedar recortados

### Requirement: Administrative tables use a common readable structure

Los listados administrativos SHALL presentar encabezados semánticos, separación de filas, jerarquía de acciones y estados textuales coherentes; el contenido SHALL permanecer legible cuando existan muchas columnas.

#### Scenario: Table has row actions
- **WHEN** una fila ofrece acciones
- **THEN** cada acción SHALL tener nombre accesible, prioridad visible y foco navegable sin depender del hover

#### Scenario: Table exceeds available width
- **WHEN** las columnas no caben en el viewport
- **THEN** el listado SHALL ofrecer overflow horizontal identificado y usable, o una composición equivalente de tarjetas/lista, sin ocultar datos o acciones esenciales

### Requirement: Lists expose truthful loading, empty and error states

Cada listado administrativo SHALL distinguir carga, vacío, error recuperable y datos disponibles mediante texto o roles accesibles, sin presentar datos obsoletos como resultado actual.

#### Scenario: List request is pending
- **WHEN** una consulta está cargando
- **THEN** la superficie SHALL comunicar carga y SHALL evitar que un resultado previo se interprete como respuesta actual

#### Scenario: List has no results or fails
- **WHEN** el resultado está vacío o la consulta falla
- **THEN** SHALL mostrar un mensaje específico y, ante error recuperable, una acción de reintento operable

### Requirement: Status, badges and icon actions communicate meaning without color alone

Los estados administrativos SHALL usar texto visible además de color, y los iconos interactivos SHALL tener nombre accesible, área operable y estados hover, focus-visible y disabled coherentes.

#### Scenario: Status changes
- **WHEN** una entidad muestra estado operativo, aprobación, afiliación o disponibilidad
- **THEN** el estado SHALL ser comprensible por texto y conservar contraste suficiente en todas sus variantes

#### Scenario: Icon-only action is rendered
- **WHEN** una acción se presenta solo con icono
- **THEN** SHALL exponer nombre accesible, foco visible y objetivo táctil mínimo sin depender de tooltip o color

### Requirement: Pagination remains consistent and keyboard operable

Los listados paginados SHALL presentar contexto de página y total, controles anterior/siguiente con disabled correcto, foco visible y etiqueta de navegación coherente.

#### Scenario: First or last page is reached
- **WHEN** la persona está en la primera o última página
- **THEN** el control que no tiene destino SHALL quedar deshabilitado y no ejecutar una consulta inválida

#### Scenario: Page changes
- **WHEN** la persona cambia de página
- **THEN** la interfaz SHALL comunicar el nuevo contexto y conservar filtros activos sin inventar parámetros de API

### Requirement: Standardization preserves functional and authorization contracts

La migración visual SHALL conservar rutas, capacidades, contratos API, estados de dominio, permisos efectivos y propiedad de server state; ocultar o estilizar un control SHALL NOT conceder acceso.

#### Scenario: Direct protected route is opened
- **WHEN** una persona sin capacidad abre directamente un módulo administrativo
- **THEN** SHALL mantenerse el guard existente y no SHALL renderizarse información privilegiada por efecto de la estandarización

#### Scenario: Existing administrative action is migrated
- **WHEN** una pantalla cambia de control local a primitive compartida
- **THEN** SHALL conservar payload, endpoint, invalidación, mensajes de negocio y reglas de visibilidad existentes
