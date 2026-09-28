---
title: SGI-Curime Volunteering V1.1 — Relational Candidate
status: TARGET FROZEN
target_version: v1.1
module: volunteering
date: 2026-09-26
---

# Volunteering V1.1 — Relational Candidate

## 1. Status and scope

This document records the reconciled Volunteering relational model incorporated into Frozen Target V1.1.

```text
STRUCTURAL_STATUS=CLOSED
RELATIONAL_STATUS=CLOSED
PHYSICAL_RECONCILIATION=CLOSED
TARGET_V1_1_STATUS=FROZEN
IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989
PRISMA=UNCHANGED
MIGRATIONS=NONE
```

Core entity count: **5**.

- `VolunteerOpportunity`
- `VolunteerSession`
- `VolunteerApplication`
- `VolunteerParticipation`
- `VolunteerAttendance`

No sixth persistent entity is required.

## ADD_STATUS_NOTE: 5 entities now physically implemented; replace unqualified IMPLEMENTATION=NONE

The Volunteering V1.1 relational model (5 entities, 11 master relationships) is now physically implemented and verified as part of the Frozen Target V1.1 merge at main@71aa989 (PR #102). The `IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989` reflects the merged checkpoint.

**Deferred cutover:** The following gates remain evidence-dependent and are not yet enforced as DB constraints. Structural implementation does not imply completed historical reconciliation:

- `ID-01`: Person canonical mapping affects volunteering person linking
- `ASM-ATT-01`: Attendance/justification FKs may affect attendance enforcement
- `INV-LEDGER-01` / `INV-LOAN-01`: Not applicable to volunteering (inventory gates)
- `FIN-ORIGIN-01` / `FIN-DON-01`: Not applicable to volunteering (finance gates)
- `RES-STATUS-01`: Not applicable to volunteering (reservation gates)

The 5 entity counts and 11 relationship counts are now the V1.1 structural contract. Prior documentation referencing `IMPLEMENTATION=NONE` for volunteering has been replaced; the structural implementation is now merged and verified.

`VOLUNTEERING_V1_1_ENTITY_COUNT=5`
`VOLUNTEERING_V1_1_RELATION_COUNT=11`
`VOLUNTEERING_V1_1_STRUCTURAL_IMPLEMENTATION=MERGED_AT_71aa989`
`VOLUNTEERING_V1_1_DEFERRED_GATES=ID-01,ASM-ATT-01` (evidence-dependent)

## 2. Domain distinctions

The model intentionally keeps these concepts separate:

```text
Opportunity ≠ Session ≠ Application ≠ Participation ≠ Attendance
```

- Opportunity is the volunteering initiative.
- Session is one concrete volunteering date/journey.
- Application is historical submitted intent to participate.
- Participation is the accepted Person↔Opportunity fact.
- Attendance is the session-level evidence and credited-hours fact.

A volunteer is not represented by a `VolunteerProfile`; the physical person is `Person`.

## 3. State models

### VolunteerOpportunityStatus

```text
DRAFT
PUBLISHED
CLOSED
COMPLETED
CANCELLED
```

Semantics:

- DRAFT may exist without Sessions.
- PUBLISHED accepts new Applications and requires at least one valid Session.
- CLOSED stops new Applications.
- COMPLETED is operational completion.
- CANCELLED preserves history.

### VolunteerSessionStatus

```text
SCHEDULED
COMPLETED
CANCELLED
```

A Session cancelled before starting uses CANCELLED. A Session that started and ended early is completed with its real Attendance evidence retained.

### VolunteerApplicationStatus

```text
PENDING
APPROVED
REJECTED
WITHDRAWN
```

### VolunteerParticipationStatus

```text
CONFIRMED
COMPLETED
CANCELLED
```

`NO_SHOW` is not a Participation state; attendance facts belong to `VolunteerAttendance`.

### VolunteerAttendanceStatus

```text
PRESENT
ABSENT
EXCUSED
```

Attendance corrections require authorization and audit trace.

## 4. VolunteerOpportunity

Candidate frozen shape:

```text
VolunteerOpportunity
- id                    Int PK
- title                 required
- description?          optional
- location?             optional
- capacity?             optional
- applicationDeadline?  optional
- status                required
- createdByUserId       required FK -> User
- publishedAt?          optional
- closedAt?             optional
- completedAt?          optional
- cancelledAt?          optional
- cancellationReason?   optional
- createdAt             required
- updatedAt             required
```

Constraint:

```text
capacity IS NULL OR capacity > 0
```

`NULL` capacity means no fixed capacity.

Capacity counts active/confirmed participation, not historical application volume.

## 5. VolunteerSession

```text
VolunteerSession
- id                    Int PK
- opportunityId         required FK -> VolunteerOpportunity
- title?                optional
- description?          optional
- location?             optional
- startAt               required
- endAt                 required
- status                required
- cancelledAt?          optional
- cancellationReason?   optional
- createdAt             required
- updatedAt             required
```

Constraint:

```text
startAt < endAt
```

A VolunteerOpportunity has 0..N Sessions.

## 6. VolunteerApplication

```text
VolunteerApplication
- id                                 Int PK
- opportunityId                      required FK -> VolunteerOpportunity
- personId?                          optional FK -> Person
- submittedFullName                  required
- submittedIdentificationType?       optional
- submittedIdentification?           optional
- submittedNormalizedIdentification? optional
- submittedEmail?                    optional
- submittedPhone?                    optional
- motivation?                        optional
- status                             required
- requestedAt                        required
- reviewedByUserId?                  optional FK -> User
- reviewedAt?                        optional
- rejectionReason?                   optional
- withdrawnAt?                       optional
- createdAt                          required
- updatedAt                          required
```

The `submitted*` values are historical snapshot data. Reconciliation with `Person` must never rewrite them.

The exact contact requirement for public submission remains non-structural policy: email, phone, or at least one contact method.

No `submittedData jsonb` is used for this V1.1 model.

## 7. VolunteerParticipation

```text
VolunteerParticipation
- id                 Int PK
- opportunityId      required FK -> VolunteerOpportunity
- personId           required FK -> Person
- applicationId      required FK -> VolunteerApplication, UNIQUE
- status             required
- confirmedAt        required
- completedAt?       optional
- cancelledAt?       optional
- cancellationReason? optional
- createdAt          required
- updatedAt          required
```

Constraints:

```text
UNIQUE(opportunityId, personId)
UNIQUE(applicationId)
```

Therefore:

- one Person has at most one effective Participation per Opportunity;
- one Application yields at most one Participation;
- every Participation in V1.1 has provenance from one approved Application.

## 8. VolunteerAttendance

```text
VolunteerAttendance
- id                 Int PK
- participationId    required FK -> VolunteerParticipation
- sessionId          required FK -> VolunteerSession
- status             required
- checkInAt?         optional
- checkOutAt?        optional
- creditedHours      required
- notes?             optional
- recordedByUserId   required FK -> User
- recordedAt         required
- createdAt          required
- updatedAt          required
```

Constraints:

```text
UNIQUE(participationId, sessionId)
creditedHours >= 0

checkInAt IS NULL
OR checkOutAt IS NULL
OR checkInAt <= checkOutAt
```

Total volunteer hours are derived from Attendance and are not persisted as a second source of truth.

## 9. Cardinalities

```text
Person
1 -> 0..N VolunteerApplication

Person
1 -> 0..N VolunteerParticipation

VolunteerOpportunity
1 -> 0..N VolunteerSession

VolunteerOpportunity
1 -> 0..N VolunteerApplication

VolunteerOpportunity
1 -> 0..N VolunteerParticipation

VolunteerApplication
1 -> 0..1 VolunteerParticipation

VolunteerParticipation
1 -> 0..N VolunteerAttendance

VolunteerSession
1 -> 0..N VolunteerAttendance
```

## 10. FK relation inventory

Volunteering contributes **11** Master relationships:

1. `VolunteerOpportunity.createdByUserId -> User.id`
2. `VolunteerSession.opportunityId -> VolunteerOpportunity.id`
3. `VolunteerApplication.opportunityId -> VolunteerOpportunity.id`
4. `VolunteerApplication.personId? -> Person.id`
5. `VolunteerApplication.reviewedByUserId? -> User.id`
6. `VolunteerParticipation.opportunityId -> VolunteerOpportunity.id`
7. `VolunteerParticipation.personId -> Person.id`
8. `VolunteerParticipation.applicationId -> VolunteerApplication.id`
9. `VolunteerAttendance.participationId -> VolunteerParticipation.id`
10. `VolunteerAttendance.sessionId -> VolunteerSession.id`
11. `VolunteerAttendance.recordedByUserId -> User.id`

All use `onUpdate CASCADE`.

Delete behavior:

- durable/history required references: `RESTRICT`;
- optional actor/canonical-reconciliation references: `SET NULL`.

No cascade-delete path is used to erase volunteering history.

## 11. Partial uniqueness and indexes

Required partial uniqueness:

```sql
UNIQUE (opportunityId, personId)
WHERE status = 'PENDING'
  AND personId IS NOT NULL
```

This prevents more than one active reconciled Application for the same Person/Opportunity while still allowing public Applications that are not yet reconciled.

Index candidates:

```text
VolunteerOpportunity(status, applicationDeadline)
VolunteerSession(opportunityId, startAt)
VolunteerApplication(opportunityId, status)
VolunteerApplication(personId, status)
VolunteerApplication(submittedNormalizedIdentification)
VolunteerParticipation(personId, status)
VolunteerParticipation(opportunityId, status)
VolunteerAttendance(sessionId, status)
```

Physical implementation should avoid redundant indexes already provided by UNIQUE constraints.

## 12. Transactional invariants

### Publish Opportunity

Publication must atomically verify that at least one valid Session exists.

```text
PUBLISHED => at least one qualifying VolunteerSession
```

### Accept Applications

Only a PUBLISHED Opportunity accepts new Applications. State must be re-read transactionally to avoid stale-client submission.

### Approve Application

Approval must atomically:

1. load pending Application;
2. load Opportunity;
3. reconcile/resolve Person;
4. validate duplicate participation;
5. validate capacity;
6. create CONFIRMED Participation with application provenance;
7. resolve Application as APPROVED;
8. persist reviewer metadata and Audit;
9. commit.

DB uniqueness protects against duplicate Participation under concurrency; capacity still requires transactional concurrency control.

### Record Attendance

Before Attendance is persisted, validate:

```text
Participation.opportunityId = Session.opportunityId
Session has started
Session != CANCELLED
Participation != CANCELLED
```

Then validate hours/status, persist recorder metadata and preserve audit trace for later corrections.

## 13. Identity and authorization boundary

```text
Volunteer identity      -> Person
Authenticated actor     -> User
Institutional truth     -> Participation / Attendance
```

Having a User is not required to be a volunteer. Being an Affiliate is not required to participate.

## 14. Deferred / excluded

Deferred:

- direct `VolunteerOpportunity ↔ Event` relation;
- VolunteerProfile;
- VolunteerSkill.

Not required:

- VolunteerHistory;
- VolunteerServiceLog;
- VolunteerAttendanceHistory.

The current facts plus Audit satisfy V1.1 history requirements.

## 15. Final module status

```text
VOLUNTEERING_V1_1_ENTITY_COUNT=5
VOLUNTEERING_V1_1_RELATION_COUNT=11

STRUCTURAL_STATUS=CLOSED
RELATIONAL_STATUS=CLOSED
PHYSICAL_RECONCILIATION=CLOSED
TARGET_STATUS=FROZEN
```
