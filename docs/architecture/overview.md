# Arquitectura general de SGI-Curime

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: rama `main`, pruebas y configuración vigente

## Propósito

Este documento ofrece una vista general de la arquitectura actual de SGI-Curime. Su objetivo es servir como punto de entrada técnico antes de consultar la documentación específica de frontend, backend, persistencia, autorización o módulos funcionales.

## Vista general

SGI-Curime está construido como una aplicación web cliente-servidor con una SPA en React y una API en NestJS.

```text
Usuario
  ↓
Frontend React SPA
  ↓ HTTP/JSON
Backend NestJS
  ↓
Prisma ORM
  ↓
PostgreSQL
```

El frontend y el backend viven en el mismo repositorio, pero mantienen proyectos Node independientes.

## Frontend

El frontend utiliza React, TypeScript y Vite. La navegación se gestiona con React Router y la comunicación con datos remotos se apoya en TanStack Query.

La estructura actual sigue límites explícitos alrededor de:

```text
frontend/src/
├── app/       composición global, layouts y router
├── features/  verticales funcionales y sus APIs públicas
├── pages/     páginas de composición cuando corresponde
└── shared/    infraestructura y UI reutilizable sin dominio
```

Las verticales actuales incluyen, entre otras, autenticación, usuarios, roles, afiliados, reservas y financiero.

Las reglas detalladas de dependencias del frontend se mantienen en `frontend-slice-rules.md` y serán consolidadas en la documentación vigente de frontend.

## Backend

El backend utiliza NestJS con TypeScript y se organiza como un monolito modular por dominios.

El flujo común es:

```text
HTTP Controller
      ↓
Nest Service
      ↓
PrismaService
      ↓
PostgreSQL
```

Los módulos encapsulan áreas funcionales como autenticación, usuarios, roles, auditoría, afiliados, reservas y financiero, además de otras capacidades administrativas en evolución.

Algunas reglas de negocio sensibles utilizan transacciones y políticas explícitas para preservar invariantes, especialmente en usuarios, reservas y financiero.

## Persistencia

Prisma funciona como capa de acceso a PostgreSQL.

La definición del modelo persistente y sus migraciones se encuentra bajo `backend/prisma/`. Los servicios NestJS consumen Prisma a través de `PrismaService`.

La documentación específica del modelo de datos se consolidará en `database.md`.

## Autenticación y autorización

La autenticación utiliza JWT.

La autorización ha evolucionado desde controles basados únicamente en roles hacia un contrato de capacidades. El principio general es de acceso explícito: una ruta o acción protegida requiere la capacidad correspondiente y las capacidades desconocidas no deben conceder acceso por defecto.

El contrato detallado se mantiene en la documentación de autorización y en los ADR vigentes.

## Dominios funcionales

El sistema no debe interpretarse como si todos los módulos previstos en el alcance académico estuvieran igualmente terminados.

A septiembre de 2026 existen implementaciones funcionales relevantes en:

- autenticación y sesión;
- usuarios y roles;
- solicitudes administrativas;
- afiliados;
- auditoría;
- reservas;
- financiero.

Otros dominios continúan en evolución o planificación. La documentación de cada módulo deberá indicar expresamente su estado real.

## Infraestructura y desarrollo

El repositorio incluye configuración Docker para el entorno de desarrollo y PostgreSQL, además de archivos de entorno de ejemplo y configuración separada para frontend y backend.

Las instrucciones operativas se consolidarán bajo `docs/development/`.

## Pruebas y calidad

El proyecto mantiene pruebas automatizadas tanto en frontend como en backend, además de verificaciones de compilación y límites arquitectónicos.

Las pruebas forman parte de la evidencia utilizada para contrastar la documentación con el comportamiento esperado del sistema.

## Fuente de verdad

Ante contradicciones, aplicar el siguiente orden:

1. código actual en `main`;
2. pruebas vigentes;
3. configuración real del repositorio;
4. documentación marcada como vigente;
5. snapshots y documentos históricos.

## Documentación relacionada

- `../README.md`: índice general de documentación.
- `frontend-as-is.md`: fotografía frontend existente, pendiente de consolidación.
- `backend-as-is.md`: fotografía backend existente, pendiente de consolidación.
- `frontend-slice-rules.md`: reglas de slices frontend.
- `backend-layer-rules.md`: reglas de capas backend.
- `adr-002-backend-capability-authorization.md`: decisión de autorización por capacidades.
