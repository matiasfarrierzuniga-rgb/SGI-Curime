# Estrategia de testing y validación

Estado: Vigente  
Última revisión: 2026-09  
Fuente primaria: scripts de `frontend/package.json`, `backend/package.json`, pruebas actuales y `CONTRIBUTING.md`

## Propósito

Este documento concentra cómo se valida SGI-Curime actualmente y qué comandos corresponden a frontend, backend y cambios documentales.

## Principio de validación

La validación debe ser proporcional al alcance del cambio.

Una modificación no queda lista únicamente porque compile: según el área afectada puede requerir lint, límites arquitectónicos, pruebas unitarias, pruebas E2E, build y verificación manual.

Los resultados concretos deben registrarse en el Pull Request correspondiente.

## Frontend

El frontend utiliza:

- Vitest;
- Testing Library;
- jsdom;
- jest-dom;
- jest-axe / axe-core para casos de accesibilidad;
- MSW cuando se requiere simular HTTP.

### Suite completa

Desde `frontend/`:

```bash
npm run test -- --run
```

### Suite dirigida

Para ejecutar un archivo concreto:

```bash
npm run test -- --run <ruta-del-test>
```

Ejemplo:

```bash
npm run test -- --run src/shared/ui/date-picker/DatePicker.test.tsx
```

### Lint

```bash
npm run lint
```

Actualmente usa Oxlint.

### Límites arquitectónicos

```bash
npm run check:architecture
```

Este chequeo valida dependencias entre `app`, `features`, `shared` y otras zonas del frontend.

### Build

```bash
npm run build
```

Ejecuta TypeScript build y después Vite build.

### Verificación agregada

```bash
npm run verify
```

Actualmente equivale a:

```text
lint
  ↓
check:architecture
  ↓
tests
  ↓
build
```

Este es el comando de validación integral del frontend.

## Backend

El backend utiliza Jest para pruebas unitarias y una configuración separada para E2E.

### Unit tests

Desde `backend/`:

```bash
npm test
```

### Suite dirigida

Jest permite ejecutar archivos concretos, por ejemplo:

```bash
npm test -- reservations.service.spec.ts
```

```bash
npm test -- financial.service.spec.ts
```

### E2E

```bash
npm run test:e2e
```

Las pruebas E2E pueden requerir base de datos y variables de entorno válidas.

### Coverage

```bash
npm run test:cov
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

El script backend ejecuta ESLint con `--fix`, por lo que puede modificar archivos. Debe utilizarse conscientemente y revisarse el diff después.

## Prisma y base de datos

Cuando un cambio afecta schema, consultas o infraestructura Prisma, pueden ser relevantes:

```bash
npx prisma generate --config prisma.config.ts
```

```bash
npx prisma validate --config prisma.config.ts
```

Las migraciones deben revisarse explícitamente cuando haya cambios en `backend/prisma/schema.prisma`.

## Cambios por tipo

| Tipo de cambio | Validación mínima recomendada |
| --- | --- |
| Solo documentación | `git diff --check` + revisión de enlaces/contenido |
| UI/componente frontend | test dirigido + lint; ampliar según impacto |
| Feature frontend | tests afectados + `check:architecture` + build |
| Cambio transversal frontend | `npm run verify` |
| Service/backend rule | test dirigido + build |
| Controller/guard/contrato backend | unit/controller tests + build; E2E si aplica |
| Prisma/schema | tests afectados + Prisma validate/generate + migración cuando corresponda |
| Auth/autorización | pruebas dirigidas + integración/E2E según el contrato |
| Docker/configuración | `docker compose config` + smoke test del flujo afectado |

Esta tabla es guía; un cambio de mayor riesgo puede requerir más validación.

## Smoke testing manual

Los tests automatizados no sustituyen completamente la validación de flujos críticos de interfaz.

Ejemplos de smoke tests relevantes:

- login y logout;
- navegación ERP según permisos;
- creación y administración de reservas;
- flujo financiero;
- formularios responsive;
- diálogos, foco y teclado;
- errores HTTP y mensajes al usuario.

## Accesibilidad

Los componentes interactivos deben considerar al menos:

- navegación por teclado;
- foco inicial;
- restauración de foco;
- Escape en overlays/modales;
- labels y nombres accesibles;
- contraste y estados visibles;
- tests automatizados de accesibilidad cuando aporten valor.

Las pruebas automatizadas de accesibilidad complementan, pero no sustituyen, la revisión manual.

## Validación de arquitectura frontend

`check:architecture` es una parte real del gate de frontend, no documentación aspiracional.

Debe mantenerse verde cuando se agregan o mueven imports entre features y shared.

## Evidencia en Pull Requests

Cada PR debería incluir:

```text
Comando ejecutado
Resultado
Alcance cubierto
Pendientes o warnings conocidos
```

No deben copiarse resultados de ejecuciones antiguas como si validaran código nuevo.

## Responsabilidad de ejecución

Los comandos aquí documentados indican qué debe validarse. La ejecución y revisión final de las pruebas forma parte del proceso humano del equipo antes de integrar cambios.

## Higiene de repositorio

Antes de commit o PR:

```bash
git diff --check
git status
```

También debe revisarse que no se hayan agregado secretos, artefactos generados innecesarios o archivos fuera de alcance.

## CI

`CONTRIBUTING.md` establece que, mientras no existan workflows CI requeridos para todo el flujo, la evidencia local de QA debe registrarse en el PR.

Si posteriormente se incorporan pipelines obligatorios, este documento debe actualizarse para reflejar cuáles checks son locales, cuáles automáticos y cuáles bloquean el merge.

## Fuentes relacionadas

- `frontend/package.json`
- `backend/package.json`
- `frontend/scripts/check-architecture.mjs`
- `CONTRIBUTING.md`
- `docs/development/getting-started.md`
- `docs/development/docker.md`
