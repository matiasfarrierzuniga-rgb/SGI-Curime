# Design

## Context

Ver `proposal.md` para motivación y `specs/public-affiliation-request-form/spec.md` para comportamiento normativo. La implementación actual ya contiene flujo, servicios y controles correctos; la brecha está en composición local de `AffiliationPage.tsx`: ancho de 1024 px, espaciado acumulado, geometría del Stepper, densidad de superficies, alturas mixtas y distribución tablet.

El wireframe aprobado visible en la conversación es referencia obligatoria. No existe una copia local con nombre `Wireframe de afiliación Curime.png`; por tanto, una futura validación visual requiere conservar acceso a esa imagen o recibir el archivo original.

## Goals / Non-Goals

**Goals:**

- Traducir cada región del wireframe a composición JSX y Tailwind local.
- Fijar dimensiones y breakpoints suficientes para una implementación en una sola pasada.
- Mantener arquitectura `app → features → shared`, semántica, foco y comportamiento del formulario.
- Permitir comparación visual reproducible en 1440 px, 1024 px, 768 px, 390 px y 320 px.

**Non-Goals:**

- Modificar componentes compartidos, tokens globales o layout público.
- Cambiar textos funcionales, campos, obligatoriedad, schema, payload o servicios.
- Convertir el Stepper en navegación libre.
- Introducir dependencias, animaciones, endpoints, modelos o estados nuevos.

## Decisions

### 1. Un único límite de implementación

Toda corrección se realizará en `frontend/src/pages/public/AffiliationPage.tsx`, mediante estructura y clases locales. `PublicHeader`, `PublicFooter`, `SectionContainer`, `FormField`, `PhoneField`, `DatePicker` y primitives compartidos quedan intactos.

**Razón:** la exploración ubicó las diferencias en composición de página, no en contratos compartidos.
**Alternativa descartada:** cambiar tokens o primitives globales; alteraría otras pantallas.

### 2. Contrato dimensional

| Región | Desktop ≥1024 px | Tablet 768–1023 px | Móvil 320–767 px |
|---|---:|---:|---:|
| Ancho de contenido | `max-width: 1100px` | ancho disponible | ancho disponible |
| Gutter lateral | 24–32 px | 24 px | 16 px; 20 px desde 375 px |
| Navbar → cabecera | 24 px | 20–24 px | 16–20 px |
| Cabecera → tarjeta | 16 px | 16 px | 12 px |
| Tarjeta → footer/fin de sección | 40–48 px | 36–40 px | 32 px |
| Padding tarjeta exterior | 20 px | 16 px | 12 px |
| Padding panel interior | 28–32 px | 24 px | 16 px |
| Gap entre campos | 20 px | 16 px | 16 px |
| Altura de controles | 48 px | 48 px | 48 px |
| Textarea | mínimo 112 px | mínimo 112 px | mínimo 112 px |
| Botones | 44 px mínimo | 44 px mínimo | 44 px mínimo y ancho completo |
| Círculo Stepper | 36 px | 34 px | 32 px |

Valores se implementarán con utilidades Tailwind equivalentes (`max-w-[68.75rem]`, `h-12`, `min-h-11`, paddings y gaps explícitos). No se crearán tokens globales para una sola página.

### 3. Composición de superficies

- Fondo de sección: superficie marfil/crema institucional continua; no agregar hero ni franja nueva.
- Cabecera introductoria: título y descripción a la izquierda, bloque comunitario a la derecha en desktop; apilados en tablet estrecha y móvil.
- Tarjeta exterior: una superficie blanca cálida, borde sage sutil, radio institucional y una sombra de nivel superficie.
- Stepper: primera región interna de la tarjeta, sin tarjeta independiente ni sombra propia.
- Panel del paso: superficie secundaria ligeramente contrastada, borde sutil, sin competir con tarjeta exterior.
- Alertas y estados: fondos semánticos existentes, icono más texto; nunca color como único indicador.

**Alternativa descartada:** eliminar el panel interior. El wireframe distingue Stepper, área de captura y acciones mediante dos niveles de superficie.

### 4. Geometría del Stepper

