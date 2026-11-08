# SGI-Curime — Contrato operativo de ciclo de cuentas V1

**Estado:** vigente en la rama `feat/p0-governance-inventory-rbac-v2-3`.
**Fuente:** código y pruebas actuales. Esta referencia no certifica despliegue ni PostgreSQL real.

Este es el contrato operativo único para describir registro comunitario, verificación, acceso y posterior vinculación User–Person. Las propuestas OpenSpec y decisiones anteriores conservan trazabilidad, pero no sustituyen este contrato cuando difieren.

## 1. Registro comunitario ordinario

El registro público solicita únicamente correo electrónico en `/register` y llama a `POST /community-accounts/register`. La respuesta pública es neutral (`202`), para no revelar si el correo ya existe. Este flujo **no crea ni aprueba un `UserRequest`** y no requiere revisión administrativa.

La cuenta elegible se crea sin contraseña autenticable, con estado `PENDING_EMAIL_VERIFICATION`, correo normalizado, token aleatorio almacenado como hash, vencimiento y uso único. La cuenta recibe `ROLE_COMMUNITY_USER`, sin grants ERP. La entrega de correo no debe exponer el token en logs.

## 2. Verificación, contraseña y acceso

1. La persona abre el enlace recibido en `/verify-community-email`.
2. `POST /community-accounts/validate-token` valida el token sin consumirlo.
3. La persona define y confirma contraseña en esa pantalla.
4. `POST /community-accounts/verify-email` consume atómicamente un token vigente, no usado y asociado al estado pendiente; guarda el hash y activa la cuenta (`ACTIVE`).
5. La verificación no crea sesión. La persona inicia sesión normalmente y accede a `Mi Comunidad`.

`POST /community-accounts/resend-verification` permite solicitar otro enlace con respuesta neutral y límites antiabuso. Tokens inválidos, expirados, usados o sustituidos no activan cuentas. Una cuenta bloqueada o suspendida no se reactiva por verificación. Recuperación y re-verificación administrativa mantienen sus controles propios.

## 3. Identidad, Person y vinculación administrativa

Verificar correo demuestra control del buzón; no demuestra identidad legal, afiliación, cargo, representación ni titularidad de una `Person` existente.

Una cuenta puede permanecer sin `Person`. La vinculación posterior requiere:

1. Cuenta `User` existente sin `personId`.
2. `Person` canónica existente, seleccionada explícitamente.
3. Actor autenticado con capacidad persistida `system.identity.manage`.
4. Evidencia y motivo administrativos.
5. Validación backend de ambos lados y operación transaccional/auditable mediante `POST /identity/account-person-links`.

CP-04 no vincula por coincidencia de nombre, correo o identificación. No crea `Person`, `Affiliate` ni `UserRequest`, no transfiere cuentas y no modifica rol, permisos, afiliación, nombramientos, credenciales, sesiones, correo ni datos personales. Conflictos de unicidad o concurrencia se rechazan; la unicidad vigente proviene de `User.personId` nullable y `@unique`.

## 4. Acceso ERP y procesos institucionales

Registro, verificación, inicio de sesión, vinculación con `Person`, afiliación o nombramiento no conceden por sí mismos acceso ERP. El acceso protegido depende de roles y capacidades persistidos y de guards backend; ocultar UI no es autorización.

`Person`, `User`, `Affiliate`, `GovernanceMembership`, `Role`, `Permission`, emprendimientos y voluntariado son dominios distintos. Afiliación, nombramientos, representación, publicación de emprendimientos y permisos privilegiados tienen procesos independientes. El voluntariado puede existir sin cuenta.

## 5. Compatibilidad histórica

`UserRequest`, aprobación administrativa, activación de cuentas `INACTIVE` y tokens históricos se conservan únicamente donde el código y sus consumidores aún los requieren. No son requisito del autorregistro comunitario ordinario ni deben reintroducirse como paso de aprobación.

La corrección de correo y la re-verificación administrativa están protegidas por capacidades de administración. No deben confundirse con el registro público. Los registros históricos se preservan; no se ejecutan backfills, reconciliaciones masivas ni migraciones por este contrato.

## 6. Estado de evidencia

| Proceso | Código principal | Pruebas/evidencia | Estado |
| --- | --- | --- | --- |
| Registro por correo | `CommunityRegistrationPage`, `community-accounts.controller.ts`, `CommunityAccountsService.register` | pruebas de registro y respuestas neutrales | IMPLEMENTED / TESTED |
| Validación y activación | `CommunityEmailVerificationPage`, `validate-token`, `verify-email` | pruebas de token, contraseña, estados y navegación | IMPLEMENTED / TESTED |
| Reenvío | `resend-verification` y servicio comunitario | pruebas focalizadas de feedback y límites | IMPLEMENTED / TESTED |
| Mi Comunidad y aislamiento ERP | auth, rutas comunitarias y capability policy | pruebas focalizadas; no equivale a despliegue | IMPLEMENTED / TESTED |
| User–Person | `IdentityAccountLinksController`, `LinkAccountPersonUseCase`, UI de Usuarios | tests focales CP-04; concurrencia PostgreSQL/browser pendientes | IMPLEMENTED / PARTIAL |
| Base de datos real y correo real | migraciones/configuración operativa | no ejecutado en este incremento documental | NOT_VERIFIED |

## 7. Referencias normativas

- Guías de agentes: [`AGENTS.md`](../../AGENTS.md), [`frontend/AGENTS.md`](../../frontend/AGENTS.md), [`backend/AGENTS.md`](../../backend/AGENTS.md).
- Decisión histórica/referencial: [`community-account-registration.md`](../decisions/community-account-registration.md).
- Evidencia de implementación: [`community-email-activation-stage1.md`](../changes/community-email-activation-stage1.md).
- CP-04: [`account-person-linking-v1`](../../openspec/changes/account-person-linking-v1/).
