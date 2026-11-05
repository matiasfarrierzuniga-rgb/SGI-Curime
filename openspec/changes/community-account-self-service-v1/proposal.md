# Proposal

## Why

El registro público actual crea `UserRequest(PENDING)` y exige revisión administrativa, una `Person` preexistente e identificación legal antes de que una persona pueda activar su acceso. La comunidad necesita una cuenta básica autocontenida que pruebe control del correo, sin confundirlo con identidad legal, afiliación ni autorización institucional.

## What Changes

- Añadir registro comunitario público con nombre, correo, contraseña y confirmación de correo, sin aprobación administrativa para una cuenta básica.
- Mantener `POST /register` histórico como creación de `UserRequest(PENDING)` y exponer un contrato público separado para registro y reenvío comunitario; conservar solicitudes, cuentas, tokens, sesiones y roles existentes.
- **BREAKING (schema, migration required):** hacer `User.identification` nullable para prohibir identificaciones ficticias; añadir estado explícito de correo pendiente de verificar, preservando `INACTIVE` para activación administrativa heredada y `BLOCKED` sin reactivación por correo.
- Crear rol persistido `Cuenta comunitaria` sin capacidades ERP ni administrativas, y un espacio autenticado mínimo `Mi Comunidad` fuera de `/app`.
- Reutilizar token de activación hasheado para verificación comunitaria con consumo atómico, vencimiento, invalidación de token previo y reenvío limitado; no emitir sesión antes de verificar.
- Registrar auditoría operativa segura sin token en claro, y definir respuesta neutral para registro/reenvío para reducir enumeración.

## Capabilities

### New Capabilities
- `identity/community-account-self-service`: Registro, verificación de correo, activación y acceso mínimo de una cuenta comunitaria sin identidad legal ni privilegios institucionales.

### Modified Capabilities
- `affiliate-requests`: Mantener explícitamente la independencia entre solicitud/afiliación y la nueva cuenta comunitaria autenticada.

## Impact

- Persistencia: migración Prisma aditiva de `User.identification`, `UserStatus` y rol comunitario; no crea `Person`, `Affiliate`, vínculos de emprendimiento ni cambios destructivos.
- Backend: DTOs y casos de uso públicos nuevos, uso compatible de `AccountActivationToken`, control de tasa, entrega de correo, RBAC persistido, auditoría y contratos HTTP.
- Frontend: `/register`, confirmación neutral, reenvío, verificación, login y ruta autenticada `Mi Comunidad`; guards impiden ERP y contenido protegido.
- Trazabilidad: CU-20, CU-21 y CU-22 se proponen como referencias V2 `NOT_VERIFIED`; catálogo V2 fuente no está incorporado localmente.