- Tres columnas de igual ancho.
- Indicador circular centrado en cada columna.
- Conector horizontal desde el borde del círculo actual hasta el borde del siguiente, centrado verticalmente respecto a círculos.
- Estado completado: marca de verificación; estado activo: número y énfasis primario; futuro: número y tratamiento neutro.
- Títulos siempre visibles. Descripción secundaria visible desde 1024 px; oculta por debajo para evitar compresión.
- Padding: 20 px horizontal y 12 px vertical en desktop; 8–12 px en móvil.
- Stepper sigue siendo indicador; avanzar continúa dependiendo de `form.trigger(stepFields[step])`.

### 5. Distribución por paso

**Identidad**

- Desktop: fila 1 con proporciones aproximadas `0.95fr / 1.1fr / 1fr` para tipo, identificación y estado Hacienda; fila 2 de tres columnas iguales para nombre y apellidos.
- Tablet: tipo e identificación en dos columnas; estado Hacienda ocupa fila completa. Nombres usan dos columnas cuando quepan y el último campo baja sin overflow.
- Móvil: una columna para todos los controles y mensajes.
- Confirmación Hacienda junto a la cédula en desktop; debajo en tablet/móvil. Aviso de procedencia debajo de nombres solo cuando existe resultado.

**Contacto**

- Desktop/tablet amplia: teléfono y correo en dos columnas iguales; dirección ocupa fila completa.
- Tablet estrecha/móvil: una columna.
- `PhoneField` permanece como control internacional actual; solo recibe composición local para altura visual de 48 px.

**Solicitud**

- Desktop/tablet amplia: fecha/género y ocupación/lugar de trabajo en pares de columnas; motivo ocupa fila completa.
- Tablet estrecha/móvil: una columna.
- `DatePicker` permanece intacto y establece la referencia de altura de 48 px.

### 6. Acciones

- Acciones separadas del contenido mediante 20–24 px y borde superior sutil solo si aparece en el wireframe.
- Desktop/tablet: Cancelar o Regresar a la izquierda; Continuar o Enviar a la derecha.
- Móvil: columna, botones al 100 % y orden visual que conserva primario antes que acción de abandono sin cambiar orden lógico de foco.
- Primario usa variante existente; secundarios usan variante outline/ghost existente. Se elimina `size="sm"` donde produzca 36 px y se fija mínimo de 44 px.

### 7. Correspondencia wireframe → implementación

| Región del wireframe | JSX responsable | Contrato Tailwind local |
|---|---|---|
| Separación bajo navbar | `SectionContainer`/wrapper raíz de `AffiliationPage` | Sobrescribir composición local a 16–24 px superiores; no tocar `PublicHeader` |
| Fondo crema | wrapper raíz | superficie institucional existente, continua hasta footer |
| Cabecera | `AffiliationIntro` | grid desktop con bloque comunitario lateral; stack responsive; gap 12–16 px |
| Contenedor principal | wrapper de intro + `form` | `max-w-[68.75rem] mx-auto`, gutters responsive |
| Tarjeta exterior | `form` | borde sage, superficie blanca, radio institucional, padding 12/16/20 px, una sombra |
| Stepper | `Stepper` | tres columnas iguales, círculos 32/34/36 px, conectores centrados |
| Error de envío | alerta `requestError` | bloque semántico dentro de tarjeta, ancho completo, icono y texto |
| Panel interior | `fieldset` y wrapper del paso | superficie secundaria, borde sutil, padding 16/24/32 px |
| Encabezado de paso | `StepHeading` | icono, título y ayuda con jerarquía compacta; sin tarjeta adicional |
| Identidad fila 1 | primer grid de `IdentityStep` | tres columnas desktop; dos + estado completo tablet; una móvil |
| Estado Hacienda | `LookupFeedback` | mínimo 44 px, junto a cédula desktop, debajo en menores |
| Identidad fila 2 | segundo grid de `IdentityStep` | tres columnas desktop; dos/una responsive |
| Contacto | `ContactStep` | dos columnas + dirección completa; una columna móvil |
| Solicitud | `RequestStep` | dos pares de columnas + motivo completo; una columna móvil |
| Etiquetas/asteriscos | wrapper local `Field` → `FormField` | conservar semántica y required derivado del contrato vigente |
| Controles | `Input`, `Select`, `PhoneField`, `DatePicker`, `Textarea` | 48 px visuales; textarea mínimo 112 px; foco existente |
| Acciones | bloque inferior del `fieldset` | 44 px mínimo; extremos desktop; ancho completo móvil |
| Espacio antes del footer | wrapper raíz | 32–48 px inferiores; no tocar `PublicFooter` |

