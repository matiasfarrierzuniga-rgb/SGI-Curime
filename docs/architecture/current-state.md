# Estado actual de la arquitectura

> **Historical architecture snapshot.** Captured at commit/date: 5efd424,
> 2026-08-14. **Not the current frontend source of truth.** Use
> [frontend-as-is.md](./frontend-as-is.md) for current frontend state.

## Propósito y alcance

Este documento registra la arquitectura real observada en el repositorio SGI-Curime durante la Fase 0. La referencia de Git auditada es el commit `5efd424b1be545d0a51b627317bbad06c83ffbde` de la rama `main`.

No demuestra comportamiento de producción ni sustituye validaciones que no pudieron ejecutarse. Las afirmaciones se clasifican así:

| Clasificación | Significado |
| --- | --- |
| Verificado | Confirmado mediante código, configuración, Git o un comando ejecutado. |
| Configurado, no ejecutado | Existe configuración o código, pero no se validó su ejecución en este entorno. |
| Ausente | No se encontró implementación o configuración en el repositorio. |
| Desconocido | La evidencia disponible no permite determinarlo. |

## Resumen ejecutivo

- **Verificado:** el repositorio contiene dos proyectos npm independientes: un frontend React/TypeScript/Vite y un backend NestJS/Prisma.
- **Verificado:** el backend implementa autenticación JWT, solicitudes de usuario, administración de usuarios, auditoría y acceso PostgreSQL mediante módulos NestJS.
- **Verificado:** PostgreSQL es el único motor de base de datos configurado y Prisma contiene cuatro migraciones.
- **Verificado:** el frontend rastreado es la aplicación inicial de Vite; no consume el backend ni contiene funcionalidades de SGI-Curime.
- **Verificado:** la autenticación entrega un JWT en JSON y lo recibe mediante `Authorization: Bearer`; no utiliza cookies ni sesiones renovables.
- **Verificado:** Docker Compose define únicamente PostgreSQL. No existen Dockerfiles para las aplicaciones.
- **Verificado:** Redis y RabbitMQ no son dependencias ni servicios actuales.
- **No verificado:** builds, pruebas, migraciones y ejecución de Compose, debido a dependencias locales ausentes y Docker no disponible.

## Repositorio y Git

### Estado observado

| Elemento | Resultado | Evidencia |
| --- | --- | --- |
| Raíz | `C:/Users/Estudiantes UNA/Desktop/SGI-Curime` | `git rev-parse --show-toplevel` |
| Rama | `main`, siguiendo `origin/main` | `git status --short --branch` |
| HEAD | `5efd424b1be545d0a51b627317bbad06c83ffbde` | `git rev-parse HEAD` |
| Remote | Repositorio GitHub `matiasfarrierzuniga-rgb/SGI-Curime.git` | `git remote -v` |
| Cambios rastreados previos | Ninguno | `git status --short --branch` |
| Directorios no rastreados | `.agents/`, `.opencode/`, `openspec/` | `git status --short --branch` |
| Artefactos ignorados relevantes | `dist/`, `node_modules/`, `.opencode/node_modules/` | `git status --ignored --short` |

Los commits recientes muestran entregas incrementales de solicitudes de usuario, administración, bloqueo de cuenta, recuperación de contraseña y auditoría. No se detectó una rama dedicada para la Fase 0.

El `dist/` ignorado contiene una aplicación visual distinta del frontend rastreado. Su origen y reproducibilidad son desconocidos, por lo que no se considera evidencia de capacidad implementada.

## Organización del proyecto

```text
SGI-Curime/
├── backend/               Proyecto npm NestJS y Prisma
├── frontend/              Proyecto npm React y Vite
├── compose.yaml           PostgreSQL únicamente
├── openspec/              Especificaciones y cambios OpenSpec no rastreados
├── .agents/               Configuración local de agentes no rastreada
├── .opencode/             Configuración local de OpenCode no rastreada
└── README.md              Descripción general del producto
```

