# Proposal

## Why

La pantalla administrativa **Mi perfil** ya permite consultar datos de sesión y cambiar la contraseña, pero su presentación es plana y el formulario no ofrece controles independientes para mostrar u ocultar cada secreto. Se propone un refinamiento institucional que haga más clara la identidad de la cuenta, separe visualmente información y seguridad, y mejore uso responsive y accesibilidad sin alterar autorización, datos personales ni contratos backend.

La revisión también debe resolver explícitamente una discrepancia vigente: el frontend modela el payload de cambio como `password/passwordConfirmation`, mientras el DTO backend `ChangePasswordDto` valida `newPassword/newPasswordConfirmation` para `PATCH /auth/change-password`. Esto queda como compatibilidad de integración del frontend; no implica cambiar el endpoint ni sus reglas.

## What Changes

- Reorganizar `Mi perfil` dentro de la pantalla existente para presentar una cabecera de identidad con avatar por iniciales, nombre, correo, rol(es) disponibles y estado únicamente si la sesión lo entrega de forma confiable.
- Reestructurar la información de cuenta como datos de solo lectura, con valores ausentes tratados explícitamente y sin permitir edición de identidad, roles o capacidades.
- Separar la sección de seguridad y refinar el formulario con contraseña actual, nueva contraseña y confirmación.
- Incorporar visibilidad independiente por campo de contraseña, nombres accesibles, foco visible y mensajes de validación asociados.
- Mantener validación alineada con el backend, traduciendo/adaptando el payload en la frontera frontend si es necesario, sin inventar requisitos adicionales.
- Conservar prevención de envíos duplicados, estados de carga, éxito y error; limpiar los valores de contraseña después de una operación satisfactoria y no registrarlos.
- Ajustar composición a 375, 768, 1280 y 1440 px sin desplazamiento horizontal inesperado.
- Ampliar pruebas focalizadas de `ProfilePage` y, si corresponde, de la integración `authService` para cubrir identidad, campos ausentes, visibilidad, validación, payload real, estados y accesibilidad.

## Capabilities

### New Capabilities
- `profile-account-security`: presentación de identidad y cuenta autenticada, junto con el flujo accesible y seguro de cambio de contraseña en Mi perfil.

### Modified Capabilities
- Ninguna.

## Impact

- **Frontend confirmado:** `frontend/src/features/profile/ui/ProfilePage.tsx`, `frontend/src/features/profile/ui/ProfilePage.test.tsx` y posiblemente el contrato de transporte de `frontend/src/features/auth/api/auth.api.ts` y sus tipos/pruebas.
- **Componentes reutilizables:** `FormField`, `Input`, `Button`, `Card`, `Alert`, `StatusBadge`, `PageHeader` y tokens Tailwind existentes; no se prevén dependencias nuevas.
- **Backend preservado:** `PATCH /auth/change-password`, guard JWT, `ChangePasswordDto`, política de contraseña, revocación de sesiones y auditoría permanecen como fuente de verdad. No se modifican API, RBAC, Prisma, migraciones ni datos.
- **Rutas preservadas:** `/profile` y `/app/profile` continúan renderizando la pantalla existente; Sidebar, Header y Dashboard quedan fuera del alcance.
- **Validación posterior:** pruebas frontend focalizadas, lint, arquitectura, build y revisión visual responsive. La fase PROPOSE no ejecuta implementación ni esas verificaciones de código.
