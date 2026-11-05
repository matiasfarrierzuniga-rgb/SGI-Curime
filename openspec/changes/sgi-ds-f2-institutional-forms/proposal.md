# Proposal

## Why

SGI-Curime ya tiene tokens institucionales, primitives compartidos y dependencias de React Hook Form + Zod, pero su adopción es incompleta: los formularios de Junta, Asambleas y Afiliados mezclan controles nativos, estado manual y validaciones locales. DS-F2 debe cerrar el contrato compartido y demostrarlo en un formulario institucional real sin abrir una migración riesgosa de cuatro módulos a la vez.

## What Changes

- Formalizar el contrato accesible de `FormField`, `Input` y `Select`: asociación label/control, descripción, error, requerido, `aria-invalid`, foco visible, disabled y tamaños táctiles.
- Añadir pruebas focalizadas de primitives y estados de formulario, incluyendo teclado y mensajes accesibles.
- Migrar el formulario de edición de Perfil institucional a React Hook Form + Zod y primitives compartidos, preservando pasos, payload nullable, normalización, API, capabilities y mensajes actuales.
- Dejar explícitamente fuera de este incremento la migración funcional de Junta Directiva, Asambleas y Afiliados; esos procesos quedan como PBIs dependientes, sin duplicar cambios OpenSpec existentes.
- No modificar endpoints, Prisma, migraciones, permisos, rutas ni reglas legales/institucionales.

## Capabilities

### New Capabilities

- `design-system/form-controls`: Controles de captura compartidos, accesibles y verificables para formularios institucionales.

### Modified Capabilities

- Ninguna.

## Impact

- **Frontend:** `frontend/src/shared/ui/FormField.tsx`, `input.tsx`, `select.tsx`, pruebas de primitives y `frontend/src/features/institutional-profile/`.
- **Contratos preservados:** `/institutional-profile`, payload `UpdateInstitutionalProfileInput`, valores `null`, capabilities `adm.institutional-profile.read/update` y flujo de cuatro pasos.
- **Sin impacto:** backend, Prisma, API, autenticación, autorización, Junta Directiva, Asambleas, Afiliados y sitio público.
- **Trazabilidad:** estado actual DS-F2 `PARTIAL`; Perfil institucional `PARTIAL` con API, UI y pruebas existentes; Junta, Asambleas y Afiliados `PARTIAL` para este frente por adopción de formularios y/o reconciliación de autorización pendiente.