No existe `package.json` en la raíz ni configuración de npm workspaces, pnpm, Yarn, Bun, Nx, Turborepo o Lerna. `backend/` y `frontend/` tienen sus propios `package-lock.json` versión 3.

## Herramientas y versiones

| Herramienta | Estado | Evidencia |
| --- | --- | --- |
| Node.js | Verificado: `v24.18.0` en el entorno auditado | `node --version` |
| npm | Verificado: `11.16.0` en el entorno auditado | `npm --version` |
| OpenSpec | Verificado: `1.8.0` | `openspec --version` |
| Docker | Ausente en `PATH` | `Get-Command docker` |
| Versión Node soportada por el proyecto | Desconocida | No hay `engines`, `.nvmrc` ni archivo equivalente |

Las versiones declaradas principales son React `^19.2.8`, Vite `^8.2.0`, TypeScript frontend `~6.0.2`, NestJS `^11.0.1`, Prisma `^7.9.1` y TypeScript backend `^5.7.3`; véanse `frontend/package.json` y `backend/package.json`.

## Frontend

### Implementación

**Estado: verificado, base técnica sin funcionalidades de negocio.**

- `frontend/src/main.tsx` monta directamente `<App />` bajo `StrictMode`.
- `frontend/src/App.tsx` implementa el contador y enlaces de documentación de la plantilla Vite.
- `frontend/src/App.css` y `frontend/src/index.css` contienen CSS tradicional, variables, modo oscuro y reglas responsivas de la plantilla.
- `frontend/vite.config.ts` configura únicamente `@vitejs/plugin-react`.
- `frontend/tsconfig.app.json` usa resolución `bundler`, `noEmit` y verificaciones de símbolos no utilizados.
- `.oxlintrc.json` configura Oxlint para TypeScript y React.

### Capacidades ausentes

- Integración HTTP con el backend.
- Variables de entorno frontend y configuración centralizada.
- Routing y rutas públicas o protegidas.
- TanStack Router, Query, Form y Table.
- Tailwind CSS y shadcn/ui.
- Vertical Slices y APIs públicas por feature.
- Identidad, sesión, autorización o almacenamiento de token.
- Formularios, tablas y pantallas de SGI-Curime.
- Pruebas unitarias, de integración o navegador.

El único estado frontend es el contador local implementado con `useState`. No hay evidencia de un store global adicional.

## Backend

### Bootstrap

`backend/src/main.ts`:

- Carga variables mediante `dotenv/config`.
- Crea la aplicación NestJS.
- Configura `ValidationPipe` global con transformación, lista blanca y rechazo de campos no declarados.
- Habilita hooks de apagado.
- Escucha `PORT` o usa `3000`.

No configura prefijo `/api`, versionado, CORS, cookies, OpenAPI, Helmet, compresión, rate limiting ni guard global.

### Monolito modular

`backend/src/app.module.ts` compone:

- `PrismaModule`
- `AuthModule`
- `AuditModule`
- `UserRequestsModule`
- `UsersModule`

El código define una única aplicación NestJS con capacidades separadas en módulos, por lo que constituye una base de monolito modular. La topología de despliegue real es desconocida. No hay evidencia de pruebas automatizadas de límites arquitectónicos. `UsersModule` y `UserRequestsModule` importan `AuthModule`; `AuditModule` se registra globalmente.

### Superficie HTTP

Se verificaron 22 rutas mediante los controllers:

