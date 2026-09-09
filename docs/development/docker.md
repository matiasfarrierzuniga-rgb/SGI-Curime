# Docker en SGI-Curime

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: `compose.yaml`, Dockerfiles y configuración actual de `main`

## Propósito

Esta guía explica cómo se organiza la ejecución contenerizada actual de SGI-Curime.

## Archivo principal

La configuración Docker integrada en `main` es:

```text
compose.yaml
```

Actualmente no forma parte de `main` un `docker-compose.dev.yml`, por lo que no debe tratarse como flujo oficial vigente.

## Servicios

`compose.yaml` define tres servicios:

```text
postgres
backend
frontend
```

### PostgreSQL

- Imagen: `postgres:17`
- Puerto interno: `5432`
- Puerto host configurable con `POSTGRES_PORT`
- Volumen persistente: `sgi_curime_postgres_data`
- Healthcheck: `pg_isready`

Variables utilizadas:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT
```

### Backend

El backend se construye desde:

```text
backend/Dockerfile
```

Características principales:

- base `node:24-bookworm-slim`;
- instala OpenSSL;
- ejecuta `npm ci`;
- genera/builda la aplicación NestJS;
- copia el cliente Prisma generado al artefacto de salida;
- expone el puerto interno `3000`.

Dentro de Compose, antes de iniciar la aplicación ejecuta:

```text
npx prisma migrate deploy --config prisma.config.ts
npm run db:seed
npm run start:prod
```

El backend depende del healthcheck de PostgreSQL.

Variables relevantes:

- conexión PostgreSQL;
- URLs frontend/pública;
- administrador inicial;
- JWT y refresh tokens;
- seguridad de activación, lockout y recuperación;
- rate limiting público;
- correo.

El healthcheck realiza una petición HTTP a `/` en el puerto `3000`.

### Frontend

El frontend usa un Dockerfile multi-stage:

```text
Node 24
   ↓ build Vite
Nginx Alpine
   ↓
SPA estática
```

`VITE_API_URL` se recibe como argumento de build.

El contenedor expone Nginx por el puerto interno `80`, publicado por defecto en el host como `5173`.

El frontend depende del healthcheck del backend.

## Flujo de arranque

```text
postgres
   ↓ healthy
backend
   ↓ migrations + seed + app healthy
frontend
```

Esto evita iniciar capas superiores antes de que su dependencia principal esté lista.

## Comandos operativos

Construir y levantar:

```bash
docker compose up --build
```

Segundo plano:

```bash
docker compose up -d --build
```

Estado:

```bash
docker compose ps
```

Logs generales:

```bash
docker compose logs -f
```

Logs de un servicio:

```bash
docker compose logs -f backend
```

Detener:

```bash
docker compose down
```

Eliminar también el volumen de base de datos:

```bash
docker compose down -v
```

Este último comando elimina datos locales y debe utilizarse de forma deliberada.

## Validar configuración sin arrancar

```bash
docker compose config
```

Este comando es útil para detectar variables faltantes o errores de estructura antes de iniciar contenedores.

## Puertos por defecto

| Servicio | Host | Contenedor |
| --- | ---: | ---: |
| PostgreSQL | `5432` | `5432` |
| Backend | `3000` | `3000` |
| Frontend | `5173` | `80` |

Los puertos host pueden modificarse desde `.env`.

## Persistencia

PostgreSQL utiliza:

```text
sgi_curime_postgres_data
```

Esto significa que reconstruir contenedores no elimina automáticamente la base local.

## Variables y secretos

`.env.example` contiene valores de referencia para desarrollo.

No deben versionarse secretos reales en `.env`.

En particular, deben considerarse sensibles:

- `POSTGRES_PASSWORD`;
- `ADMIN_PASSWORD`;
- `JWT_SECRET`;
- `GMAIL_APP_PASSWORD`;
- credenciales externas futuras.

Consulta `environment-variables.md`.

## Docker vs ejecución local

Docker es útil para reproducibilidad del stack completo.

La ejecución local con Node puede ser preferible durante desarrollo rápido de frontend/backend, siempre que PostgreSQL y las variables estén correctamente configuradas.

Ambas rutas deben apuntar a los mismos contratos de aplicación; Docker no representa una arquitectura funcional distinta.

## Alcance actual

Este documento describe únicamente lo que está integrado en `main`.

No documenta como vigente:

- `docker-compose.dev.yml`;
- Dockerfiles `.dev`;
- Kubernetes;
- despliegues cloud del backend;
- CI/CD contenerizado.

Si esos elementos se integran posteriormente, esta guía debe actualizarse.

## Fuentes relacionadas

- `compose.yaml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `.env.example`
- `docs/development/getting-started.md`
- `docs/development/environment-variables.md`
