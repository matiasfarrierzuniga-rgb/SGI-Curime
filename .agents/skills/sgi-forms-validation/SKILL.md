---
name: sgi-forms-validation
description: Definir formularios, validación y UX de captura de datos en el frontend SGI-Curime. Usar al crear o modificar formularios, campos, autenticación y manejo de envíos; mantener al backend como fuente de verdad.
---

# Formularios y validación de SGI-Curime

## Principio

"Entre menos escriba la gente, mejor."

Reducir la escritura mediante autocomplete, selects, autofill, reutilización de datos existentes, campos derivados y búsqueda o autocompletado cuando corresponda.

## Fuente de verdad

El frontend ayuda a prevenir y explicar errores, pero el backend sigue siendo la fuente de verdad. No duplicar reglas que ya existen en `frontend/src/utils/formValidation.ts`; reutilizarlas o centralizar allí la lógica compartida.

## Identificación

- `NATIONAL`: exactamente 9 dígitos, solo números y no inicia en `0`.
- `DIMEX`: exactamente 12 dígitos y solo números.
- Usar `type="text"` e `inputMode="numeric"`.
- No usar `type="number"` para identificaciones.

## Teléfono

Modelar el teléfono como `countryCode` y `nationalNumber`.

Para Costa Rica, usar `+506` y 8 dígitos. Para números internacionales, respetar las reglas actuales del proyecto.

## Correo electrónico

Aplicar `trim`, convertir a minúsculas, validar el formato, limitar a 254 caracteres y usar `autocomplete="email"`.

## UX de formularios

- Mostrar errores inline y asociarlos al campo correspondiente.
- No usar `window.alert` ni `window.confirm` para flujos importantes.
- Bloquear el doble submit.
- Deshabilitar el botón durante requests y mostrar un estado de carga.
- Conservar los datos del formulario cuando falla una request.
- Mostrar mensajes claros y accionables.

## Autocomplete

- Nombre: `autocomplete="name"`.
- Correo: `autocomplete="email"`.
- Login: `autocomplete="username"`.
- Contraseña de login: `autocomplete="current-password"`.
- Contraseña nueva: `autocomplete="new-password"`.
- Teléfono: usar los tokens HTML estándar correspondientes, como `tel-country-code` y `tel-national` según el campo.