| Método | Ruta actual | Protección |
| --- | --- | --- |
| GET | `/` | Pública |
| POST | `/auth/login` | Pública |
| POST | `/auth/activate-account` | Pública |
| POST | `/auth/forgot-password` | Pública |
| POST | `/auth/reset-password` | Pública |
| PATCH | `/auth/change-password` | JWT |
| GET | `/auth/me` | JWT |
| GET | `/auth/admin-test` | JWT y rol `Administrador` |
| POST | `/user-requests` | Pública |
| GET | `/user-requests` | JWT y rol `Administrador` |
| GET | `/user-requests/:id` | JWT y rol `Administrador` |
| PATCH | `/user-requests/:id/reject` | JWT y rol `Administrador` |
| PATCH | `/user-requests/:id/approve` | JWT y rol `Administrador` |
| GET | `/users` | JWT y rol `Administrador` |
| GET | `/users/:id` | JWT y rol `Administrador` |
| PATCH | `/users/:id` | JWT y rol `Administrador` |
| PATCH | `/users/:id/role` | JWT y rol `Administrador` |
| PATCH | `/users/:id/activate` | JWT y rol `Administrador` |
| PATCH | `/users/:id/deactivate` | JWT y rol `Administrador` |
| PATCH | `/users/:id/unlock` | JWT y rol `Administrador` |
| GET | `/audit-logs` | JWT y rol `Administrador` |
| GET | `/audit-logs/:id` | JWT y rol `Administrador` |

Evidencia principal: `backend/src/auth/auth.controller.ts`, `backend/src/user-requests/user-requests.controller.ts`, `backend/src/users/users.controller.ts` y `backend/src/audit/audit.controller.ts`.

No existe contrato OpenAPI, cliente generado, prefijo `/api/v1`, esquema común de errores ni DTOs de respuesta consistentes. Los servicios controlan varias proyecciones seguras mediante selecciones explícitas de Prisma.

### Funcionalidades verificadas estáticamente

- Solicitudes públicas de creación de usuario y revisión administrativa.
- Activación de cuenta con token de un solo uso.
- Login con JWT.
- Bloqueo temporal por intentos fallidos.
- Recuperación y cambio de contraseña.
- Listado, consulta, actualización, rol, activación, desactivación y desbloqueo de usuarios.
- Protección del último administrador activo mediante transacciones serializables.
- Registro y consulta administrativa de auditoría.
- Saneamiento recursivo de campos sensibles en detalles de auditoría.

La entrega externa de tokens de activación y recuperación no está implementada: ambos servicios de entrega son puntos de extensión vacíos.

## Autenticación y autorización

### Flujo actual

**Estado: verificado estáticamente.**

- `AuthService` firma y devuelve `accessToken` en el cuerpo JSON del login.
- `JwtStrategy` extrae exclusivamente el token Bearer del header `Authorization`.
- La estrategia consulta PostgreSQL en cada petición para validar usuario, rol, estado y bloqueo actual.
- `@Roles()` y `RolesGuard` comparan nombres de rol; el rol protegido observado es `Administrador`.
- No existe modelo de permisos en Prisma.

### Controles presentes

- bcrypt para contraseñas, con coste 12 en activación, recuperación y seed.
- Política de contraseña de 10 a 128 caracteres, con mayúscula, minúscula y número.
- Tokens aleatorios de 32 bytes para activación y recuperación.
- Persistencia exclusiva del hash SHA-256 de esos tokens.
- Expiración y consumo atómico de tokens.
- Bloqueo temporal configurable por intentos fallidos.
- Proyecciones de usuario sin `passwordHash`.
- Eliminación recursiva de claves sensibles en auditoría.

### Controles ausentes

- Cookies `HttpOnly`, `Secure` y `SameSite`.
- Refresh token y rotación.
- Registro persistente y revocación de sesiones.
- Logout y logout global.
- Protección CSRF o validación de origen para autenticación por cookies.
- Rate limiting general; el bloqueo actual es por cuenta.
- Invalidación explícita de JWT ya emitidos tras cambiar o restablecer contraseña.
- Permisos granulares distintos de roles.

El almacenamiento del token en un cliente real es desconocido porque el frontend no está integrado.

## Persistencia

### Prisma y PostgreSQL

**Estado: configurado, no ejecutado en esta auditoría.**

