# SGI-Curime

Sistema de Gestión Integral para la Asociación de Desarrollo Integral de Curime.

## Descripción

SGI-Curime es una aplicación web orientada a centralizar y digitalizar procesos administrativos y comunitarios de la Asociación de Desarrollo Integral de Curime. El proyecto busca mejorar la trazabilidad de la información, reducir procesos manuales y ofrecer una base común para la gestión de usuarios, afiliados, reservas, finanzas, auditoría y otros dominios de la organización.

## Estado del proyecto

El proyecto se encuentra en desarrollo activo durante Ingeniería II. La rama de trabajo contiene el baseline en desarrollo; `main` es referencia de promoción, no sustituto de contratos aprobados o estado local verificado.

La rama de trabajo contiene funcionalidades recuperadas e implementadas, pendientes de certificación final, en áreas como:

- autenticación y gestión de sesión;
- usuarios, roles y autorización por capacidades;
- afiliados y solicitudes administrativas;
- auditoría;
- reservas;
- financiero.
- inventario operativo;
- gobernanza, períodos y nombramientos institucionales;
- eventos y voluntariado público/administrativo según capacidades;
- registro comunitario autónomo C3-AUTH-01.

Otros módulos del producto continúan en evolución o planificación y no deben asumirse como implementados únicamente por aparecer en el alcance general del sistema.

## Arquitectura

SGI-Curime se organiza como dos aplicaciones principales:

```text
Frontend React SPA
      ↓ HTTP
Backend NestJS
      ↓
    Prisma
      ↓
 PostgreSQL
```

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Vitest + Testing Library
- Organización por `app/`, `features/`, `pages/` y `shared/`

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT para autenticación
- Monolito modular organizado por dominios

### Infraestructura

El repositorio incluye configuración Docker para apoyar el entorno de desarrollo y PostgreSQL.

## Estructura principal

```text
SGI-Curime/
├── frontend/          Aplicación web React
├── backend/           API NestJS y Prisma
├── docs/              Documentación vigente e histórica
├── openspec/          Contratos, cambios activos y evidencia histórica con estado explícito
├── compose.yaml       Configuración Docker base
├── .env.example       Referencia de variables de entorno
├── CONTRIBUTING.md    Guía de contribución
└── README.md          Entrada principal al proyecto
```

## Documentación

La documentación técnica y funcional se está consolidando bajo [`docs/`](./docs/README.md).

Principios de documentación:

- las decisiones funcionales aprobadas, los contratos vigentes y el código de la rama de trabajo definen el alcance de desarrollo; `main` es referencia de promoción;
- los documentos vigentes deben reflejar el comportamiento real del sistema;
- los snapshots y análisis antiguos deben identificarse explícitamente como históricos;
- OpenSpec conserva trazabilidad y no sustituye un contrato implementado; sus cambios activos deben contrastarse contra código y decisiones aprobadas.

## RBAC V2.3 e identidad

La fuente ejecutable de asignaciones canónicas es [`backend/src/auth/domain/policies/canonical-role-grants.ts`](./backend/src/auth/domain/policies/canonical-role-grants.ts). Los seis roles canónicos separan autorización técnica de identidad (`Person`), cuenta (`User`), afiliación (`Affiliate`) y nombramiento institucional (`GovernanceMembership`). Un cargo no concede automáticamente permisos ERP.

El contrato operativo de registro comunitario está en [`docs/contracts/account-lifecycle-v1.md`](./docs/contracts/account-lifecycle-v1.md): registro por correo, verificación, contraseña, activación y acceso a Mi Comunidad; no restaura aprobación ordinaria mediante `UserRequest`.

La estabilización documental y funcional de esta rama se rastrea en [`stabilize-rbac-v2-3-access-and-legacy-reconciliation`](./openspec/changes/stabilize-rbac-v2-3-access-and-legacy-reconciliation/). Su matriz es evidencia de aceptación, no un segundo catálogo de grants.

Consulta [`docs/README.md`](./docs/README.md) para navegar por la documentación del proyecto.

## Desarrollo local

Las instrucciones de instalación y ejecución se consolidarán en `docs/development/`. Mientras esa guía se completa, consulta los archivos de configuración del frontend, backend, Docker y `.env.example` incluidos en el repositorio.

## Equipo

- Dauren Matarrita
- Matias Farrier
- Jesus Matarrita
- Daniel Marchena

## Contribución

Consulta [`CONTRIBUTING.md`](./CONTRIBUTING.md) antes de proponer cambios al repositorio.
