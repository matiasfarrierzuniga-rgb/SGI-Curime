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

**Historical freeze-time implementation status:** NOT YET IMPLEMENTED AS A WHOLE
**Historical freeze-time migration status:** NOT STARTED

At the V1 freeze checkpoint, Prisma remained the pre-V1 Target AS-IS physical
implementation. This statement is historical; current Prisma status is recorded
in the V1.1 section below.
When earlier Target documentation contradicts this canonical package, the
consolidated decision wins; earlier documents remain engineering history and
rationale.

## Canonical Relational Model v1.1

**Status:** ACCEPTED / FROZEN

Target v1.1 is an additive evolution of the preserved Frozen v1 baseline. The
v1 package remains historical engineering evidence and the authority for
inherited decisions; it is not overwritten by the v1.1 package. Structural
implementation is now merged at main@71aa989 (PR #102), verified and integrated.

**Canonical package:**

- [V1.1 Documentation Index](./v1.1/README.md)
- [V1.1 Freeze Declaration](./v1.1/freeze-declaration.md)
- [V1.1 Target Model](./v1.1/target-model.md)
- [V1.1 Consolidated Relational Model](./v1.1/consolidated-relational-model.md)
- [V1.1 Consolidated Data Dictionary](./v1.1/consolidated-data-dictionary.md)
- [V1.1 Decision Register](./v1.1/target-model-decision-register.md)
- [V1.1 Integrity Rules](./v1.1/integrity-rules.md)
- [V1.1 Deferred / Excluded Registry](./v1.1/deferred-excluded-registry.md)
- [V1.1 Consolidated Master ERD](./v1.1/erd/consolidated-master-erd.md)
- [V1 → V1.1 Evolution Matrix](./v1.1/evolution/v1-to-v1.1-matrix.md)

**Persistent entities:** 49
**Transitional entities:** 1
**Master relationships:** 77 persistent Target relationships

**Implementation status:** IMPLEMENTED / VERIFIED / INTEGRATED AT `main@71aa989` (PR #102)
**Cutover status:** HISTORICAL / EVIDENCE-DEPENDENT CLEANUP DEFERRED

The merged implementation provides the V1.1 structural contract (49 persistent
entities, 1 transitional entity, 77 relationships). Evidence-dependent cutover
remains deferred per the documented gates (ID-01, ASM-ATT-01, FIN-ORIGIN-01,
FIN-DON-01, INV-LEDGER-01, INV-LOAN-01, ASM-DATE-01, RES-STATUS-01). Do not
treat structural implementation as completed historical reconciliation.

Prisma at `main@71aa989` contains the implemented structural V1.1 contract.
CURRENT documentation must describe that merged shape while keeping nullable
compatibility links and legacy fields explicit until their approved gates pass.

### Recovered Frozen V1 source coverage

The Frozen V1 canonical package above was restored from the audited source
snapshot used for the V1.1 reconciliation. That source snapshot did **not**
contain the following earlier engineering-history documents that the historical
README referenced:

- `conceptual-model.md`
- `logical-model.md`
- `data-dictionary.md`
- `evolution/current-target-gap-matrix.md`
- `target-model-review.md`
- `evolution/database-audit-2026-09.md`

They are therefore **not reconstructed or fabricated by this documentation
change**. References to those names in preserved Frozen V1 artifacts remain
historical provenance, not evidence that the files were recovered in this
branch. The canonical Frozen V1 relational package required for the V1.1
baseline is present.

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
