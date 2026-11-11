# Variables de entorno

Estado: Vigente  
Última revisión: 2026-11
Fuente primaria: `.env.example`, `compose.yaml` y configuración actual de `main`

## Propósito

Este documento clasifica las variables de entorno utilizadas por SGI-Curime y aclara cuáles son de desarrollo, cuáles son sensibles y qué componente las consume.

## Regla general

`.env.example` es una plantilla de referencia para desarrollo local. Las
plantillas no contienen credenciales funcionales. Cada entorno tiene una
fuente distinta para sus conexiones y secretos.

El archivo real `.env` no debe versionarse cuando contiene secretos o credenciales reales.

## PostgreSQL

| Variable | Uso | Sensible |
| --- | --- | --- |
| `POSTGRES_USER` | Usuario de PostgreSQL | No necesariamente |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | Sí |
| `POSTGRES_DB` | Nombre de la base | No |
| `POSTGRES_PORT` | Puerto publicado en host | No |

En Docker, `compose.yaml` construye `DATABASE_URL` y `DIRECT_URL` usando el hostname interno `postgres`.

### Perfiles de conexión

| Entorno | `DATABASE_URL` | `DIRECT_URL` | Fuente |
| --- | --- | --- | --- |
| Node fuera de Docker | `localhost:5432` | `localhost:5432` | `backend/.env` ignorado |
| Docker Compose | `postgres:5432` | `postgres:5432` | `compose.yaml` |
| Supabase / Render | Session Pooler `:5432` | Session Pooler o conexión directa | secretos del proveedor |

No copiar URLs de Supabase a `backend/.env` local ni URLs `localhost` a Render.
El runtime NestJS identifica hosts Supabase y usa el certificado público
`backend/certs/supabase-prod-ca-2021.crt` con verificación de CA y hostname.
Prisma CLI recibe `sslmode=verify-full` y `sslrootcert` mediante
`backend/prisma.config.ts`. `SUPABASE_CA_CERT_PATH` permite indicar una ruta
montada alternativa.

## Puertos

| Variable | Predeterminado actual |
| --- | ---: |
| `BACKEND_PORT` | `3000` |
| `FRONTEND_PORT` | `5173` |

`POSTGRES_PORT` tiene como referencia `5432`.

## URLs de aplicación

| Variable | Propósito |
| --- | --- |
| `FRONTEND_URL` | Origen permitido para el frontend y CORS |
| `APP_PUBLIC_URL` | URL pública de la aplicación usada por flujos que generan enlaces |
| `VITE_API_URL` | URL del backend embebida en el build del frontend |

En desarrollo local normalmente apuntan a `localhost`, pero en otros entornos deben reflejar URLs reales.

## Administrador inicial (bootstrap)

| Variable | Propósito | Sensible |
| --- | --- | --- |
| `ADMIN_NAME` | Nombre del administrador seed | No |
| `ADMIN_IDENTIFICATION` | Identificación inicial | Potencialmente |
| `ADMIN_EMAIL` | Correo inicial | Potencialmente |
| `ADMIN_PASSWORD` | Contraseña inicial | Sí |

Estas variables solo las consume `prisma/seed.ts` y las herramientas explícitas
de bootstrap/reset. No son necesarias para que NestJS opere normalmente. En
Compose no se inyectan al servicio backend. Para Supabase/Render deben
entregarse solo al proceso controlado de inicialización, nunca versionarse ni
quedar configuradas como variables permanentes del runtime.

Los valores históricos presentes en `.env` locales son credenciales de
desarrollo ignoradas por Git; no se modifican automáticamente. Deben
reemplazarse por credenciales únicas antes de cualquier entorno compartido.

## JWT y sesión

| Variable | Propósito | Sensible |
| --- | --- | --- |
| `JWT_SECRET` | Firma/verificación de JWT | Sí |
| `JWT_EXPIRES_IN` | Duración del access token | No |
| `REFRESH_TOKEN_TTL` | TTL del refresh token | No |
| `REFRESH_COOKIE_NAME` | Nombre de cookie refresh | No |
| `REFRESH_COOKIE_SAME_SITE` | Política SameSite | No |

`JWT_SECRET` debe tratarse como secreto fuerte y único por entorno.

## Seguridad de cuenta

| Variable | Propósito |
| --- | --- |
| `ACTIVATION_TOKEN_TTL_HOURS` | Vigencia de token de activación |
| `MAX_LOGIN_ATTEMPTS` | Intentos fallidos antes del bloqueo |
| `ACCOUNT_LOCKOUT_MINUTES` | Duración del bloqueo temporal |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | Vigencia del token de recuperación |

## Rate limiting público

| Variable | Propósito |
| --- | --- |
| `PUBLIC_REQUEST_RATE_LIMIT_TTL_SECONDS` | Ventana temporal |
| `PUBLIC_REQUEST_RATE_LIMIT_MAX` | Máximo de solicitudes en la ventana |

Estas variables protegen endpoints públicos configurados con throttling.

## Correo

| Variable | Propósito | Sensible |
| --- | --- | --- |
| `EMAIL_PROVIDER` | Proveedor seleccionado | No |
| `EMAIL_SEND_ENABLED` | Habilita envío real | No |
| `EMAIL_FROM` | Dirección remitente | No |
| `EMAIL_FROM_NAME` | Nombre visible | No |
| `EMAIL_REPLY_TO` | Dirección de respuesta | No |
| `GMAIL_USER` | Cuenta Gmail, si aplica | Sí/privada |
| `GMAIL_APP_PASSWORD` | App password de Gmail | Sí |

En `.env.example` el proveedor es `fake` y el envío está deshabilitado, lo cual es apropiado para desarrollo sin correo real.

## Variables derivadas en Docker

`compose.yaml` genera internamente:

```text
DATABASE_URL
DIRECT_URL
```

con forma:

```text
postgresql://<user>:<password>@postgres:5432/<database>
```

Cuando el backend corre fuera de Docker, esas URLs deben apuntar a una base accesible desde el host, normalmente con `localhost` o el hostname correspondiente.

## Supabase y Render

Render debe recibir `DATABASE_URL` con el Session Pooler de Supabase en puerto
`5432` y `DIRECT_URL` para comandos Prisma autorizados. No se debe usar el
Transaction Pooler `6543` para este backend persistente ni para migraciones.

La imagen de backend incluye la CA oficial de Supabase y define
`NODE_EXTRA_CA_CERTS=/app/certs/supabase-prod-ca-2021.crt`. El adaptador
`@prisma/adapter-pg` además pasa explícitamente esa CA con
`rejectUnauthorized: true`; no se permite desactivar la validación TLS.

Fuente oficial de la CA:
`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`

Fingerprint SHA-256 validado localmente:
`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`

## Variables del frontend

Las variables expuestas a Vite usan prefijo `VITE_`.

Actualmente la principal es:

```text
VITE_API_URL
```

Debe recordarse que las variables `VITE_*` quedan disponibles en el bundle frontend y por tanto **no deben contener secretos**.

## Buenas prácticas

- mantener `.env.example` sin secretos reales;
- usar secretos diferentes por entorno;
- no compartir `.env` por chat o repositorio;
- rotar inmediatamente un secreto expuesto;
- no colocar credenciales privadas en variables `VITE_*`;
- documentar toda nueva variable cuando se agregue al código o a Compose.

## Fuentes relacionadas

- `.env.example`
- `compose.yaml`
- `backend/src/main.ts`
- `docs/development/getting-started.md`
- `docs/development/docker.md`
