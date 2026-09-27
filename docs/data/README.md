# Data Architecture

## Purpose

`docs/data/` es el portal de ingeniería de datos de SGI-Curime. Su propósito es mantener separadas y trazables dos perspectivas:

- **Current Model / AS-IS:** representación fiel de lo implementado y persistido actualmente.
- **Target Model / TO-BE:** diseño aprobado hacia el que evolucionará el sistema, aunque todavía no esté implementado.

Esta separación evita presentar propuestas como comportamiento vigente o interpretar deuda actual como decisión de diseño definitiva.

## Source of truth

Para el modelo físico actual, las fuentes se consultan en este orden:

1. `backend/prisma/schema.prisma`, como representación declarativa actual para Prisma;
2. `backend/prisma/migrations/`, como historial de cambios y fuente de restricciones SQL que Prisma no siempre expresa;
3. estado de migraciones de la base reconciliada;
4. documentación marcada como `CURRENT`;
5. documentos históricos.

La documentación explica esas fuentes, pero no las sustituye. Ante una diferencia, debe corregirse la documentación o reconciliarse formalmente el baseline; nunca debe asumirse que un documento modifica por sí solo la base de datos.

Las reglas funcionales detalladas permanecen en `docs/modules/`. Los contextos arquitectónicos y operativos permanecen en `docs/architecture/` y `docs/development/`. Este portal los referencia cuando corresponde, sin duplicarlos.

## Current Model and Target Model

El **Current Model** describe únicamente modelos, enums, relaciones, nulabilidad, restricciones y deuda que existen en el baseline indicado por el documento.

El **Target Model** describe decisiones futuras aprobadas. Sus artefactos Stage 2A no autorizan cambios en Prisma, migraciones, código ni base de datos.

> **CURRENT != ACCEPTED**

- `CURRENT` significa que una estructura está implementada realmente, aunque sea transicional o tenga deuda conocida.
- `ACCEPTED` significa que una decisión de diseño fue aprobada, aunque todavía no esté implementada.

Una estructura puede ser `CURRENT` sin ser la arquitectura final aceptada. Una propuesta puede ser `ACCEPTED` sin ser todavía `CURRENT`.

## Document states

| State | Meaning |
| --- | --- |
| `DRAFT` | Documento incompleto, sujeto a revisión sustancial y sin autoridad de decisión. |
| `PROPOSED` | Propuesta suficientemente definida para revisión, todavía no aprobada. |
| `ACCEPTED` | Decisión de diseño aprobada; puede continuar pendiente de implementación. |
| `CURRENT` | Fotografía verificada de lo implementado en el baseline declarado. |
| `DEPRECATED` | Documento o decisión que ya no debe guiar trabajo nuevo y tiene reemplazo indicado. |
| `HISTORICAL` | Evidencia preservada de una auditoría, etapa o estado anterior; no describe por sí sola el sistema vigente. |

## Document lifecycle

1. Una exploración inicia como `DRAFT`.
2. Cuando define una alternativa revisable pasa a `PROPOSED`.
3. Una decisión aprobada pasa a `ACCEPTED`.
4. Sólo después de verificar su implementación puede documentarse como `CURRENT`.
5. Cuando pierde vigencia pasa a `DEPRECATED`, o a `HISTORICAL` si se conserva como evidencia de evolución.

Cada documento debe declarar baseline y fecha de revisión cuando describa estado implementado. Un cambio de schema o migraciones exige revisar los documentos `CURRENT` afectados.

## Canonical Relational Model v1

**Status:** ACCEPTED / FROZEN

**Canonical package:**

- [Consolidated Relational Model](./consolidated-relational-model.md)
- [Consolidated Data Dictionary](./consolidated-data-dictionary.md)
- [AS-IS to Target Matrix](./as-is-to-target-matrix.md)
- [Consolidated Master ERD](./erd/consolidated-master-erd.md)

**Persistent entities:** 40
**Transitional entities:** 1
**Master relationships:** 61

**Implementation status:** NOT YET IMPLEMENTED AS A WHOLE
**Migration status:** NOT STARTED

Prisma remains AS-IS physical implementation until migration waves are applied.
When earlier Target documentation contradicts this canonical package, the
consolidated decision wins; earlier documents remain engineering history and
rationale.

## Documents

### CURRENT

- [Current Model](./current-model.md) — fotografía AS-IS del modelo persistente reconciliado.

### ACCEPTED

- [Conceptual Model](./conceptual-model.md) — dominios, conceptos, límites y relaciones de Target v1.
- [Logical Model](./logical-model.md) — entidades, claves, cardinalidades y constraints lógicos de Target v1.
- [Target Model](./target-model.md) — referencia central del Target Data Model v1 aceptado.
- [Data Dictionary](./data-dictionary.md) — definición lógica tabla por tabla del Target v1.
- [Integrity Rules](./integrity-rules.md) — invariantes, enforcement previsto y gates de transición.
- [Current → Target Gap Matrix](./evolution/current-target-gap-matrix.md) — brechas Current↔Target v1, clasificadas por acción y riesgo.
- [Migration Roadmap v1](./evolution/migration-roadmap-v1.md) — secuencia de ondas DB-0..DB-12 y matriz de gates para alcanzar Target v1.

### CURRENT REVIEW

- [Target Data Model v1 — Formal Review](./target-model-review.md) — revisión formal de Target v1 (5 gates PASS; define NB-01..NB-09).

### REVIEW AND DECISION EVIDENCE

- [Target Decision Register](./target-model-decision-register.md) — decisiones cerradas `TM-D01..TM-D13` y matriz relacional `TM-D09`.

### HISTORICAL

- [Database Audit — September 2026](./evolution/database-audit-2026-09.md) — registro histórico de auditoría y reconciliación DB-0.

DB-1 no debe comenzar hasta que los documentos Target correspondientes estén incorporados, contrastados con el Current Model, revisados formalmente, y validados contra el Gap Matrix y el Roadmap v1.

## Related documentation

- [`../architecture/overview.md`](../architecture/overview.md) — contexto general de arquitectura y persistencia.
- [`../architecture/backend-as-is.md`](../architecture/backend-as-is.md) — arquitectura backend vigente y acceso mediante Prisma.
- [`../modules/`](../modules/) — reglas funcionales por dominio.
- [`../requirements/adi-dinadeco-source-mapping.md`](../requirements/adi-dinadeco-source-mapping.md) — evidencia y brechas institucionales ya analizadas.
- [`../development/getting-started.md`](../development/getting-started.md) — operación local y flujo de Prisma.
- [`../development/testing.md`](../development/testing.md) — validaciones por tipo de cambio.
