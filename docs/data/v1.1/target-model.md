---
title: SGI-Curime Target Data Model V1.1
status: TARGET FROZEN
version: v1.1
baseline: Frozen Target V1
date: 2026-09-26
---

# SGI-Curime Target Data Model V1.1

## 1. Authority and status

This document is the central logical reference for **Target Data Model V1.1**.

> **TARGET FROZEN does not mean CURRENT.**

Nothing in this document implies that Prisma, migrations, database rows, backend or frontend already implement V1.1. The real implemented state remains represented by the CURRENT model until implementation and validation occur.

## 2. Target boundary

Target V1.1 remains:

- single-organization;
- modular-monolith persistence;
- PostgreSQL relational storage through Prisma in implementation;
- centered on canonical physical identity through `Person`;
- explicit about domain ownership and historical evidence.

Global candidate/frozen counts:

```text
TARGET_PERSISTENT_ENTITIES=49
TRANSITIONAL_ENTITIES=1
MASTER_RELATIONSHIPS=77
```

Composition:

```text
Frozen V1             40 persistent entities
Volunteering V1.1      5
Entrepreneurship V1.1  4
                       --
Target V1.1           49
```

`IdentityReconciliationManifest` remains the sole transitional entity outside the persistent count.

## 3. Global modeling principles

### Identity

- `Person` is the canonical physical-person identity root.
- `User` is an authentication/access account.
- `Affiliate` is institutional affiliation.
- A domain participant may exist without a User.
- Having a User does not imply Affiliate, Volunteer or entrepreneurial participation.
- Historical submitted snapshots are never rewritten from mutable Person data.

### Authorization

- Authorization remains Role/Permission based.
- Each User has exactly one Role in V1.1.
- Direct `UserPermission`, `UserRole`, `PersonRole` and `AffiliateRole` abstractions are not introduced.
- Domain facts never grant authorization by themselves; capabilities remain an IAM concern.

### Organization

- `OrganizationProfile` remains the singleton institutional root.
- `organizationId` is not distributed through domain tables.
- V1.1 does not introduce multi-tenancy.

### History

- Persist domain facts and process evidence.
- Derive aggregates.
- Audit is cross-cutting and does not replace domain history.
- Normal lifecycle closure does not imply hard deletion.

## 4. Persistent entity inventory

| Domain | Entities |
| --- | --- |
| Organization | `OrganizationProfile` |
| Identity and access | `Person`, `Role`, `Permission`, `RolePermission`, `User`, `Session`, `AuditLog`, `PasswordResetToken`, `AccountActivationToken`, `UserRequest` |
| Affiliation | `Affiliate`, `AffiliateRequest`, `AffiliateSanction` |
| Governance | `GovernancePosition`, `GovernanceTerm`, `GovernanceMembership` |
| Assemblies | `Assembly`, `AssemblyCall`, `AssemblyConvocation`, `AssemblyAttendance`, `AbsenceJustification`, `AssemblyMinute`, `AssemblyResolution` |
| Reservations and events | `Event`, `ReservableResource`, `Reservation` |
| Finance and donations | `FinancialAccount`, `FinancialCharge`, `Payment`, `FinancialMovement`, `Donation`, `Expense`, `ExpenseDocument`, `Disbursement`, `FundingAllocation` |
| Inventory | `InventoryCategory`, `InventoryItem`, `InventoryMovement`, `InventoryLoan` |
| Volunteering | `VolunteerOpportunity`, `VolunteerSession`, `VolunteerApplication`, `VolunteerParticipation`, `VolunteerAttendance` |
| Entrepreneurship | `Venture`, `VentureAssociation`, `VentureRequest`, `VentureRequestRevision` |

## 5. Frozen V1 domains

The first 40 persistent entities retain their Frozen Target V1 semantics. V1.1 does not silently reinterpret those entities or reopen their already-closed design decisions.

The canonical V1 artifacts remain historical baseline evidence. V1.1 extends them rather than replacing their history.

## 6. Volunteering

Volunteering is modeled with five distinct concepts:

```text
Opportunity
Session
Application
Participation
Attendance
```

Key semantics:

- Opportunity represents the whole initiative.
- Opportunity may have multiple Sessions.
- DRAFT may exist without Sessions; publication requires at least one qualifying Session.
- Only PUBLISHED opportunities accept new Applications.
- Application preserves submitted identity/contact snapshot.
- Application may initially have no canonical Person.
- Effective Participation requires canonical `Person`.
- Every Participation originates from one approved Application.
- User is not required merely to be a volunteer.
- Affiliate is not required to participate.
- Attendance belongs to Participation + Session.
- Attendance is unique for `(participationId, sessionId)`.
- Credited hours are stored per Attendance.
- Total hours are derived.
- Approval must enforce identity, duplicate and capacity rules atomically.

Volunteering state families are frozen in the module checkpoint.

## 7. Entrepreneurship

Entrepreneurship is modeled with four concepts:

```text
Venture
VentureAssociation
VentureRequest
VentureRequestRevision
```

Key semantics:

- Entrepreneurial Person and Venture are distinct.
- One Person may be associated with multiple Ventures.
- One Venture may be associated with multiple Persons.
- VentureAssociation records temporal association episodes.
- A single open Person/Venture association is enforced by partial uniqueness.
- VentureRequest represents administrative process, not canonical Venture truth.
- REGISTRATION may begin without an existing Venture.
- UPDATE requires an existing target Venture.
- Requester canonical identity is optional and distinct from responsibility.
- CHANGES_REQUESTED/resubmission evidence is preserved with immutable RequestRevision rows.
- `submittedData` is versioned historical proposal evidence, not canonical Venture state.
- Publication lifecycle is independent from institutional lifecycle.
- `PUBLISHED => ACTIVE`.
- Closing does not delete a Venture or its history.

## 8. Public/event boundaries

`Event` already exists in Frozen V1.

V1.1 deliberately does not add:

- `VolunteerOpportunity.eventId`;
- Venture↔Event participation tables;
- `Fair`;
- generic `Publication`.

Those integrations remain deferred until explicit use cases justify their physical shape.

## 9. Referential-action policy

All V1.1 foreign keys follow the Frozen TM-D09 policy:

- `onUpdate CASCADE`;
- relation-specific `onDelete`;
- `RESTRICT` for durable/history relationships;
- `SET NULL` for optional actor/reconciliation references whose record must survive;
- `CASCADE` only for truly disposable owned children.

The complete matrix is documented in the V1.1 consolidated relational package and decision register.

## 10. Implementation boundary

Target V1.1 freezes destination semantics only.

The next implementation-planning stage is:

```text
Frozen Target V1.1
→ refresh AS-IS
→ V1.1 Gap Matrix
→ Migration Roadmap V1.1
→ implementation waves
→ validation
```

No migration or Prisma change is authorized merely by this document.
