---
title: SGI-Curime Target Relational Model V1.1 — Freeze Declaration
status: TARGET FROZEN
target_version: v1.1
date: 2026-09-26
---

# Target Relational Model V1.1 — Freeze Declaration

## 1. Official status

```text
TARGET_RELATIONAL_MODEL_VERSION=V1.1
STATUS=TARGET_FROZEN

TARGET_PERSISTENT_ENTITIES=49
TRANSITIONAL_ENTITIES=1
MASTER_RELATIONSHIPS=77

GLOBAL_CONSISTENCY_REVIEW=PASS
FREEZE_READINESS_REVIEW=PASS
BLOCKING_DESIGN_DECISIONS=0

PRISMA=UNCHANGED
MIGRATIONS=NONE
IMPLEMENTATION=NONE
```

This declaration freezes the intended relational destination for SGI-Curime V1.1. It does not assert that the database, Prisma schema, migrations, backend or frontend already implement that destination.

## 2. Baseline composition

Target V1.1 is an additive evolution of Frozen Target V1:

```text
Frozen Target V1        40 persistent entities
Volunteering V1.1        5 persistent entities
Entrepreneurship V1.1    4 persistent entities
                         --
Target V1.1              49 persistent entities
```

`IdentityReconciliationManifest` remains the sole transitional entity and stays outside the persistent entity count.

The master relation count is:

```text
Frozen Target V1        61
Volunteering V1.1       11
Entrepreneurship V1.1    5
                         --
Target V1.1             77
```

## 3. Frozen V1 preservation

V1.1 does not silently reinterpret or erase Frozen V1. The following global principles remain authoritative:

- `Person` is canonical physical-person identity.
- `User` is authentication/account access.
- `Affiliate` is institutional affiliation.
- Authorization remains Role/Permission based and default-deny.
- Target remains single-organization; `organizationId` is not distributed through domain tables.
- Canonical mutable identity is distinct from historical submitted snapshots.
- Domain participants do not require `User` merely to exist as domain participants.
- Persist facts and derive aggregates.
- Audit is cross-cutting and does not replace domain facts or process records.
- Referential actions are explicit and relation-specific; Target FKs use `onUpdate CASCADE`.

## 4. Volunteering V1.1 frozen core

The frozen core consists of:

- `VolunteerOpportunity`
- `VolunteerSession`
- `VolunteerApplication`
- `VolunteerParticipation`
- `VolunteerAttendance`

Frozen semantics include multi-session opportunities, historical applications, explicit submitted snapshots, optional reconciliation with `Person`, approval provenance into Participation, canonical Person for effective participation, attendance per session, credited hours per session, derived total hours, independent lifecycle states, capacity control, approval concurrency protection, historical preservation and independence from `Affiliate`.

The specific `VolunteerOpportunity ↔ Event` integration remains deferred.

## 5. Entrepreneurship V1.1 frozen core

The frozen core consists of:

- `Venture`
- `VentureAssociation`
- `VentureRequest`
- `VentureRequestRevision`

Frozen semantics include Venture identity independent from Person/User/requester, temporal Person↔Venture association, REGISTRATION and UPDATE requests, optional canonical Person reconciliation, append-only request revisions, versioned historical `submittedData`, explicit patch semantics for UPDATE, independent institutional/publication lifecycle, `PUBLISHED => ACTIVE`, and no ordinary hard-delete workflow.

## 6. Integrity scope frozen

V1.1 freezes the relational decisions for:

- PK/FK structure;
- nullability;
- uniqueness;
- checks;
- partial unique indexes where required;
- relation-specific `onDelete`;
- `onUpdate CASCADE`;
- application validation boundaries;
- transactional invariants;
- lifecycle semantics;
- snapshot/history semantics;
- derived aggregates;
- domain ownership boundaries.

Non-structural policies explicitly classified as open do not reopen the relational freeze.

## 7. Change control after freeze

After this declaration, structural changes must not be introduced silently during implementation.

Any later structural change must be classified explicitly as one of:

1. correction of a demonstrable inconsistency;
2. formal amendment to Frozen V1.1; or
3. Target V1.2 evolution.

This includes new entities, new relationships, structural fields, cardinality changes, ownership changes, nullability changes, uniqueness changes and referential-action changes.

## 8. Implementation boundary

The freeze defines the intended destination but does not authorize implementation by itself.

The implementation sequence remains:

```text
Frozen Target V1.1
        ↓
AS-IS → Target V1.1 Gap Matrix
        ↓
Migration Roadmap V1.1
        ↓
Migration / implementation waves
        ↓
Validation
```

Until that work is completed, CURRENT documentation and implementation artifacts must not claim V1.1 is implemented.
