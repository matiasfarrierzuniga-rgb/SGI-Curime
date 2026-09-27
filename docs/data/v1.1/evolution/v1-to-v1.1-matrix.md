---
title: SGI-Curime — Frozen V1 to Frozen V1.1 Evolution Matrix
status: TARGET FROZEN
from_version: v1
to_version: v1.1
date: 2026-09-26
---

# Frozen V1 → Frozen V1.1 Evolution Matrix

## 1. Purpose

This matrix records exactly what changes between the Frozen Target V1 baseline and Frozen Target V1.1.

It is a Target-to-Target evolution artifact, not an AS-IS implementation gap analysis.

## 2. Global counts

| Metric | Frozen V1 | Frozen V1.1 | Delta |
| --- | ---: | ---: | ---: |
| Persistent entities | 40 | 49 | +9 |
| Transitional entities | 1 | 1 | 0 |
| Master relationships | 61 | 77 | +16 |

Persistent-entity delta:

```text
+5 Volunteering
+4 Entrepreneurship
```

Relationship delta:

```text
+11 Volunteering
+5 Entrepreneurship
```

## 3. Domain evolution

| Domain | V1 → V1.1 disposition | V1.1 effect |
| --- | --- | --- |
| Organization | PRESERVED | No new organization FK; singleton boundary remains. |
| Identity and access | PRESERVED / REFERENCED | Person/User are reused by new modules; IAM structure is not redesigned. |
| Affiliation | PRESERVED | Volunteering and Entrepreneurship do not require Affiliate. |
| Governance | PRESERVED | No new governance persistence introduced. |
| Assemblies | PRESERVED | No structural change. |
| Reservations and events | PRESERVED | Existing Event stays; new direct module↔Event relations remain deferred. |
| Finance and donations | PRESERVED | Entrepreneurship does not become private-business accounting; Volunteering introduces no financial ownership. |
| Inventory | PRESERVED | Venture offerings are not ADI Inventory. |
| Volunteering | ADDED | Five persistent entities. |
| Entrepreneurship | ADDED | Four persistent entities. |

## 4. Added Volunteering entities

| Entity | Purpose | New primary relationships |
| --- | --- | --- |
| `VolunteerOpportunity` | Whole volunteering initiative. | creator User; Sessions; Applications; Participations |
| `VolunteerSession` | Concrete session/date. | Opportunity; Attendances |
| `VolunteerApplication` | Historical submitted participation request. | Opportunity; optional Person; optional reviewer User; optional resulting Participation |
| `VolunteerParticipation` | Accepted Person↔Opportunity fact. | Opportunity; Person; source Application; Attendances |
| `VolunteerAttendance` | Session-level attendance and credited-hours fact. | Participation; Session; recorder User |

Key V1.1 decisions:

- multisesion;
- explicit submitted Application snapshots;
- Application may precede Person reconciliation;
- Participation requires Person;
- Participation requires source Application;
- Attendance unique per Participation/Session;
- credited hours persisted at Attendance level;
- total hours derived;
- capacity and approval concurrency transactional;
- no VolunteerProfile/VolunteerHistory Core table.

## 5. Added Entrepreneurship entities

| Entity | Purpose | New primary relationships |
| --- | --- | --- |
| `Venture` | Canonical current Venture truth. | Associations; Requests |
| `VentureAssociation` | Temporal Person↔Venture episode. | Person; Venture |
| `VentureRequest` | Administrative REGISTRATION/UPDATE process. | optional reconciled Person; conditional Venture; Revisions |
| `VentureRequestRevision` | Immutable submitted/resubmitted proposal evidence. | Request |

Key V1.1 decisions:

- Venture is independent from Person/User/request;
- N:M Person↔Venture through temporal Association;
- one active association per Person/Venture via partial unique index;
- REGISTRATION and UPDATE share a request process;
- CHANGES_REQUESTED/resubmission uses append-only Revisions;
- versioned JSON payload is historical evidence only;
- explicit patch semantics prevent stale full-snapshot overwrite;
- publication lifecycle remains independent from institutional lifecycle;
- no Entrepreneur/Product/Service/Fair/Publication Core entities.

## 6. Identity evolution

No new identity root is introduced.

```text
Person
├─ User                  (Frozen V1)
├─ Affiliate             (Frozen V1)
├─ VolunteerApplication  (V1.1 optional reconciliation)
├─ VolunteerParticipation(V1.1 required effective identity)
├─ VentureAssociation    (V1.1 required)
└─ VentureRequest        (V1.1 optional requester reconciliation)
```

V1.1 therefore extends Person reuse rather than adding volunteer/entrepreneur identity tables.

## 7. IAM evolution

No structural IAM change:

```text
User -> one Role
Role -> RolePermission -> Permission
```

New User FKs in Volunteering record authorized institutional actors:

- Opportunity creator;
- Application reviewer;
- Attendance recorder.

They do not mean User is required to exist as a volunteer.

Entrepreneurship self-management checks User + Person + current VentureAssociation + capability at application level; it does not add a role field to VentureAssociation.

## 8. History strategy evolution

Frozen V1 principle remains:

```text
canonical mutable identity != historical submitted snapshot
```

V1.1 applies it in two domain-specific ways:

| Module | Historical submitted evidence |
| --- | --- |
| Volunteering | explicit snapshot fields on `VolunteerApplication` |
| Entrepreneurship | append-only `VentureRequestRevision.submittedData` + `payloadVersion` |

No generic Request/History abstraction is introduced.

## 9. Referential-policy evolution

Frozen TM-D09 remains authoritative and is extended to the 16 new FKs.

All new FKs:

```text
onUpdate CASCADE
```

Delete retention:

- required durable/history relationships → RESTRICT;
- optional actor/reconciliation references → SET NULL;
- no new destructive cascade path for volunteering/venture history.

## 10. Constraints added by V1.1

Examples of new DB-level constraints:

```text
VolunteerOpportunity.capacity IS NULL OR capacity > 0
VolunteerSession.startAt < endAt
VolunteerParticipation UNIQUE(opportunityId, personId)
VolunteerParticipation UNIQUE(applicationId)
VolunteerAttendance UNIQUE(participationId, sessionId)
VolunteerAttendance.creditedHours >= 0

Venture: PUBLISHED => ACTIVE
VentureAssociation: endedAt IS NULL OR endedAt >= startedAt
VentureRequest: UPDATE => ventureId IS NOT NULL
VentureRequest: approved REGISTRATION => ventureId IS NOT NULL
VentureRequestRevision UNIQUE(requestId, revisionNumber)
```

New partial uniqueness:

```text
VolunteerApplication:
UNIQUE(opportunityId, personId)
WHERE status=PENDING AND personId IS NOT NULL

VentureAssociation:
UNIQUE(personId, ventureId)
WHERE endedAt IS NULL
```

## 11. Explicitly unchanged implementation state

The V1→V1.1 Target evolution does not itself modify:

- `current-model.md`;
- Prisma;
- migration history;
- database data;
- backend writers/readers;
- frontend.

Those differences belong to the future AS-IS → Target V1.1 Gap Matrix.

## 12. Deferred evolution

V1.1 intentionally postpones:

- direct Volunteering↔Event relation;
- Venture↔Event/Fair participation;
- Venture classifications/categories physical model;
- cross-cutting Media physical model;
- VolunteerProfile/VolunteerSkill;
- Entrepreneur/EntrepreneurProfile/Product/Service.

Their absence is deliberate scope control, not accidental omission.
