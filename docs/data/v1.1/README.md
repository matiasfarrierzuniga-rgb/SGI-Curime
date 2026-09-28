---
title: SGI-Curime Target Data Model V1.1 — Documentation Index
status: TARGET FROZEN
version: v1.1
date: 2026-09-26
---

# Target Data Model V1.1

This directory contains the canonical documentation package for **SGI-Curime Target Relational Model V1.1**.

```text
TARGET_PERSISTENT_ENTITIES=49
TRANSITIONAL_ENTITIES=1
MASTER_RELATIONSHIPS=77

TARGET_STATUS=FROZEN
IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE
```

**Package freeze distinction:** The `IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE` marker in this V1.1 package distinguishes the frozen historical design from the actual merged implementation at main@71aa989 (PR #102). The structural implementation is now IMPLEMENTED/VERIFIED/INTEGRATED at the merged checkpoint, but the package itself records the boundary — it does not rewrite the V1 design, and it does not imply completed historical reconciliation.

```text
TARGET_STATUS=FROZEN
IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989
```

## Reading order

1. [Freeze declaration](./freeze-declaration.md)
2. [Target model](./target-model.md)
3. [Consolidated relational model](./consolidated-relational-model.md)
4. [Consolidated data dictionary](./consolidated-data-dictionary.md)
5. [Target decision register](./target-model-decision-register.md)
6. [Integrity rules](./integrity-rules.md)
7. [Deferred / excluded registry](./deferred-excluded-registry.md)
8. [Consolidated Master ERD](./erd/consolidated-master-erd.md)
9. [V1 → V1.1 evolution matrix](./evolution/v1-to-v1.1-matrix.md)
10. [Implementation status](./implementation-status.md) — canonical bridge recording merge checkpoint, 49/1/77 counts, verification evidence, additive migration boundary, transitional compatibility state, and deferred gates

Module evidence:

- [Volunteering relational candidate](./modules/volunteering-relational-candidate.md)
- [Entrepreneurship relational candidate](./modules/entrepreneurship-relational-candidate.md)

## Canonical precedence

For V1.1 relational disputes use:

1. `consolidated-relational-model.md`
2. `consolidated-data-dictionary.md`
3. `erd/consolidated-master-erd.md`
4. `target-model-decision-register.md`
5. `integrity-rules.md`
6. `target-model.md`
7. module checkpoints / evolution evidence

The historical Frozen V1 package remains preserved outside this directory and is the baseline from which V1.1 evolved.

## Scope boundary

This package documents the **Target**.

It does not claim V1.1 is already Current.

Do not infer implementation from this documentation and do not update CURRENT merely because Target is frozen.

The next stage is intentionally separate:

```text
refresh AS-IS
→ AS-IS / Target V1.1 Gap Matrix
→ Migration Roadmap V1.1
→ implementation
→ verification
```

## Files intentionally not present yet

The V1.1 package does not yet contain:

- `as-is-to-target-matrix.md`;
- `evolution/migration-roadmap-v1.1.md`.

Those artifacts require refreshed implementation evidence after the Target documentation package is internally consistent.
