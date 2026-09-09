# Puesta en marcha local

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: `main`, `.env.example`, `compose.yaml` y scripts actuales

## Propósito

Esta guía describe las rutas soportadas actualmente para levantar SGI-Curime en un entorno local.

## Requisitos

- Git
- Node.js compatible con el proyecto (las imágenes Docker usan Node 24)
- npm
- Docker Desktop o Docker Engine con Docker Compose, si se usa la ruta contenerizada

## 1. Clonar el repositorio

```bash
git clone https://github.com/matiasfarrierzuniga-rgb/SGI-Curime.git
cd SGI-Curime
```

El trabajo nuevo debe realizarse en una rama dedicada creada desde `main`, siguiendo `CONTRIBUTING.md`.

## 2. Configurar variables de entorno

Copia el archivo de referencia:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

Los valores de `.env.example` son exclusivamente de desarrollo local. No deben reutilizarse como secretos de producción.

Consulta `environment-variables.md` para la clasificación de variables.

## Ruta A — Docker Compose

La configuración oficial integrada actualmente en `main` es:

```text
compose.yaml
```

Levanta:

```text
PostgreSQL 17
    ↓
Backend NestJS
    ↓
Frontend React servido por Nginx
```

Ejecuta:

```bash
docker compose up --build
```

En segundo plano:

```bash
docker compose up -d --build
```

Ver estado:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f
```

Detener:

```bash
docker compose down
```

La base de datos usa un volumen nombrado. `docker compose down` no elimina los datos salvo que se use explícitamente `-v`.

## Ruta B — Node local + PostgreSQL disponible

También es posible ejecutar frontend y backend directamente con Node, siempre que exista una instancia PostgreSQL accesible y las variables de conexión sean correctas.

### Backend

```bash
cd backend
npm ci
npx prisma generate --config prisma.config.ts
npm run start:dev
```

El backend escucha por defecto en el puerto `3000`.

Antes de depender de una base nueva, verifica el estado de migraciones y seed según el flujo del equipo.

### Frontend

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

Vite utiliza normalmente el puerto `5173`.

`VITE_API_URL` debe apuntar al backend correcto.

## Qué hace Docker al iniciar

El servicio backend de `compose.yaml` espera que PostgreSQL esté healthy y después ejecuta:

```text
prisma migrate deploy
    ↓
db:seed
    ↓
start:prod
```

El frontend espera que el healthcheck del backend esté saludable antes de iniciar.

## Salud de los servicios

PostgreSQL utiliza `pg_isready`.

El backend tiene un healthcheck HTTP contra `/`.

El frontend se sirve mediante Nginx en el puerto interno `80`, publicado por defecto como `5173`.

## Configuración Docker actualmente vigente

En `main` existen:

```text
compose.yaml
backend/Dockerfile
frontend/Dockerfile
frontend/nginx.conf
```

No debe asumirse que `docker-compose.dev.yml` o Dockerfiles de desarrollo formen parte de `main` mientras no estén integrados explícitamente.

## Verificación antes de desarrollar

Comprobaciones útiles:

```bash
git status
docker compose config
docker compose ps
```

Para validación de código, consulta `testing.md`.

## Problemas frecuentes

### Docker daemon no disponible

Si Docker CLI responde pero los contenedores no arrancan, verifica que Docker Desktop/Engine esté activo.

### Puerto ocupado

Los puertos pueden modificarse mediante:

```text
POSTGRES_PORT
BACKEND_PORT
FRONTEND_PORT
```

### Backend no conecta con PostgreSQL

En Docker, `DATABASE_URL` apunta al hostname de servicio `postgres`, no a `localhost`.

Cuando se ejecuta backend fuera de Docker, la URL debe apuntar a la instancia PostgreSQL accesible desde el host.

### Frontend no alcanza el backend

Verifica `VITE_API_URL` y que el backend esté escuchando en el puerto esperado.

## Fuentes relacionadas

- `.env.example`
- `compose.yaml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `CONTRIBUTING.md`
- `docs/development/docker.md`
- `docs/development/environment-variables.md`
- `docs/development/testing.md`
