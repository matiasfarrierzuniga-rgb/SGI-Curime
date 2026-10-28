# Postulación pública de voluntariado

- **Estado:** APPROVED para la postulación sin cuenta, contacto mínimo y resolución administrativa explícita de `Person` por instrucciones del responsable del proyecto (28-10-2026). La integración HTTP/PostgreSQL se verificó en un contenedor desechable y se documenta por separado de la especificación V2.
- **Alcance:** voluntariado comunitario en `feat/public-community-services`; no cambia registro de cuentas, afiliación ni permisos ERP de cuentas comunitarias.
- **Referencia:** CU-121 se menciona en `community-account-registration.md`, que permanece `PROPOSED`. El texto primario inmutable del catálogo V2 no está incorporado al repositorio: trazabilidad de CU-121 `NOT_VERIFIED`. La regla siguiente se aprueba por la instrucción de este incremento, no por ese borrador.

## Regla aprobada de postulación

Una persona puede postularse a una oportunidad publicada sin cuenta o con sesión. `User` y `Affiliate` no son requisitos. El formulario exige nombre completo y al menos un medio de contacto: correo electrónico o teléfono. Ambos son opcionales individualmente. Correo suministrado: formato válido, normalizado a minúsculas. Teléfono suministrado: código de país y número nacional, validados con `isValidPhone` del proyecto; para Costa Rica, `+506` y ocho dígitos. Mensaje o motivación: opcional. Se aplican límites de longitud y rate limit al endpoint público.

La postulación se registra como `VolunteerApplication(PENDING)` con snapshot de los datos enviados. No crea `User`, `Affiliate`, `Person`, `VolunteerParticipation` ni `VolunteerAttendance`, y no implica aceptación. No se enlaza automáticamente con una `Person` por coincidencia de nombre, correo o teléfono.

Las solicitudes repetidas para la misma oportunidad y el mismo contacto se rechazan mientras estén `PENDING` o `APPROVED`. La comprobación se hace transaccionalmente para evitar carreras. La respuesta pública no devuelve datos personales ni el estado de otras solicitudes.

## Publicación, cupos y revisión

La oportunidad nace `DRAFT`. Publicar requiere al menos una sesión `SCHEDULED` futura con `startAt < endAt`; la transición a `PUBLISHED` es administrativa y auditada. `CLOSED` deja de recibir postulaciones. El vencimiento de `applicationDeadline` y el agotamiento de capacidad por participaciones confirmadas también cierran la recepción. La capacidad cuenta participaciones confirmadas, no el volumen histórico de solicitudes.

La revisión administrativa expone los contactos solo a personal con autorización de voluntariado. Rechazar conserva historial. Aprobar exige resolver explícitamente la `Person` canónica, verificar cupo y ausencia de participación duplicada, crear `VolunteerParticipation(CONFIRMED)` y marcar la solicitud `APPROVED` en una transacción. Un correo o teléfono aportado por el visitante no acredita identidad ni autoriza enlazar automáticamente a una persona existente.

El revisor debe escoger explícitamente entre una `Person` existente identificada por su ID institucional y una nueva `Person` mínima creada desde el snapshot de la solicitud. Esta segunda opción conserva el nombre como `legacyFullName` y el correo en `email`; el teléfono permanece en el snapshot de la postulación, pues el formulario comunitario no exige ambos componentes de contacto de `Person`. No se inventa identificación ni se atribuye verificación legal. No hay búsqueda ni enlace automáticos por coincidencias. El revisor asume la verificación institucional previa a la aceptación.

`vol.opportunities.read` cubre lectura administrativa de oportunidades. `vol.opportunities.update` cubre creación de sesiones, publicación, cierre y revisión de las solicitudes vinculadas a la oportunidad; estas mutaciones quedan auditadas. Es una ampliación explícita del alcance operativo de esa capacidad existente y no se concede a cuentas comunitarias. No se crea una capacidad nueva ni se modifica el seed de permisos.

## Compatibilidad y despliegue

El esquema Prisma V1.1 ya contiene los campos y estados necesarios. No se requiere migración de datos. Las rutas ERP existentes y sus capacidades siguen vigentes. Rollback de código: retirar endpoints y UI nuevos sin borrar solicitudes, sesiones ni participaciones persistidas; no ejecutar rollback de datos sin plan separado.

## Verificación de este incremento

Las pruebas unitarias cubren reglas y autorización. `test/volunteering.postgres.e2e-spec.ts` ejercita HTTP real con PostgreSQL aislado: exclusión de borradores, publicación, postulación con y sin sesión, duplicados, revisión, vinculación explícita con `Person`, cupos, concurrencia y acceso administrativo denegado a visitantes. Se aplicaron las 30 migraciones oficiales solo en la base temporal `sgi_volunteer_test`, sin cambiar el esquema ni los datos de otros entornos. La prueba es repetible y no requiere seed ni cuenta administrativa preexistente.
