# Design

## Context

`AssemblyCall` has persisted fields and a unique `(assemblyId, callNumber)` constraint, but current assembly service and UI do not use it. Existing assembly quorum remains configured on legacy mapped fields and must remain unchanged.

## Goals / Non-Goals

**Goals:**
- Add atomic replacement and detail retrieval through the existing assemblies feature.
- Reuse `adm.assemblies.read/manage`, existing audit style, TanStack Query invalidation and management page.

**Non-Goals:**
- No legal validation of authority, notice period, legal call count, quorum law or equivalence between configured calls and legal validity.
- No migration, backfill, public notification or change to attendance/quorum completion rules.

## Decisions

### Replace complete set, not independent CRUD
Call rounds use one `PUT /assemblies/:id/calls` operation. This mirrors convocations, lets the server validate the complete set, and makes persisted state match the form. Separate create/update/delete endpoints would create partial states and more lifecycle paths.

### Require a non-empty configured set
The new workflow stores actual configured rounds, so accepting an empty replacement would erase the institutional record without an explicit cancel operation. Existing assemblies without rows remain readable for compatibility.

### Preserve existing assembly quorum
Each call carries its own persisted quorum configuration. Existing `Assembly` quorum remains used for current attendance display and completion because changing that behavior would exceed this increment.

### Serialize only required fields
Detail returns ordered call rows with public field names matching Prisma fields. It avoids exposing internal implementation or adding a new frontend route.

## Risks / Trade-offs

- [Legal validity cannot be inferred from configured calls] → UI labels data as configured call rounds; decision is recorded as pending.
- [Existing assemblies lack rows] → reads return an empty list; no migration or fabricated history.
- [Concurrent edits] → transaction atomically deletes/recreates after state validation; future optimistic concurrency remains separate work.

## Migration Plan

No migration. Deploy code against existing `AssemblyCall` table. Rollback application code; rows remain harmless and are not consumed by existing workflow.
