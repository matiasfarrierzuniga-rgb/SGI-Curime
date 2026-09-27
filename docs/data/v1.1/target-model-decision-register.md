---
title: SGI-Curime Target Data Model V1.1 — Decision Register
status: TARGET FROZEN
target_version: v1.1
baseline: Target V1 TM-D01..TM-D13
date: 2026-09-26
---

# Target Data Model V1.1 — Decision Register

## 1. Purpose

This register captures the design decisions introduced or reaffirmed while evolving Frozen Target V1 into Frozen Target V1.1.

Frozen V1 decisions `TM-D01..TM-D13` remain authoritative unless an explicit V1.1 decision states an additive extension. No V1 decision is silently rewritten.

## 2. Review status

```text
GLOBAL_CONSISTENCY_REVIEW=PASS
FREEZE_READINESS_REVIEW=PASS
BLOCKING_DESIGN_DECISIONS=0
TARGET_STATUS=FROZEN
```

## 3. V11-D01 — Additive evolution

**Decision:** V1.1 is additive over Frozen V1.

```text
40 Frozen persistent entities
+ 5 Volunteering
+ 4 Entrepreneurship
= 49 persistent entities
```

The Frozen V1 historical package remains preserved.

**Status:** CLOSED.

## 4. V11-D02 — Technical primary-key convention

**Decision:** Every new persistent V1.1 entity uses the Frozen technical identifier convention:

```text
id Int PK autoincrement
```

A public UUID/slug may be added only when a specific public-identity requirement justifies it. Public identity never replaces the technical PK.

**Status:** CLOSED.

## 5. V11-D03 — Single-organization boundary

**Decision:** V1.1 does not distribute `organizationId` into Volunteering or Entrepreneurship.

`OrganizationProfile` remains singleton root.

**Status:** CLOSED.

## 6. V11-D04 — Person remains the domain identity root

**Decision:** Volunteering and Entrepreneurship reuse `Person`.

No `VolunteerProfile`, `Entrepreneur`, `EntrepreneurProfile` or duplicate personal-identity table is introduced.

A domain fact may reference Person without requiring User or Affiliate.

**Status:** CLOSED.

## 7. V11-D05 — Volunteering five-entity decomposition

**Decision:** Volunteering Core is exactly:

- VolunteerOpportunity;
- VolunteerSession;
- VolunteerApplication;
- VolunteerParticipation;
- VolunteerAttendance.

Opportunity, Session, Application, Participation and Attendance remain separate persistence concepts.

**Status:** CLOSED.

## 8. V11-D06 — Volunteering historical submission and approval provenance

**Decision:** VolunteerApplication preserves explicit submitted snapshot fields and may initially have nullable `personId`.

Every effective Participation:

- requires canonical Person;
- requires one source Application;
- uses `applicationId NOT NULL UNIQUE`;
- uses `UNIQUE(opportunityId, personId)`.

Application→Participation provenance is explicit rather than inferred from Audit.

**Status:** CLOSED.

## 9. V11-D07 — Session-level Attendance and derived hours

**Decision:** Attendance is recorded per Participation + Session.

```text
UNIQUE(participationId, sessionId)
creditedHours >= 0
```

Total volunteer hours are derived from Attendance rather than persisted on Person/Participation.

**Status:** CLOSED.

## 10. V11-D08 — Volunteering concurrency and capacity

**Decision:** Opportunity capacity is nullable; when present it must be positive.

Approval validates capacity, canonical identity and duplicate participation in one atomic operation. DB uniqueness is the final protection against concurrent duplicate Participation.

**Status:** CLOSED.

## 11. V11-D09 — Entrepreneurship four-entity decomposition

**Decision:** Entrepreneurship Core is exactly:

- Venture;
- VentureAssociation;
- VentureRequest;
- VentureRequestRevision.

No Entrepreneur/EntrepreneurProfile/Product/Service/Fair/Publication entity enters V1.1 Core.

**Status:** CLOSED.

## 12. V11-D10 — Temporal VentureAssociation

**Decision:** `VentureAssociation` represents one continuous Person↔Venture temporal episode.

```text
endedAt IS NULL OR endedAt >= startedAt
```

Historical re-entry is valid, so there is no global pair uniqueness.

One active episode is enforced with PostgreSQL partial uniqueness:

```sql
UNIQUE (personId, ventureId)
WHERE endedAt IS NULL
```

Historical interval overlap is prevented transactionally; an exclusion constraint is deferred.

**Status:** CLOSED.

## 13. V11-D11 — Venture request/revision evidence

**Decision:** VentureRequest is administrative process, separate from canonical Venture.

REGISTRATION and UPDATE use the same Request entity with conditional Venture semantics.

Because CHANGES_REQUESTED/resubmission must not overwrite evidence, each Request owns append-only `VentureRequestRevision` rows.

```text
UNIQUE(requestId, revisionNumber)
payloadVersion NOT NULL
submittedData NOT NULL
submittedAt NOT NULL
```

No `isLatest`/latestRevisionId duplicate truth is persisted.

**Status:** CLOSED.

## 14. V11-D12 — JSON payload governance

**Decision:** `VentureRequestRevision.submittedData` is PostgreSQL `jsonb` candidate historical proposal evidence.

Rules:

- immutable after submission;
- explicit `payloadVersion`;
- every persisted payload version remains interpretable;
- validation is application-boundary responsibility;
- UPDATE payload has explicit patch semantics;
- approval re-reads current Venture and mutates only explicitly proposed fields;
- payload is never canonical Venture truth or FK substitute.

**Status:** CLOSED.

## 15. V11-D13 — Venture lifecycle/publication separation

**Decision:** Venture institutional lifecycle and publication lifecycle remain separate.

Institutional:

```text
ACTIVE
SUSPENDED
CLOSED
```

Publication:

```text
UNPUBLISHED
PUBLISHED
```

Invariant:

```text
PUBLISHED => ACTIVE
```

Suspension/closure atomically forces UNPUBLISHED. Reopen does not auto-publish.

**Status:** CLOSED.

## 16. V11-D14 — TM-D09 extension

**Decision:** Frozen TM-D09 is extended, not replaced.

For every V1.1 FK:

- `onUpdate CASCADE`;
- delete action is explicit and relation-specific;
- required durable/history facts use `RESTRICT`;
- optional actor or reconciliation links use `SET NULL`;
- no destructive cascade may erase volunteering or entrepreneurship history.

The V1.1 Master relation inventory contains:

```text
61 inherited Frozen relations
11 Volunteering relations
5 Entrepreneurship relations
= 77
```

**Status:** CLOSED.

## 17. V11-D15 — Deferred integrations stay outside Core

**Decision:** the following remain deferred rather than being guessed during freeze:

- Volunteering↔Event;
- Venture↔Event/Fair;
- Venture classifications/categories physical model;
- cross-cutting Media model;
- detailed public identifiers/slugs without explicit requirement.

Deferred scope does not block V1.1 freeze.

**Status:** CLOSED.

## 18. V11-D16 — Freeze and change control

**Decision:** after the formal V1.1 freeze, structural modifications require:

1. demonstrable inconsistency correction;
2. explicit amendment; or
3. Target V1.2 evolution.

Implementation may not silently alter the relational contract.

**Status:** CLOSED.

## 19. Open policies that do not reopen the model

The following remain non-structural:

- VolunteerApplication public contact requirement;
- public self-service withdrawal mechanism;
- exact Venture public-profile minimum content;
- minimum active responsible-person policy for an ACTIVE Venture.

These may be resolved at API/application-policy level unless later evidence shows a structural requirement.