- `backend/prisma.config.ts` configura esquema, migraciones, seed y `DATABASE_URL`.
- `backend/prisma/schema.prisma` declara `provider = "postgresql"`.
- `PrismaService` usa `@prisma/adapter-pg`, exige `DATABASE_URL` y conecta durante la inicialización del módulo.
- Prisma genera un cliente CommonJS en `backend/generated/prisma`.
- Ese cliente está ignorado y actualmente ausente.
- No hay script `prisma generate`, `postinstall`, `prebuild` ni despliegue de migraciones en `backend/package.json`.

### Modelos

- `Role`
- `User`
- `AuditLog`
- `AccountActivationToken`
- `PasswordResetToken`
- `UserRequest`
- `Affiliate`
- `AffiliateRequest`

Existen restricciones únicas para roles, identificación y correo de usuario, identificación de afiliado y hashes de tokens. Los tokens se eliminan en cascada con el usuario y las auditorías conservan el registro con usuario nulo.

`UserRequest.reviewedById` y `AffiliateRequest.reviewedById` son enteros opcionales sin relación Prisma ni clave foránea. Los modelos de afiliación no tienen módulos o endpoints NestJS observados.

### Migraciones y seed

Existen cuatro migraciones rastreadas:

1. Esquema inicial de usuarios, roles, solicitudes y afiliados.
2. Activación de cuenta.
3. Recuperación de contraseña.
4. Auditoría.

El seed crea cuatro roles y un administrador desde variables obligatorias. El estado real de migraciones y datos en una base de datos es desconocido.

## Configuración y variables de entorno

`backend/.env.example` documenta:

- `DATABASE_URL`
- Datos del administrador inicial.
- `JWT_SECRET` y `JWT_EXPIRES_IN`.
- TTL de activación y recuperación.
- Intentos máximos y duración de bloqueo.

Hallazgos:

- No se rastrean secretos reales.
- `PORT` se usa, pero no está documentado en `.env.example`.
- No hay configuración frontend de entorno.
- No hay origen CORS, configuración de cookies o URL pública del API.
- La validación de configuración está distribuida entre servicios; no existe un esquema único de configuración tipada.

## Infraestructura

`compose.yaml` define un único servicio `postgres` con:

- Imagen `postgres:17`.
- Puerto de host `5432:5432`.
- Volumen `sgi_curime_postgres_data`.
- Reinicio `unless-stopped`.
- Usuario, contraseña y base de datos de desarrollo escritos directamente en el archivo.

No existen:

- Servicios `frontend` o `backend`.
- Dockerfiles.
- Health checks.
- `depends_on`.
- Red explícita.
- Secretos Docker.
- Migraciones controladas desde contenedores.
- Servidor web o proxy `/api` para frontend.

Docker no está disponible en el entorno, por lo que Compose no fue validado en ejecución.

## Pruebas y calidad

### Backend

Se encontraron siete pruebas unitarias bajo `backend/src` y cinco suites HTTP bajo `backend/test`.

- Las pruebas de servicios usan mocks de Prisma.
- La suite HTTP de autenticación usa NestJS, JWT y bcrypt, pero reemplaza Prisma y entrega de tokens.
- Las suites HTTP de usuarios, solicitudes y auditoría reemplazan Prisma y sus servicios; validan principalmente routing, guards, DTOs y respuestas.
- `app.e2e-spec.ts` usa `AppModule` completo y necesita `DATABASE_URL`, pero solo verifica `GET /`.

No existe una suite comprobada que prepare PostgreSQL, aplique migraciones y valide comportamiento persistente real.

### Frontend y contratos

No existen pruebas frontend, de navegador, de arquitectura, de OpenAPI ni de compatibilidad frontend-backend.

### Scripts

Backend declara build, formato, ejecución, seed, lint, pruebas unitarias y e2e. El lint siempre usa `--fix` y el formato usa `--write`, por lo que no hay variantes de solo comprobación. No existe script independiente de typecheck.

