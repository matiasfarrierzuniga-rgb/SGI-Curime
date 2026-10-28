# Spec Delta

## Purpose

Define la presentación responsive y el comportamiento preservado del formulario público de afiliación, usando el wireframe aprobado como referencia visual obligatoria.

## ADDED Requirements

### Requirement: Composición fiel al wireframe aprobado
La ruta `/afiliacion` SHALL presentar cabecera introductoria, tarjeta principal, Stepper, panel del paso activo y acciones con la jerarquía, proporciones y superficies definidas por el wireframe aprobado.

#### Scenario: Visitante abre el formulario en desktop
- **WHEN** un visitante abre `/afiliacion` con un viewport de al menos 1024 px
- **THEN** la cabecera, tarjeta, Stepper, panel y acciones aparecen como una composición centrada y visualmente continua bajo el navbar institucional

#### Scenario: Referencia visual no está disponible durante validación
- **WHEN** se intenta aprobar visualmente la implementación sin poder visualizar el wireframe original
- **THEN** la fidelidad visual permanece `NOT_VERIFIED` y el cambio no se considera validado

### Requirement: Flujo secuencial de tres pasos
El formulario SHALL conservar el orden `Identidad → Contacto → Solicitud`, mostrar el paso activo y exigir la validación vigente del paso antes de avanzar.

#### Scenario: Visitante avanza con datos válidos
- **WHEN** los campos requeridos del paso activo cumplen el esquema vigente y el visitante selecciona continuar
- **THEN** el formulario muestra el siguiente paso y conserva los valores ingresados previamente

#### Scenario: Visitante intenta avanzar con datos inválidos
- **WHEN** uno o más campos requeridos del paso activo no cumplen el esquema vigente
- **THEN** el formulario permanece en ese paso y muestra los errores accesibles existentes

#### Scenario: Visitante regresa a un paso anterior
- **WHEN** el visitante selecciona regresar desde Contacto o Solicitud
- **THEN** el formulario muestra el paso anterior sin perder valores ya capturados

### Requirement: Distribución específica de cada paso
Cada paso SHALL organizar sus campos según la agrupación aprobada, sin cambiar nombres, obligatoriedad, tipos de control ni semántica definidos por el contrato funcional vigente.

#### Scenario: Paso Identidad en desktop
- **WHEN** Identidad está activo en un viewport de al menos 1024 px
- **THEN** tipo de identificación, número y estado de Hacienda forman la primera fila, y nombre y apellidos forman una segunda fila de tres columnas

#### Scenario: Paso Contacto en desktop
- **WHEN** Contacto está activo en un viewport de al menos 1024 px
- **THEN** teléfono y correo forman una fila de dos columnas y dirección ocupa el ancho completo debajo

#### Scenario: Paso Solicitud en desktop
- **WHEN** Solicitud está activo en un viewport de al menos 1024 px
- **THEN** fecha de nacimiento y género comparten una fila, ocupación y lugar de trabajo comparten otra, y el motivo ocupa el ancho completo

### Requirement: Consulta de identidad preservada
El formulario MUST conservar consulta automática de Hacienda, debounce de 500 ms, caché, descarte de respuestas obsoletas, autocompletado editable y fallback manual.

#### Scenario: Hacienda encuentra la identidad
- **WHEN** una identificación nacional válida produce una respuesta vigente
- **THEN** el formulario completa los nombres disponibles, permite editarlos y muestra confirmación textual compacta

#### Scenario: Hacienda no está disponible
- **WHEN** la consulta falla o no permite completar la identidad
- **THEN** el formulario comunica el ingreso manual y mantiene editables los campos de identidad

#### Scenario: Llega una respuesta obsoleta
- **WHEN** una consulta anterior responde después de iniciarse una consulta para otra identificación
- **THEN** la respuesta anterior no reemplaza los valores correspondientes a la identificación vigente

### Requirement: Adaptación responsive sin overflow
El formulario SHALL permanecer legible, operable y sin overflow horizontal en desktop, tablet y móvil, manteniendo el Stepper y la jerarquía de acciones.

#### Scenario: Viewport tablet
- **WHEN** el ancho está entre 768 px y 1023 px
- **THEN** el Stepper permanece horizontal, los campos se distribuyen en una o dos columnas según espacio y el estado de Hacienda no comprime los controles

#### Scenario: Viewport móvil
- **WHEN** el ancho está entre 320 px y 767 px
- **THEN** los campos se apilan en una columna, el Stepper conserva tres indicadores conectados y las acciones ocupan el ancho disponible con objetivos táctiles de al menos 44 px

### Requirement: Contratos funcionales y globales intactos
La reproducción visual MUST mantener schema, payload, envío, modelo Person-first, accesibilidad y componentes globales existentes sin introducir cambios de API, backend, persistencia, autorización o rutas.

#### Scenario: Visitante envía una solicitud válida
- **WHEN** completa los tres pasos con datos válidos y confirma el envío
- **THEN** se ejecuta una sola solicitud mediante el mapeo y servicio existentes y se muestra el resultado vigente

#### Scenario: Wireframe contradice obligatoriedad vigente
- **WHEN** una marca visual del wireframe difiere de la obligatoriedad definida por Zod
- **THEN** etiqueta, asterisco y validación permanecen alineados con Zod y la diferencia se registra como limitación visual

#### Scenario: Navegación mediante teclado
- **WHEN** el visitante opera campos, calendario, Stepper y acciones mediante teclado
- **THEN** nombres accesibles, orden de foco, mensajes y foco visible permanecen utilizables
