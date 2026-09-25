## 1. Establish Evidence Baseline

- [x] 1.1 Record baseline commit, branch/worktree state, repository structure, and relevant validation commands without modifying production files.
- [x] 1.2 Inventory current Prisma entities, relations, migrations, and integrity constraints relevant to identity, roles, actors, reservations, payments, donations, and movements.
- [x] 1.3 Map backend and frontend consumers for `Person`, `User`, `Affiliate`, `Role`, `FinancialCharge`, `Payment`, `FinancialMovement`, and current access policies.

## 2. Document Identity and Role Governance

- [x] 2.1 Create identity ownership matrix covering canonical owner, current writers/readers, snapshot fields, transition risk, and decision status.
- [x] 2.2 Classify role catalog values by authorization, institutional position, mixed use, or ambiguity, with repository evidence.
- [x] 2.3 Document `SystemRole` and `Position` as separate target concepts while keeping `AffiliatePosition` and multiplicity rules out of scope.
- [x] 2.4 Record pending read-only metrics for missing Person links, conflicts, duplicates, and reconciliation cases; do not execute write-capable scripts.

## 3. Document Actors and Financial Lineage

- [x] 3.1 Build module actor/operator matrix for reservations, affiliate requests, donations, inventory loans, and financial operations.
- [x] 3.2 Record why global `Party` remains blocked and list bounded future alternatives without introducing a shared model.
- [x] 3.3 Document Reservation, FinancialCharge, Payment, and FinancialMovement lineage, including current service-level transitions and source conventions.
- [x] 3.4 Document Donation original/reversal movement lineage and identify polymorphic `sourceId` limitations.
- [x] 3.5 Record Payment-to-Movement explicit linkage as a separate future change candidate, not as an implemented requirement.

## 4. Record Governance and Exit Criteria

- [x] 4.1 Record ADR-DATA-001 through ADR-DATA-004 statuses, rationale, blockers, and approval boundaries.
- [x] 4.2 Document integrity ownership, migration sequence, reconciliation policy, validation gates, risks, open questions, and unresolved observations.
- [x] 4.3 Verify the Phase 0 scope boundary: only OpenSpec documentation changed; no application code, dependencies, generated files, migrations, infrastructure, or data changed.
- [x] 4.4 Run `openspec validate "database-architecture-phase-0" --strict --type change` and record the result.
- [x] 4.5 Run `openspec status --change "database-architecture-phase-0" --json` and confirm all planning artifacts are complete before any implementation phase.
