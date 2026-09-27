---
title: SGI-Curime Entrepreneurship V1.1 — Relational Candidate
status: TARGET FROZEN
target_version: v1.1
module: entrepreneurship
date: 2026-09-26
---

# Entrepreneurship V1.1 — Relational Candidate

## 1. Status and objective

This document records the Entrepreneurship relational candidate incorporated into Frozen Target V1.1.

```text
STRUCTURAL_STATUS=CLOSED
RELATIONAL_STATUS=CLOSED
TARGET_V1_1_STATUS=FROZEN

PRISMA=UNCHANGED
MIGRATIONS=NONE
IMPLEMENTATION=NONE
```

The subsystem manages institutional incorporation, validation, canonical-person linkage, public presence and community participation of local ventures.

It is not private-business accounting and it is not a marketplace.

## 2. Core distinction

```text
entrepreneurial Person ≠ Venture
```

Venture identity is independent from:

- Person;
- User;
- requester;
- responsible person;
- Request.

There is no `Entrepreneur` or `EntrepreneurProfile` entity in V1.1.

## 3. Core entities

Entrepreneurship contributes exactly four persistent entities:

- `Venture`
- `VentureAssociation`
- `VentureRequest`
- `VentureRequestRevision`

External identity dependency: `Person`.

## 4. Venture

```text
Venture
- id                 Int PK
- name               required
- description?       optional
- offerDescription?  optional
- businessPhone?     optional
- businessEmail?     optional
- websiteUrl?        optional
- socialUrl?         optional
- locationText?      optional
- status             required
- publicationStatus  required
- incorporatedAt     required
- createdAt          required
- updatedAt          required
```

### Institutional lifecycle

```text
ACTIVE
SUSPENDED
CLOSED
```

### Publication lifecycle

```text
UNPUBLISHED
PUBLISHED
```

Invariant:

```text
PUBLISHED => ACTIVE
```

The inverse is false. An ACTIVE Venture may be UNPUBLISHED.

There is no `UNIQUE(name)`.

Description/contact/location remain structurally nullable; publication requirements are contextual.

No Product/Service catalog tables enter V1.1 Core.

## 5. VentureAssociation

Represents one continuous temporal episode between one Person and one Venture.

```text
VentureAssociation
- id          Int PK
- personId    required FK -> Person
- ventureId   required FK -> Venture
- startedAt   required
- endedAt?    optional
- createdAt   required
- updatedAt   required
```

Constraint:

```text
endedAt IS NULL OR endedAt >= startedAt
```

Historical re-entry is valid, so there is no global `UNIQUE(personId, ventureId)`.

Required partial unique index:

```sql
UNIQUE (personId, ventureId)
WHERE endedAt IS NULL
```

Historical interval overlap for the same Person/Venture is forbidden through transactional/application validation. An exclusion constraint is deferred.

Closing a Venture does not automatically end its associations.

VentureAssociation carries no IAM role, ownership percentage, founder flag or authorization flag.

## 6. VentureRequest

Represents an administrative process and is distinct from canonical Venture state.

Purposes:

```text
REGISTRATION
UPDATE
```

States:

```text
SUBMITTED
UNDER_REVIEW
CHANGES_REQUESTED
APPROVED
REJECTED
WITHDRAWN
```

Terminal states:

```text
APPROVED
REJECTED
WITHDRAWN
```

There is no DRAFT Request state.

Shape:

```text
VentureRequest
- id                    Int PK
- purpose               required
- status                required
- reconciledPersonId?   optional FK -> Person
- ventureId?            conditional FK -> Venture
- resolvedAt?           optional/conditional
- decisionReason?       optional
- createdAt             required
- updatedAt             required
```

`reconciledPersonId` identifies the canonical requester when reconciliation is possible. It does not mean Venture responsibility.

Responsibility is represented only through `VentureAssociation`.

### ventureId semantics

For UPDATE:

```text
ventureId required from Request creation
```

For REGISTRATION:

```text
ventureId may be null while unresolved
approved REGISTRATION => ventureId required
```

Multiple open UPDATE Requests are allowed; no natural uniqueness is imposed.

## 7. VentureRequestRevision

A Request may receive requested changes and be resubmitted without losing prior evidence.

```text
VentureRequestRevision
- id              Int PK
- requestId       required FK -> VentureRequest
- revisionNumber  required
- payloadVersion  required
- submittedData   required jsonb candidate
- submittedAt     required
- createdAt       required
```

Constraint:

```text
UNIQUE(requestId, revisionNumber)
```

No `isLatest` or `latestRevisionId` is persisted; latest is derived from `revisionNumber`.

Revisions are append-only. Corrections create a new Revision.

## 8. JSON payload governance

`submittedData` is historical submitted/proposed evidence only.

It is not:

- canonical Venture truth;
- authorization truth;
- lifecycle truth;
- a relational FK substitute;
- the main reporting source.

