## Why

Current `main` introduced an active `InstitutionalProfile` singleton, DINADECO consumers, administrative profile flows, and institutional board relations after DB-1 diverged. Integrating DB-1 unchanged would create two overlapping institutional roots, so a forward-only reconciliation is required before the frozen Target v1 `OrganizationProfile` can become the sole authority without losing merged functionality.

## What Changes

- Reconcile the shared migration history from `InstitutionalProfile` to canonical `OrganizationProfile` through additive, forward-only migrations; never rewrite `20260920120000_add_institutional_profile` or `20260922120000_add_institutional_board`.
- Establish one explicit authority at every transition phase, prohibit dual authoritative writes, and retire the legacy root only after verified consumer cutover.
- Map direct fields and require controlled authoritative reconciliation for semantically uncertain or missing values before enforcing canonical requiredness.
- Preserve the existing `/institutional-profile` API and frontend contract temporarily through compatibility adapters backed by canonical `OrganizationProfile`.
- Preserve DINADECO report behavior, authorization capabilities, and audit continuity while moving reads and writes to the canonical root.
- Repoint `BoardTerm` to canonical `OrganizationProfile` without changing `BoardTerm`, `BoardAppointment`, or `BoardPosition` into Target governance entities.
- Reconcile Current/AS-IS documentation with the implementation now present in `main` while preserving accepted/frozen Target v1 documentation.
- Define migration, abort, verification, and legacy-retirement gates proving one complete authoritative row, preserved consumers, preserved board data, and no data loss.
- **BREAKING** at the persistence boundary: `InstitutionalProfile` ceases to be an authoritative table after cutover and becomes eligible for removal only after the retirement gate passes. Existing public HTTP compatibility is preserved during this change.
- Exclude DB-2 identity reconciliation, DB-4 governance redesign, unrelated financial redesign, and any Target v1 redesign.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization/organization-profile-foundation`: Add forward reconciliation, compatibility, consumer-preservation, board-FK transition, and legacy-retirement requirements while preserving the existing canonical singleton contract.

## Impact

- Persistence: Prisma organization models and a new forward migration after the shared `InstitutionalProfile` and board migrations.
- Data transition: authoritative field reconciliation, canonical row verification, deterministic cutover, and legacy retirement eligibility.
- Backend: institutional profile service/controller/DTO, DINADECO report integration, institutional board relation, app wiring, capabilities, and audit naming for future events.
- Frontend: institutional profile and DINADECO contracts remain compatible during cutover; internal canonical naming may change behind adapters.
- Documentation/OpenSpec: Current/AS-IS artifacts are updated to the post-PR #94 baseline; Target v1 and archived DB-1 history remain unchanged.
- Operations: backup/checkpoint, preflight evidence, abort conditions, phased deployment, and exit-gate verification are required. No new runtime dependency is expected.
