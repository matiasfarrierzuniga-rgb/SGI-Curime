# C3-AUTH-01 — Retirada registro comunitario V1

## Estado

`PARTIALLY_CERTIFIED` — código y validaciones no destructivas completadas; certificación PostgreSQL desechable pendiente.

## Contrato resultante

`POST /community-accounts/register` crea una cuenta `PENDING_EMAIL_VERIFICATION` con `ROLE_COMMUNITY_USER` sin grants. El correo recibe token hasheado, de un uso y vencible. `POST /community-accounts/verify-email` valida token y contraseña, consume token, activa cuenta y registra verificación. Login resuelve `canAccessErp: false` y frontend dirige a Mi Comunidad.

## Retirado

- Controlador, servicio, DTOs y pruebas de `UserRequest` V1.
- `GET /user-requests`, `GET /user-requests/:id`, `PATCH /user-requests/:id/approve`, `PATCH /user-requests/:id/reject` y creación pública V1.
- Pantalla/ruta `/admin/user-requests`, navegación, tarjeta/atención de dashboard y acción de notificaciones.
- Capacidades `usr.user-requests.read` y `usr.user-requests.review`.

## RBAC y persistencia

- `ROLE_SYSTEM_ADMIN`: 29 → 27 grants; total canónico: 107 → 105.
- `prisma/sync-canonical-rbac.ts` inspecciona por defecto. Con `--apply` reconcilia grants de roles canónicos, incluyendo revocación idempotente de grants inesperados. No se ejecutó contra ninguna base.
- Prisma schema y registros `UserRequest` históricos permanecen intactos; notificaciones históricas ya no exponen acción operativa.

## Compatibilidad y límites

- Cuentas comunitarias activas continúan autenticables.
- No hay creación automática de `Affiliate`, nombramiento, `Person` ni rol institucional.
- La conciliación `Person` sigue separada; no se realiza vinculación por coincidencia ambigua.
- Activación legacy `/auth/activate-account` se conserva solo para cuentas históricas preexistentes; el flujo comunitario usa exclusivamente `/community-accounts/verify-email`.

## Validación

- `backend npm.cmd run build`: PASSED.
- `frontend npm.cmd run build`: PASSED; warning preexistente de bundle >500 kB.
- Backend focalizado: 40/40 PASSED.
- Frontend focalizado: 105/105 PASSED; avisos jsdom `scrollTo` preexistentes.
- Sincronizador canónico: 3/3 PASSED.
- `git diff --check`: PASSED.
- PostgreSQL desechable: NOT_EXECUTED.

## Riesgo residual

Aplicar la sincronización a una base requiere entorno PostgreSQL identificado y respaldo/procedimiento autorizado. No declarar GO de producción antes de certificación desechable e integración.
