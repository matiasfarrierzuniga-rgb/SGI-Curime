# ADR-001 — Public Content Governance

## Status

Accepted

## Context

Future public modules need controlled publication without exposing internal data.
No public-content domain consumer exists in PUBLIC-0.

## Decision

- Each domain owns its publication lifecycle. No polymorphic `PublicContent` table.
- Business state and publication state stay separate. Future domains may use
  `status` and `publicationStatus` independently.
- Conceptual publication states are `INTERNAL`, `DRAFT`, `REVIEW`, `PUBLISHED`,
  and `ARCHIVED`. Persistence starts with first real consumer, expected PUBLIC-2.
- Only `PUBLISHED` records may reach public APIs.
- Public APIs return explicit allow-listed DTO projections. Administrative DTOs
  and entities are never reused as public responses.
- Unclassified fields are private: identifiers, contact details, addresses,
  banking data, credentials, tokens, signatures, notes, metadata, and private
  documents remain non-public.
- Publication actions reuse `AuditService`. Future actions follow existing
  domain-specific naming, such as `<DOMAIN>_PUBLISHED` and `<DOMAIN>_ARCHIVED`.

## Consequences

PUBLIC-0 adds no Prisma model, publication CRUD, or public endpoint. Each
future public domain must define its public projection and audit actions when
it introduces persisted publication state.

## Rejected Alternatives

- Generic polymorphic public-content table: couples unrelated domain lifecycles.
- Deny-list response filtering: new internal fields could leak by default.
