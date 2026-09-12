# Arquitectura frontend vigente

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: código actual de `main`, configuración y pruebas del frontend

## Propósito

Este documento describe la arquitectura real del frontend de SGI-Curime. Sustituye las descripciones históricas de Fase 0 que mezclaban estructuras anteriores con la organización actual.

## Stack actual

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- Axios
- TanStack Query
- TanStack Table
- React Hook Form + Zod
- Tailwind CSS 4
- Base UI
- Vitest + Testing Library + jsdom
- Oxlint

Las versiones concretas deben consultarse en `frontend/package.json`.

## Organización principal

La estructura vigente combina una arquitectura por capas de aplicación con vertical slices por dominio:

```text
frontend/src/
├── app/          composición de aplicación, layouts y router
├── features/     verticales funcionales por dominio
├── pages/        páginas todavía compartidas o en transición
├── shared/       infraestructura y UI reutilizable sin dependencia de dominio
├── components/   componentes heredados todavía no migrados completamente
├── content/      contenido estático o editorial
├── services/     servicios heredados todavía en transición
├── types/        tipos heredados todavía en transición
├── test/         soporte de pruebas
├── assets/
├── main.tsx
├── index.css
└── tailwind.css
```

La presencia de `components/`, `services/` y `types/` no significa que sean la dirección arquitectónica preferida. Son raíces heredadas que continúan existiendo mientras el código se consolida dentro de `features/` y `shared/`.

## Capas vigentes

### `app/`

Responsable de la composición de alto nivel de la SPA.

Incluye, entre otros elementos:

- layouts públicos, de acceso y ERP;
- definición central de rutas;
- composición de navegación y shell de aplicación.

`frontend/src/app/router/AppRoutes.tsx` es actualmente el punto central de routing.

### `features/`

Cada feature representa una vertical de negocio o capacidad funcional. En `main` existen verticales para, entre otras:

```text
absence-justifications
affiliate-requests
affiliates
auth
events
financial
public-site
reservations
roles
user-requests
users
```

Una feature puede contener, según necesidad:

```text
feature/
├── api/
├── hooks/
├── model/
├── routing/
├── ui/
└── index.ts
```

No todas las features necesitan todos esos subdirectorios.

### `shared/`

Contiene infraestructura y componentes neutrales respecto al dominio:

```text
shared/
├── api/
├── config/
├── lib/
├── security/
├── session/
└── ui/
```

Ejemplos de responsabilidades adecuadas para `shared/`:

- cliente HTTP;
- lectura centralizada de variables de entorno;
- sesión reutilizable;
- utilidades generales;
- primitives y componentes de UI neutrales;
- helpers de seguridad que no pertenecen a una sola vertical.

`shared/` no debe depender de `app/`, `features/` ni `pages/`.

### `pages/`

`pages/` todavía contiene pantallas que no han sido absorbidas por una feature concreta o que sirven como composición de varias capacidades. Debe tratarse como una capa de presentación/composición, no como lugar preferido para lógica de dominio reutilizable.

## Flujo típico de una vertical

El patrón preferido es:

```text
Route / Page
    ↓
Feature UI
    ↓
Feature hook
    ↓
Feature API
    ↓
shared/api/httpClient
    ↓
Backend HTTP
```

Cuando TanStack Query aplica, los hooks de feature administran queries, mutations, query keys e invalidación de caché.

## Routing y autorización

El router central distingue tres zonas principales:

```text
Público
  ↓
PublicLayout

Acceso
  ↓
AccessLayout

ERP autenticado
  ↓
ProtectedRoute
  ↓
ErpLayout
  ↓
RoleRoute / capability
```

El acceso protegido utiliza capabilities para la mayoría de las rutas ERP. Ejemplos actuales incluyen:

- `res.reservations.read`
- `fin.charges.read`
- `fin.movements.read`
- `usr.profile.read`
- `usr.users.read`
- `usr.roles.read`
- `adm.affiliates.read`
- `adm.requests.read`
- `adm.justifications.read`
- `aud.logs.read`
- `pub.events.manage`
- `inv.inventory.read`

Todavía existe al menos algún acceso basado directamente en rol, por lo que la transición hacia autorización completamente basada en capabilities no debe darse por terminada sin verificar el código.

## Features de Sprint 2

### Reservas

Reservas está implementado como vertical propia bajo `frontend/src/features/reservations/` e integra API, hooks, modelos y UI. El router expone tanto la solicitud de reserva como la administración de reservas.

### Financiero

Financiero está implementado bajo `frontend/src/features/financial/` con API, modelos, hooks y pantallas para cargos y movimientos financieros.

Estas verticales son evidencia de que la arquitectura por features ya no es una propuesta futura: es parte del frontend actual.

## Reglas arquitectónicas automatizadas

`frontend/scripts/check-architecture.mjs` aplica límites de dependencia.

Reglas principales:

- `shared` no puede depender de `app`, `features`, `pages` ni raíces heredadas de dominio;
- una feature no puede depender de `app`, `pages` ni raíces heredadas prohibidas;
- imports entre features deben utilizar el public API de la feature objetivo;
- acceso directo a `import.meta.env` solo se permite desde `shared/config/env.ts`.

Estas reglas se ejecutan con:

```bash
npm run check:architecture
```

## Validación del frontend

El `package.json` define un comando agregado:

```bash
npm run verify
```

que ejecuta, en orden:

```text
lint
  ↓
check:architecture
  ↓
tests
  ↓
build
```

La ejecución final de los tests y verificaciones corresponde al flujo de validación del equipo; este documento describe los comandos disponibles, no afirma resultados futuros automáticamente.

## Estado de transición

La arquitectura actual es funcional pero no completamente homogénea.

Persisten raíces heredadas como:

- `components/`
- `services/`
- `types/`
- algunas páginas administrativas e inventario bajo `pages/`

La regla para nuevos cambios debe ser evitar ampliar innecesariamente esas raíces heredadas y preferir `features/` o `shared/` según la responsabilidad.

## Fuente relacionada

- `frontend/package.json`
- `frontend/src/app/router/AppRoutes.tsx`
- `frontend/src/features/`
- `frontend/src/shared/`
- `frontend/scripts/check-architecture.mjs`
- `docs/architecture/frontend-slice-rules.md`
