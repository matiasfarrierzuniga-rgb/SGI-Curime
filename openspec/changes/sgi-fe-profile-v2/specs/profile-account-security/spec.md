# Spec Delta

## Purpose

Define una experiencia clara, accesible y segura para que una persona autenticada reconozca su cuenta, consulte sus datos de sesión y gestione el cambio de contraseña desde Mi perfil, respetando las fuentes de verdad y políticas existentes.

## ADDED Requirements

### Requirement: Authenticated identity presentation
Mi perfil SHALL presentar la identidad de la sesión autenticada usando únicamente datos disponibles en la sesión real, con avatar generado desde el nombre disponible, correo, rol o roles entregados y estado solo cuando exista un valor confiable.

#### Scenario: Complete identity is available
- **WHEN** una persona autenticada abre Mi perfil y la sesión contiene nombre, correo, rol y estado
- **THEN** la pantalla muestra avatar por iniciales, nombre, correo, rol y estado con texto visible y comprensible

#### Scenario: Identity data is incomplete
- **WHEN** uno o más datos de identidad no están disponibles en la sesión
- **THEN** la pantalla no inventa valores y comunica cada ausencia de forma explícita y no ambigua

#### Scenario: Institutional role data is present
- **WHEN** la sesión contiene un rol o capacidad de autorización
- **THEN** Mi perfil representa ese dato como información de cuenta y no lo infiere desde cargos, nombramientos u otra información institucional

### Requirement: Read-only account information
Mi perfil SHALL mostrar la información personal y de acceso disponible como datos de solo lectura, sin ofrecer edición de identidad, correo, roles, capacidades ni asignaciones institucionales.

#### Scenario: Account details are consulted
- **WHEN** una persona autenticada consulta la sección de información de cuenta
- **THEN** puede leer los campos disponibles en una distribución compacta que se adapta a la pantalla, pero no puede modificarlos desde Mi perfil

#### Scenario: Optional account detail is absent
- **WHEN** un campo opcional no está presente
- **THEN** el campo conserva su etiqueta y muestra un tratamiento explícito de ausencia sin usar información ficticia

### Requirement: Secure password change
Mi perfil SHALL permitir solicitar cambio de contraseña con contraseña actual, contraseña nueva y confirmación, usando el contrato vigente de cambio de contraseña y sus reglas de seguridad como fuente de verdad.

#### Scenario: Valid password change is submitted
- **WHEN** la persona completa los tres campos válidos y confirma el cambio
- **THEN** el sistema envía una sola solicitud autenticada con los nombres y valores requeridos por el contrato backend vigente

#### Scenario: Confirmation does not match
- **WHEN** la contraseña nueva y su confirmación son diferentes
- **THEN** la pantalla muestra validación asociada al formulario o campo y no envía la solicitud

#### Scenario: Backend rejects the change
- **WHEN** el backend rechaza la contraseña actual, la política de contraseña, la diferencia requerida o cualquier otra condición de seguridad
- **THEN** la pantalla muestra el mensaje de error disponible de forma comprensible, conserva la posibilidad de corregir y no expone secretos

#### Scenario: Password change succeeds
- **WHEN** el backend confirma el cambio
- **THEN** la pantalla comunica éxito y elimina los valores de contraseña del formulario sin registrar ni conservar esos valores como datos de sesión

### Requirement: Independent password visibility controls
Mi perfil SHALL ofrecer control independiente para mostrar u ocultar cada uno de los tres campos de contraseña sin cambiar su valor ni el de los otros campos.

#### Scenario: One password field is revealed
- **WHEN** la persona activa mostrar u ocultar en un campo específico
- **THEN** solo cambia la visibilidad de ese campo, el control expone un nombre accesible y el valor permanece intacto

### Requirement: Submission and feedback states
Mi perfil SHALL impedir envíos duplicados y representar estados de carga, éxito y error con texto visible y controles operables.

#### Scenario: Request is pending
- **WHEN** la solicitud de cambio de contraseña está en curso
- **THEN** el control de envío queda ocupado o deshabilitado, informa la actividad y no inicia otra solicitud por activaciones repetidas

#### Scenario: Request fails recoverably
- **WHEN** una solicitud falla por una condición recuperable
- **THEN** el error se presenta sin bloquear permanentemente el formulario y la persona puede corregir o reintentar

### Requirement: Responsive and accessible profile experience
Mi perfil SHALL funcionar sin desplazamiento horizontal inesperado y ser operable por teclado con etiquetas, foco visible, semántica y mensajes asociados a sus campos en anchos de 375, 768, 1280 y 1440 píxeles.

#### Scenario: Profile is used on supported widths
- **WHEN** la persona usa Mi perfil en 375, 768, 1280 o 1440 píxeles
- **THEN** identidad, información, seguridad y acciones permanecen legibles, ordenadas y operables sin desbordamiento horizontal inesperado

#### Scenario: Password form is completed by keyboard
- **WHEN** la persona navega el formulario únicamente con teclado
- **THEN** alcanza campos y controles de visibilidad y envío en orden comprensible, distingue el foco y recibe mensajes de validación asociados al control correspondiente