Frontend declara desarrollo, build, lint y preview. El build combina `tsc -b` y Vite; no hay script independiente de typecheck ni pruebas.

## Validaciones de la Fase 0

| Comando o comprobación | Estado | Resultado |
| --- | --- | --- |
| `git status --short --branch` | Salida 0 | `main`, sin cambios rastreados previos, con `.agents/`, `.opencode/` y `openspec/` no rastreados. |
| `node --version` | Salida 0 | `v24.18.0`. |
| `npm --version` | Salida 0 | `11.16.0`. |
| `npm ls --depth=0` en `frontend/` | Salida 1 | `ELSPROBLEMS`; todas las dependencias directas están ausentes. |
| `npm ls --depth=0` en `backend/` | Salida 1 | `ELSPROBLEMS`; todas las dependencias directas están ausentes. |
| `npm run lint` en `frontend/` | Salida 1 | `oxlint` no se reconoce porque no está instalado. |
| `npm test -- --runInBand` en `backend/` | Salida 1 | `jest` no se reconoce porque no está instalado. |
| `npm run build` en `frontend/` | No ejecutado | Faltan dependencias y el comando generaría `dist/` durante una auditoría documental. |
| `npm run build` en `backend/` | No ejecutado | Faltan dependencias y el cliente Prisma generado; el comando generaría `dist/`. |
| `npm run lint` en `backend/` | No ejecutado | El script usa `eslint --fix` y modificaría archivos. |
| Typecheck independiente | No disponible | No existe script de typecheck en ninguno de los proyectos. |
| `npm run test:e2e -- --runInBand` en `backend/` | No ejecutado | Faltan dependencias; la suite completa también requiere PostgreSQL y configuración. |
| `npx prisma generate --config prisma.config.ts` en `backend/` | No ejecutado | Las dependencias están ausentes y `npx` podría descargar paquetes o generar archivos. |
| `npx prisma migrate status --config prisma.config.ts` en `backend/` | No ejecutado | No hay cliente local ni base de datos validada. |
| `docker compose config` | Bloqueado | Docker no está disponible en `PATH`. |
| `openspec validate establish-phase-0-baseline --strict` | Salida 0 | El cambio OpenSpec es válido. |
| `git status --short --branch --untracked-files=all` al cierre | Salida 0 | No hay cambios rastreados. Los únicos archivos nuevos de producto son los dos documentos; `.agents/`, `.opencode/` y OpenSpec ya eran no rastreados antes de aplicar el cambio. |

No se instalaron dependencias ni se corrigieron fallos.

## Documentación existente

- `README.md` describe propósito, stack y módulos previstos, pero no es una guía reproducible de desarrollo u operación.
- `backend/README.md` conserva contenido genérico de NestJS y afirma licencia MIT, mientras `backend/package.json` declara `UNLICENSED`.
- `frontend/README.md` conserva contenido de la plantilla Vite.
- Antes de esta fase no existían documentos de arquitectura ni ADR rastreados.

## Limitaciones y desconocidos

- Compatibilidad real de las versiones declaradas con Node `v24.18.0`.
- Estado de builds y pruebas con dependencias instaladas.
- Estado real de migraciones y datos PostgreSQL.
- Configuración de producción, TLS, proxy, CORS, backups y observabilidad.
- Estrategia prevista de permisos granulares.
- Proveedor de entrega para activación y recuperación.
- Política prevista de revocación de sesión.
- Procedencia del `dist/` ignorado.
- Estado real de despliegues externos al repositorio.

## Conclusión

El repositorio contiene una implementación backend estáticamente sustantiva, organizada como una aplicación NestJS modular, cuya ejecución no pudo verificarse. El frontend rastreado permanece en estado de plantilla. PostgreSQL/Prisma es la única persistencia configurada y Redis/RabbitMQ están ausentes. Builds, pruebas, migraciones y operación en contenedores permanecen no verificados por los bloqueos documentados.