Every Revision requires an explicit `payloadVersion`. Each persisted version must remain interpretable by application validators.

UPDATE payload semantics must distinguish:

```text
field absent        => unchanged
explicit clear      => intentional clear
explicit value      => proposed replacement
```

Approval applies only explicit proposed changes and must never deserialize an old full Venture snapshot and overwrite unrelated newer canonical values.

## 9. Request checks

Required single-row checks include:

```text
purpose != UPDATE
OR ventureId IS NOT NULL
```

```text
REGISTRATION + APPROVED
=> ventureId IS NOT NULL
```

Assuming terminal Requests do not reopen:

```text
terminal status     => resolvedAt IS NOT NULL
non-terminal status => resolvedAt IS NULL
```

## 10. Self-management and authorization

Self-management requires:

```text
authenticated User
+
canonical Person
+
current VentureAssociation
+
required capability
```

Association alone is not authorization.

Owner-proposed canonical Venture changes use an UPDATE Request.

Institutional managers may mutate canonical Venture directly when authorized; those administrative mutations are audited.

Adding/removing responsible Persons changes `VentureAssociation` and remains institutionally controlled.

## 11. Lifecycle rules

Publication is independent from institutional lifecycle.

```text
PUBLISHED => ACTIVE
SUSPENDED => UNPUBLISHED
CLOSED    => UNPUBLISHED
```

Suspension/closure plus unpublication is performed atomically.

Closing is not deletion.

Reopening is explicit and leaves the Venture UNPUBLISHED by default.

A SUSPENDED Venture may receive approved data updates without automatic reactivation or publication.

A normal UPDATE against CLOSED does not auto-apply; it must be rejected, deferred or revalidated after explicit reopening.

## 12. Concurrency

Multiple UPDATE Requests may coexist and an administrator may modify the canonical Venture while requests remain pending.

Approval must therefore:

1. re-read current Venture;
2. read latest relevant Revision;
3. validate payloadVersion and lifecycle;
4. revalidate against current state;
5. apply only explicit changes.

No optimistic-version field is required in V1.1.

## 13. Approval transactions

### REGISTRATION

Atomic flow:

1. load Request + latest Revision;
2. validate state and payload;
3. perform duplicate/reconciliation decision;
4. create or identify Venture;
5. optionally create VentureAssociation;
6. assign `ventureId`;
7. set Request APPROVED + resolution metadata;
8. write Audit;
9. commit.

### UPDATE

Atomic flow:

1. load Request and validate purpose/status;
2. load current Venture;
3. load latest Revision;
4. validate payloadVersion;
5. validate lifecycle;
6. apply explicit mutation only;
7. resolve Request;
8. write Audit;
9. commit.

## 14. FK relation inventory

Entrepreneurship contributes **5** Master relationships:

1. `VentureAssociation.personId -> Person.id`
2. `VentureAssociation.ventureId -> Venture.id`
3. `VentureRequest.reconciledPersonId? -> Person.id`
4. `VentureRequest.ventureId? -> Venture.id`
5. `VentureRequestRevision.requestId -> VentureRequest.id`

All use `onUpdate CASCADE`.

Delete semantics:

- required durable/history references: `RESTRICT`;
- optional reconciled-Person reference: `SET NULL`.

No destructive cascade is used for Request/Revision/Association evidence.

## 15. Integration boundaries

- Identity owns Person/User; Entrepreneurship references Person.
- IAM owns authorization.
- Affiliate is independent.
- Event exists in Frozen V1; Venture↔Event/Fair integration remains deferred.
- Notifications owns delivery mechanisms.
- Reporting derives statistics.
- Finance records ADI money, not private business accounting.
- Inventory records ADI inventory, not Venture commercial offerings.
- Reservations owns bookings.
- Volunteering and Entrepreneurship have no structural dependency on each other.

## 16. Deferred / rejected concepts

Deferred:

- classification/category physical model;
- Media physical model;
- Event/Fair participation;
- hard invariant requiring every ACTIVE Venture to have an active responsible Person;
- lifecycle-history tables;
- finer-grained location;
- publication-consent evidence.

Rejected for V1.1 Core:

- Entrepreneur;
- EntrepreneurProfile;
- Product;
- Service;
- Fair;
- Publication;
- VentureStatusHistory;
- PublicationHistory;
- EntrepreneurHistory;
- isEntrepreneur;
- canManage;
- isAffiliateOwner;
- primaryResponsible;
- ownershipPercentage.

## 17. Final module status

```text
ENTREPRENEURSHIP_V1_1_ENTITY_COUNT=4
ENTREPRENEURSHIP_V1_1_RELATION_COUNT=5

STRUCTURAL_STATUS=CLOSED
RELATIONAL_STATUS=CLOSED
TARGET_STATUS=FROZEN
```
