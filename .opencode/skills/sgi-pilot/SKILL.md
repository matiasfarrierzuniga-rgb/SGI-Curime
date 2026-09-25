---
name: sgi-pilot
description: >
  Contexto del proyecto piloto SGI-Curime para el sistema multiagente. Cargar al
  trabajar sobre el repositorio SGI-Curime: stack, layout, ownership por dominio,
  fuentes de verdad y restricciones de validación. Complementa, no reemplaza,
  el AGENTS.md del repositorio.
---

# SGI-Curime · Proyecto Piloto

Sistema de Gestión Integral de la Asociación de Desarrollo Integral de Curime.

## Stack

- **Frontend:** React 19, TypeScript, React Router, TanStack Query, Tailwind (tokens en `frontend/CONVENTIONS.md`).
- **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL.
- **Infra local:** Docker (`compose.yaml`) para PostgreSQL y entorno de desarrollo.

## Layout

```
backend/        API NestJS; Prisma en backend/prisma (schema.prisma + migraciones)
frontend/       SPA React; CONVENTIONS.md = fuente del sistema visual/tokens
docs/           arquitectura, módulos, proyecto, requisitos
openspec/       cambios (changes/specs) y decisiones (specs)
AGENTS.md       orquestación del repo (fuente local de verdad; siempre ganar sobre skills globales)
```

## Fuentes de verdad (precedencia)

1. Tarea explícita de Daniel y su alcance.
2. Contratos backend autoritativos, reglas de dominio y de capacidades.
3. `AGENTS.md` del repositorio.
4. `frontend/CONVENTIONS.md`.
5. Skills locales bajo `.agents/skills/` (sgi-*) y `.opencode/skills/`.
6. Skills globales (protocolos, revisores).

No inventar endpoints, estados de dominio, capacidades, reglas de negocio, rutas ni campos.

## Ownership por dominio

| Dominio | Owner | Área |
|---|---|---|
| Persistencia | Atlas | `backend/prisma` schema, migraciones, constraints, índices |
| Backend | Forge | `backend/src` controllers, services, DTOs, APIs, autorización |
| Frontend | Pixel | `frontend/` UI/UX, a11y, formularios, TanStack Query |
| QA | Sentinel | revisión y casos de prueba (sin ejecutar la suite) |

Los agentes globales (`~/.config/opencode/agents/*.md`) aplican a este repo; este skill les aporta el contexto del proyecto. Rutas de trabajo bajo `.opencode/`; documentación permanente se maneja separadamente/manual con aprobación humana.

## Restricciones

- Arquitectura se considera estable: no refactorizar ni rediseñar sin pedido explícito.
- **Tests:** Daniel ejecuta personalmente las suites. Los agentes preparan comandos y analizan resultados, pero no ejecutan suites automáticamente (regla crítica).
- Validación de Sentinel: `NOT_EXECUTED | PASSED | FAILED | NOT_APPLICABLE`; nunca `PASSED` sin evidencia.
- Contradicciones entre reportes → `UNRESOLVED` → decisión de Daniel. Nunca resolverlas en silencio.
- Reportes operacionales: `.opencode/reports/<YYYY-MM-DD>/` (transitorios). Documentación durable: `docs/`.
