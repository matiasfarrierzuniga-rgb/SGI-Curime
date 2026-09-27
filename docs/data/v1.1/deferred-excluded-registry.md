---
title: SGI-Curime Target V1.1 — Deferred and Excluded Registry
status: TARGET FROZEN
target_version: v1.1
date: 2026-09-26
---

# Target V1.1 — Deferred and Excluded Registry

## 1. Purpose

This registry prevents concepts deliberately kept outside Target V1.1 from being reintroduced accidentally during Prisma design, migration planning or implementation.

Classifications:

- **DEFER** — concept may be valid later but is outside V1.1 Core.
- **REJECTED_FOR_CORE** — analyzed and not justified by current V1.1 use cases.
- **OPEN_POLICY_NON_STRUCTURAL** — policy remains open but does not change the frozen entity/relationship model.

## 2. Frozen V1 deferred concepts inherited unchanged

The following remain outside Target V1.1 unless a later version explicitly reopens them:

- `Project`
- `PlanWork`
- `Provider`
- `AffiliateSignature`
- `Warehouse`
- `StockLocation`
- `InventoryAsset`
- `InventoryLoanLine`
- `UnitOfMeasure`
- `UserPermission`
- `UserRole`

In particular, each User continues to have exactly one Role and direct UserPermission grants remain outside the model.

## 3. Volunteering

### DEFER

- `VolunteerOpportunity.eventId?` / direct Opportunity↔Event integration.
- `VolunteerProfile`.
- `VolunteerSkill`.
- `VolunteerHistory`.
- `VolunteerServiceLog`.
- `VolunteerAttendanceHistory`.

The required history is represented by Application, Participation, Session, Attendance and Audit rather than generic history entities.

### OPEN_POLICY_NON_STRUCTURAL

Two policies remain outside the relational freeze:

1. public VolunteerApplication contact requirement: email required, phone required, or at least one of them;
2. public self-service withdrawal mechanism: secure token/magic link, authenticated User, or institutional management.

These may affect API/workflow design but do not add or remove a Core entity or relationship.

## 4. Entrepreneurship

### DEFER — classification/categories

Classification is useful for discovery and reporting, but its physical representation remains intentionally unresolved:

- enum;
- catalog;
- controlled tag;
- N:M classification.

No VentureCategory-style entity enters V1.1 Core.

### DEFER — media

Visual content is valid product direction, but ownership and cross-cutting media modeling remain unresolved. No `VentureMedia` entity enters V1.1 Core.

### DEFER — Events/Fairs

Venture participation in community Events is a valid future integration, but V1.1 introduces no structural Venture↔Event relationship.

`Fair` remains deferred unless future requirements demonstrate fair-specific behavior that the existing Event model cannot represent.

### OPEN_POLICY_NON_STRUCTURAL — minimum responsible persons

V1.1 does not freeze the invariant:

```text
ACTIVE Venture => at least one active VentureAssociation
```

This remains policy-level and does not alter the frozen V1.1 structure.

## 5. Entrepreneurship rejected for V1.1 Core

The following were analyzed and are not justified as V1.1 Core concepts:

- `Entrepreneur`
- `EntrepreneurProfile`
- `Product`
- `Service`
- `Fair`
- `Publication`
- `VentureStatusHistory`
- `PublicationHistory`
- `EntrepreneurHistory`
- `isEntrepreneur`
- `canManage`
- `isAffiliateOwner`
- `primaryResponsible`
- `ownershipPercentage`

They are not forbidden forever; introducing any of them later is a new design decision.

## 6. Global abstractions rejected for V1.1 Core

V1.1 does not introduce generic cross-domain abstractions merely because modules share patterns:

- `GenericRequest`;
- `GenericApplication`;
- `GenericHistory`;
- `GenericPublication`;
- generic Person-resource membership;
- global request/application status entities;
- global publication status entities.

Shared principles remain principles rather than forcing unrelated domains into one persistence abstraction.

## 7. Freeze effect

None of the deferred or open-policy items above is a structural blocker for Target V1.1.

If a future requirement needs one of them, it must enter through explicit architectural change control rather than an implementation-time schema addition.
