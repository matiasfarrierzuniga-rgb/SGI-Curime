# Arquitectura backend vigente

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, configuración y pruebas del backend

## Propósito

Este documento describe la arquitectura real del backend de SGI-Curime. Sustituye snapshots de Sprint 1 que ya no reflejan la incorporación de módulos más recientes ni la transición estructural actual.

## Stack actual

- Node.js
- NestJS 11
- TypeScript 5.7
- Prisma 7
- PostgreSQL mediante `@prisma/adapter-pg`
- JWT y Passport
- bcrypt
- class-validator + class-transformer
- Jest para pruebas unitarias y e2e
- Nodemailer para notificaciones por correo

Las versiones concretas deben consultarse en `backend/package.json`.

## Forma arquitectónica

El backend es un monolito modular NestJS.

Flujo común:

```text
HTTP Controller
      ↓
Nest Service / Application logic
      ↓
PrismaService
      ↓
PostgreSQL
```

Algunos módulos recientes están empezando a adoptar una separación más explícita por capas, mientras otros continúan con una estructura feature-folder tradicional.

## Organización actual

La estructura de `backend/src/` es híbrida:

```text
backend/src/
├── auth/
├── audit/
├── user-requests/
├── affiliate-requests/
├── affiliates/
├── assemblies/
├── absence-justifications/
├── sanctions/
├── admin-reports/
├── inventory-*/
├── events/
├── reservations/
├── financial/
├── identity/
├── prisma/
├── common/
├── modules/
│   ├── users/
│   ├── roles/
│   └── notifications/
└── app.module.ts
```

Por tanto, no debe afirmarse que todo el backend sigue una única convención física. La arquitectura está en transición.

## `AppModule`

`backend/src/app.module.ts` compone los principales módulos funcionales del sistema, entre ellos:

- Auth
- Audit
- User Requests
- Users
- Roles
- Affiliate Requests
- Affiliates
- Assemblies
- Absence Justifications
- Sanctions
- Admin Reports
- Inventory
- Events
- Identity
- Reservations
- Financial

Esto confirma que Reservas y Financiero forman parte del backend actual y no son solo alcance futuro.

## Bootstrap y middleware global

`backend/src/main.ts` actualmente:

- carga variables de entorno;
- crea la aplicación NestJS;
- habilita `cookie-parser`;
- configura `ValidationPipe` global con `transform`, `whitelist` y `forbidNonWhitelisted`;
- habilita CORS con origen frontend configurado y `credentials: true`;
- habilita shutdown hooks;
- escucha en `PORT` o `3000`.

La presencia de cookies y CORS con credenciales forma parte de la arquitectura actual y reemplaza descripciones antiguas que afirmaban que no existían.

## Persistencia

Prisma es la capa principal de acceso a PostgreSQL.

Ubicaciones relevantes:

- esquema: `backend/prisma/schema.prisma`
- configuración: `backend/prisma.config.ts`
- servicio de acceso: `backend/src/prisma/prisma.service.ts`
- cliente generado: `backend/generated/prisma`

El script `postinstall` ejecuta `prisma generate --config prisma.config.ts`, por lo que la generación del cliente ya está integrada al ciclo de instalación.

## Autenticación y autorización

La autenticación continúa bajo `backend/src/auth/` y utiliza JWT/Passport.

La autorización actual incluye soporte por capabilities a través de componentes compartidos del módulo Auth, utilizados por controllers de dominios como Reservas y Financiero.

El patrón habitual en rutas protegidas es:

```text
JwtAuthGuard
   ↓
CapabilityGuard
   ↓
RequireCapabilities(...)
```

La documentación específica de autorización debe consultarse en `docs/architecture/authorization.md` cuando se consolide, junto con los ADR existentes.

## Reservas

Reservas vive bajo:

```text
backend/src/reservations/
```

Incluye controller, service, DTOs, políticas y pruebas. El módulo implementa lógica de disponibilidad, creación y administración de reservas y utiliza guards/capabilities para proteger operaciones.

Las reglas funcionales detalladas deben vivir en `docs/modules/reservations.md`.

## Financiero

Financiero vive bajo:

```text
backend/src/financial/
```

Incluye controllers, service, DTOs y pruebas para cargos, pagos y movimientos financieros.

Las reglas funcionales detalladas deben vivir en `docs/modules/financial.md`.

## Módulos con estructura más estratificada

Bajo `backend/src/modules/` existen actualmente:

- `users/`
- `roles/`
- `notifications/`

Esto evidencia una transición hacia una organización más explícita por módulos y capas en ciertas áreas. No debe extrapolarse automáticamente esa estructura al resto del backend.

## Validación y calidad

Scripts principales disponibles en `backend/package.json`:

```text
npm run build
npm run lint
npm test
npm run test:e2e
```

Además existen scripts operativos para seed, reconciliación de identidad/personas y pruebas de correo.

Este documento describe la arquitectura y comandos disponibles, pero no fija resultados históricos como si fueran permanentes. Los resultados de test/build deben validarse en el momento correspondiente.

## Estado de transición

Riesgos y realidades actuales:

- existen módulos con estructura tradicional y otros bajo `src/modules/`;
- varios services todavía concentran lógica de aplicación, persistencia y excepciones HTTP;
- la separación de dominio respecto de Prisma/NestJS no es uniforme;
- la autorización por capabilities está extendida, pero debe seguir verificándose módulo por módulo;
- la documentación de base de datos y módulos funcionales todavía debe consolidarse por separado.

## Fuente relacionada

- `backend/package.json`
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/modules/`
- `backend/src/reservations/`
- `backend/src/financial/`
- `backend/prisma/schema.prisma`
- `docs/architecture/backend-layer-rules.md`
