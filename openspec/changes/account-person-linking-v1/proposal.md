# Proposal

## Why

La administración necesita distinguir identidad canónica, afiliación, nombramiento institucional y acceso SGI al revisar integrantes de Junta Directiva. Hoy una cuenta comunitaria puede existir sin `Person`, pero no hay un contrato administrativo explícito y seguro para vincularla a una Persona canónica ya verificada.

La relación `User.personId` es única y nullable, pero la reconciliación Person-first Stage C permanece incompleta. Un enlace manual debe ser explícito, autorizado, transaccional y auditable; nunca puede inferirse por nombre, correo o identificación.

## What Changes

- Añadir una consulta administrativa Person-first que presente identidad, afiliación, nombramiento vigente o histórico relevante y estado separado de cuenta/activación/rol.
- Añadir un flujo administrativo de vinculación explícita entre una cuenta existente sin `personId` y una Persona canónica seleccionada, protegido por capacidad persistida existente o una capacidad aprobada explícitamente.
- Rechazar conflictos: cuenta ya vinculada, Persona con otra cuenta, referencias inexistentes y carreras de unicidad.
- Persistir el enlace en transacción y emitir un evento de auditoría sin exponer identificaciones completas ni sincronizar correos/datos personales.
- Reutilizar el ciclo institucional existente para creación, aprobación o activación de cuentas asociadas a Personas sin acceso; no crear registro ni activación paralelos.
- Presentar el flujo en UI administrativa mediante Dialog Base UI, con confirmación explícita, estado de error, foco y actualización de datos.
- Registrar `BOARD-UI-02 — Corregir flujo Sustituir nombramiento` como pendiente fuera de alcance.

## Capabilities

### New Capabilities
- `identity/account-person-linking`: Consulta y vinculación administrativa, explícita y auditable, de cuentas SGI existentes con Personas canónicas, preservando Person-first, afiliación, gobernanza y RBAC como dominios separados.

### Modified Capabilities
- Ninguna. Las especificaciones Person-first y de cuenta comunitaria existentes viven como deltas de cambios aún no sincronizados y no son specs principales disponibles para modificación.

## Impact

- Backend: modelo Prisma existente `User.personId`, módulo de usuarios, autorización, auditoría y pruebas de concurrencia; sin migración de esquema prevista.
- Frontend: feature de usuarios y/o presentación administrativa de Junta Directiva, reutilizando APIs y primitives existentes; sin nuevas dependencias.
- Contratos HTTP: requerirá un contrato explícito para la consulta y la vinculación; no se autoriza reutilizar `PATCH /users/:id` hasta confirmar que expresa esta operación, su capacidad y auditoría.
- Datos: no modifica `Person`, `Affiliate`, `GovernanceMembership`, cargo, rol ni correo por efecto secundario.
