## Why

SGI-Curime has a functional incremental data model, but identity, institutional roles, business actors, and economic lineage have accumulated semantic coupling. This Phase 0 establishes an evidence-based architectural baseline before any schema, migration, backfill, or production change is proposed.

## What Changes

- Document the verified AS-IS data model at baseline `3e24a9d`.
- Record field ownership and snapshot semantics for `Person`, `User`, `Affiliate`, `UserRequest`, and `AffiliateRequest`.
- Classify the current `Role` catalog and document its authorization and institutional-position consumers.
- Record unresolved `Position` business rules without implementing `AffiliatePosition`.
- Document business actors versus authenticated system operators by module.
- Keep `Party` explicitly blocked because current modules do not justify a global abstraction.
- Document `Reservation -> FinancialCharge -> Payment -> FinancialMovement` lineage.
- Document Donation original and reversal movement lineage and the current polymorphic `sourceId` limitation.
- Record Payment-to-Movement explicit lineage as a separate future change candidate.
- Record ADR-DATA-001 through ADR-DATA-004 with explicit statuses and approval boundaries.
- Define integrity ownership, migration governance, risks, open questions, future changes, and Phase 0 exit criteria.
- Make no production, Prisma, migration, dependency, or data changes.

## Capabilities

### New Capabilities

- `architecture/data-model`: Evidence-based governance baseline for identity ownership, role separation, business actors, financial lineage, integrity rules, and future data-model evolution.

### Modified Capabilities

None. Existing requirements are not changed; this capability documents architectural governance for future changes.

## Impact

- Documentation only under this OpenSpec change.
- Evidence references backend Prisma schema, migrations, NestJS services, frontend access consumers, tests, and current documentation.
- No runtime APIs, database tables, constraints, generated clients, dependencies, or data are changed.
- Identity completeness metrics remain pending until Daniel runs approved read-only queries against a known database.
- Phase 0 is approved as the architectural and governance baseline.
- ADR-DATA-002 is accepted only for the conceptual separation of ERP authorization and institutional Position; ADR-DATA-001 and ADR-DATA-004 remain proposed; ADR-DATA-003 remains blocked.
- The approval authorizes no physical database, schema, migration, backfill, data, or production change.
