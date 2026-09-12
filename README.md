# SGI-Curime

Sistema de Gestión Integral para la Asociación de Desarrollo Integral de Curime.

## Descripción

SGI-Curime es una aplicación web orientada a centralizar y digitalizar procesos administrativos y comunitarios de la Asociación de Desarrollo Integral de Curime. El proyecto busca mejorar la trazabilidad de la información, reducir procesos manuales y ofrecer una base común para la gestión de usuarios, afiliados, reservas, finanzas, auditoría y otros dominios de la organización.

## Estado del proyecto

El proyecto se encuentra en desarrollo activo durante Ingeniería II. La rama `main` es la referencia para el estado vigente del código.

Actualmente existen capacidades funcionales en áreas como:

- autenticación y gestión de sesión;
- usuarios, roles y autorización por capacidades;
- afiliados y solicitudes administrativas;
- auditoría;
- reservas;
- financiero.

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
├── openspec/          Especificaciones de etapas anteriores; fuera del alcance documental actual
├── compose.yaml       Configuración Docker base
├── .env.example       Referencia de variables de entorno
├── CONTRIBUTING.md    Guía de contribución
└── README.md          Entrada principal al proyecto
```

## Documentación

La documentación técnica y funcional se está consolidando bajo [`docs/`](./docs/README.md).

Principios de documentación:

- el código actual de `main`, sus pruebas y su configuración son la fuente primaria de verdad;
- los documentos vigentes deben reflejar el comportamiento real del sistema;
- los snapshots y análisis antiguos deben identificarse explícitamente como históricos;
- OpenSpec queda fuera de esta iniciativa de actualización y no se utiliza como fuente vigente sin contrastarlo contra el código actual.

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