### 8. Protección funcional

No se editarán ni reordenarán estas unidades lógicas:

- `useForm`, `zodResolver`, `affiliationSchema` y valores por defecto.
- debounce de 500 ms, `identityCache`, `lookupSequence` y `lookupIdentity`.
- escritura editable de nombres recibidos de Hacienda.
- `stepFields`, `form.trigger`, persistencia de valores y foco de encabezado.
- `submitLock`, `mapAffiliationFormToRequest`, `affiliateRequestsService.create` y manejo de errores.
- tipos de identificación, límites, sanitización numérica y estados `idle/loading/found/unavailable`.
- `PhoneField`, `DatePicker`, labels accesibles y mensajes asociados.

Cambios permitidos: wrappers JSX presentacionales, orden visual dentro de la misma región semántica, clases Tailwind locales y uso de tamaños ya disponibles de `Button`.

### 9. Criterios de aceptación visual verificables

1. Capturas a 1440 px y 1024 px muestran contenido centrado de máximo 1100 px, sin franja superior excesiva.
2. A 1440 px, Identidad presenta exactamente `tipo / identificación / Hacienda` y luego tres campos nominales.
3. A 768 px no existe overflow; Hacienda ocupa ancho completo y no reduce controles por debajo de un ancho utilizable.
4. A 390 px y 320 px todos los campos se apilan, Stepper conserva tres círculos y dos conectores, y botones miden al menos 44 px.
5. Input, Select, PhoneField y DatePicker se perciben alineados a 48 px; textarea mantiene mínimo de 112 px.
6. Cabecera, Stepper, panel y acciones coinciden con orden, superficies y densidad del wireframe mediante comparación lado a lado.
7. Estados loading, found, unavailable, error y disabled son textuales, caben sin overflow y conservan contraste/foco.
8. Navbar y footer no presentan diferencias respecto a su versión anterior.
9. Si no está disponible el wireframe original durante revisión, resultado visual se reporta `NOT_VERIFIED`.

## Risks / Trade-offs

- [Wireframe solo disponible en conversación] → conservarlo como referencia de revisión o solicitar archivo original antes de validación final.
- [Asteriscos del wireframe contradicen Zod] → prevalece Zod; registrar diferencia y no simular obligatoriedad.
- [Clases descendientes sobre `PhoneField` o `DatePicker`] → limitar a altura/composición; no alterar lógica, teclado ni popover.
- [Breakpoints pueden diferir entre captura y contenido real] → validar anchos de 320, 390, 768, 1024 y 1440 px con textos y errores visibles.
- [Reordenamiento visual afecta foco] → mantener orden DOM lógico y usar layout CSS, no `order`, para acciones y campos.
- [Una sola pasada reduce margen de iteración] → implementar por regiones contra esta tabla y completar comparación visual antes de aceptar.

## Migration Plan

1. Aplicar composición local en `AffiliationPage.tsx` sin cambios de contrato.
2. Revisar estados y breakpoints definidos en criterios de aceptación.
3. Si falla funcionalidad o fidelidad, revertir únicamente cambios presentacionales de ese archivo; no existe migración de datos ni rollback de API.

## Limitaciones que requieren decisión humana

- Confirmar si teléfono y segundo apellido deben continuar opcionales y dirección obligatoria. Este cambio conserva Zod vigente; cualquier alteración requiere cambio funcional separado.
- Proveer o custodiar el archivo original del wireframe para una validación visual futura independiente de esta conversación.
- Relacionar identificadores CU V2 cuando la fuente inmutable del catálogo esté disponible; hasta entonces permanecen `NOT_VERIFIED`.
