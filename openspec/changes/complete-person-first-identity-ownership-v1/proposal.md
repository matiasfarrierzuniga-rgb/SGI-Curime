## Why

Person identity and contact facts remain duplicated across `User` and `Affiliate`, while request and history records mix legitimate submitted snapshots with generic field names. Current independent writes, nullable identity links, incomplete reconciliation evidence, and consumer contracts make column removal or constraint enforcement unsafe. This change defines one evidence-led, reversible Person-first transition before the blocked institutional-access work resumes.

## What Changes

- Establish Person as canonical owner of structured personal identity and retained independent personal-contact data; retain User as owner of account access, security lifecycle, and sole authoritative login/access email.
- Define complete ownership categories, current read/write/API exposure, canonical write rules, snapshot retention, reconciliation rules, compatibility projections, and removal gates for Person-linked records.
- **BREAKING (future, versioned):** transition generic request snapshot field names to explicit `submitted*` names without parsing arbitrary `fullName` values; retain compatibility and submitted evidence through the API transition.
- **BREAKING (future, versioned):** retire direct User/Affiliate mutation of migrated personal fields only after consumer migration, reconciliation, and zero-reader/zero-writer certification.
- Stage schema, API, frontend, data reconciliation, and certification work from inventory through safe removal; do not authorize implementation before product decision gates are resolved.
- Preserve `reconcile-institutional-access-contract-v1` Phase B WIP/stash as non-canonical evidence. It remains temporarily blocked after Phase A/during B and MUST be reapplied and reconciled only after this change reaches its Person-first checkpoint.

## Capabilities

### New Capabilities

- `identity/person-first-ownership`: Defines canonical Person ownership, access-account boundaries, submitted/historical snapshot preservation, reconciliation, compatibility transition, and certification behavior for Person-linked records.

### Modified Capabilities

None.

## Impact

- Persistence: future Prisma models/migrations for Person-linked duplicate retirement, explicit request snapshot names, links, constraints, and governance relation cleanup.
- Backend/API: Person resolver, User/Affiliate reads and writes, UserRequest/AffiliateRequest approvals, public snapshots, validation, transactions, and versioned compatibility contracts.
- Frontend: User/Affiliate forms, types, listings, detail projections, request submission/review views, and API client transition.
- Data operations: normalized identity preflight, duplicate/conflict quarantine, null-link handling, evidence-backed backfill, rollback, and certification.
- Dependencies: no production dependency is planned. Frozen decisions require evidence-led reconciliation, staged compatibility, and certification before any physical retirement or required Person link.
