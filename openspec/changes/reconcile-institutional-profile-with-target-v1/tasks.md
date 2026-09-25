## 1. Preconditions And Baseline

- [x] 1.1 Start implementation from current `main`, preserve this OpenSpec change and archived DB-1 evidence, and prove the branch does not merge the DB-1 implementation migration unchanged.
- [x] 1.2 Record immutable hashes for shared migrations `20260920120000_add_institutional_profile` and `20260922120000_add_institutional_board`, then add a guard proving neither file changes in the final diff.
- [x] 1.3 Inventory every `InstitutionalProfile` reader/writer, DINADECO contract, profile/board route, capability, audit action, frontend consumer, and board foreign key against the current-main baseline.
- [ ] 1.4 Implement a read-only preflight that classifies `MAIN_LEGACY_ONLY`, `CANONICAL_ONLY`, `BOTH_EQUIVALENT`, `BOTH_CONFLICTING`, `NEITHER`, and `HISTORY_MISMATCH` without logging institutional values.
- [ ] 1.5 Define and exercise abort behavior for unsupported migration history, multiple singleton rows, conflicting roots, unknown environment ownership, and unavailable authoritative configuration.
- [ ] 1.6 Document and verify the database checkpoint/restore procedure required before any reconciliation mutation.

## 2. Canonical Schema Preparation

- [ ] 2.1 Reconcile the Prisma model from current `InstitutionalProfile` toward canonical `OrganizationProfile` while retaining only bounded transitional mappings required by compatibility and Board* preservation.
- [ ] 2.2 Create a new forward preparation migration after shared main history that introduces canonical field representation on the existing authority without creating a second writable institutional root.
- [ ] 2.3 Add physical-state inspection for table names, singleton constraints, field types/nullability, board FK targets, legacy enum presence, and pre-existing branch-only canonical state.
- [ ] 2.4 Preserve `BoardTerm`, `BoardAppointment`, and `BoardPosition` as transitional models and add no `GovernancePosition`, `GovernanceTerm`, or `GovernanceMembership` implementation.
- [ ] 2.5 Add focused migration tests proving the preparation phase preserves shared migration records, institutional row identity, board rows, and single-writer authority.

## 3. Authoritative Data Reconciliation

- [ ] 3.1 Implement controlled process-configuration input for every canonical field with required values except nullable `notificationFax`, using no tracked institutional data, defaults, placeholders, or frontend fallback.
- [ ] 3.2 Implement D1 validation so `dinadecoRegion` contributes to `region` only when a nonblank bounded value exactly matches authoritative configuration.
- [ ] 3.3 Implement D2/D4 handling so `physicalAddress` comes from authoritative input or explicit address equivalence, `locality` is never concatenated, and legacy-only values are captured in transition evidence.
- [ ] 3.4 Implement D3 mapping from `INTEGRAL`/`SPECIFIC` to attested canonical text and reject null, unknown, non-attested, or reverse-incompatible organization types.
- [ ] 3.5 Implement D5 contact mappings from phone/telefax/email to canonical notification fields with trimming, bounds, nullable-fax handling, and conflict detection.
- [ ] 3.6 Implement D6/D10 compare-attest-preserve behavior for legacy-only, canonical-only, and reviewed equivalent dual-table states; reject conflicting roots without overwrite or deletion.
- [ ] 3.7 Make reconciliation atomic and idempotent, report only field names in diagnostics, disconnect deterministically, and prove identical reruns preserve all institutional values and protected timestamps.
- [ ] 3.8 Add unit and PostgreSQL tests for complete, missing, ambiguous, conflicting, equivalent, and pre-existing canonical row paths without using real institutional fixtures.

## 4. Profile Compatibility Layer

- [ ] 4.1 Refactor the institutional profile service to use one declared persistence authority and translate existing compatibility fields to canonical fields without dual writes.
- [ ] 4.2 Preserve `GET /institutional-profile`, `PATCH /institutional-profile`, and their current response/request field names through an explicit compatibility mapper.
- [ ] 4.3 Reject null or blank writes to canonical required fields while preserving the row and returning validation behavior consumable by existing clients.
- [ ] 4.4 Preserve `adm.institutional-profile.read` and `adm.institutional-profile.update` assignments and verify no unrelated capability or RBAC change enters the diff.
- [ ] 4.5 Update the institutional profile frontend to preserve route/navigation behavior, display canonical-backed compatibility values, and enforce the tightened required-field contract.
- [ ] 4.6 Add backend, e2e, and frontend tests proving compatible reads/updates, required-field rejection, organization-type translation, address projection, and transitional locality behavior.

## 5. DINADECO And Application Consumer Cutover

- [ ] 5.1 Route DINADECO institutional reads through canonical `OrganizationProfile` while preserving the existing `data.institutionalProfile` external shape.
- [ ] 5.2 Preserve the report's `RepeatableRead` snapshot behavior, financial calculations, capabilities, and frontend presentation without adding financial redesign.
- [ ] 5.3 Update module wiring and generated Prisma usage so no backend service reads or writes legacy institutional storage independently.
- [ ] 5.4 Update frontend financial types only as required for compatibility and prove current DINADECO pages and profile-editor links remain functional.
- [ ] 5.5 Add focused report and frontend regression tests comparing institutional output before and after canonical cutover.

## 6. Board Foreign-Key Cutover

- [ ] 6.1 Capture pre-cutover counts and stable fingerprints for every `BoardTerm` and `BoardAppointment` row and verify every profile reference equals singleton identity `1`.
- [ ] 6.2 Create forward transactional DDL that repoints `BoardTerm.institutionalProfileId` to canonical `OrganizationProfile` and normalizes FK/constraint metadata without recreating board rows.
- [ ] 6.3 Update Prisma relation ownership while retaining the transitional database column and all existing board API/frontend contracts.
- [ ] 6.4 Verify board list/create/update behavior, person candidate behavior, authorization, and audit actions remain unchanged.
- [ ] 6.5 Add migration and integration tests proving board row fingerprints, appointment relations, and FK integrity survive cutover.

## 7. Canonical Enforcement And Audit Continuity

- [ ] 7.1 Create the final forward cutover migration that selects or renames the verified physical root to `OrganizationProfile` according to the approved preflight state.
- [ ] 7.2 Enforce fixed `id = 1`, canonical lengths, required/nonblank values, nullable nonblank fax, primary key, and PostgreSQL delete protection only after data reconciliation passes.
- [ ] 7.3 Prove all reads and writes resolve to canonical storage and add a guard against any remaining authoritative legacy write path.
- [ ] 7.4 Preserve historical `INSTITUTIONAL_PROFILE_UPDATED` audit rows unchanged and emit one sanitized `ORGANIZATION_PROFILE_UPDATED` event with canonical entity/field names for each future mutation.
- [ ] 7.5 Update audit readers/tests to present legacy and canonical institutional history coherently without rewriting or duplicating events.
- [ ] 7.6 Regenerate Prisma client and run focused compile/type validation proving canonical model, compatibility service, report consumer, and board relation use the generated API correctly.

## 8. Documentation Reconciliation

- [ ] 8.1 Update Current/AS-IS data inventory to the post-PR #94 baseline, recording `InstitutionalProfile`, `BoardTerm`, `BoardAppointment`, and `BoardPosition` as current/transitional evidence.
- [ ] 8.2 Update the Current-to-Target gap matrix and migration roadmap with this reconciliation wave, field mappings, data gates, compatibility period, and DB-4 deferral.
- [ ] 8.3 Reconcile institutional profile, institutional board, DINADECO, and data-portal documentation with canonical authority and retained external compatibility.
- [ ] 8.4 Prove accepted/frozen Target v1 documents are unchanged and archived DB-1 remains closed historical evidence rather than being reopened or rewritten.

## 9. Verification And Exit Gate

- [ ] 9.1 Apply the full shared migration history plus reconciliation migrations to a current-main verification database and prove no migration was rewritten, skipped, or manually resolved.
- [ ] 9.2 Run preflight, checkpoint, authoritative reconciliation, physical cutover, board FK cutover, and idempotent rerun in the documented order on an approved non-production environment.
- [ ] 9.3 Inspect PostgreSQL metadata and data to prove one authoritative `OrganizationProfile` row with `id = 1`, complete attested values, canonical constraints, delete trigger, and no authoritative legacy writer.
- [ ] 9.4 Run focused initializer/reconciliation, profile API, DINADECO, audit, board, and frontend tests plus applicable backend/frontend build validation; record every command and result.
- [ ] 9.5 Compare pre/post row counts and fingerprints for institutional, board, appointment, and audit data and prove no data loss or duplicate audit emission.
- [ ] 9.6 Inspect the final diff to prove no DB-2, Governance* implementation, unrelated financial redesign, distributed `organizationId`, Target v1 change, or tracked institutional dataset was introduced.
- [ ] 9.7 Mark the reconciliation Exit Gate passed only when canonical authority, compatibility, DINADECO, board FK/data, audit continuity, migration history, documentation, and scope evidence all pass.

## 10. Legacy Retirement Eligibility

- [ ] 10.1 Inventory runtime code, generated client usage, SQL objects, reports, frontend contracts, and board FKs to prove zero independent `InstitutionalProfile` readers or writers remain.
- [ ] 10.2 Preserve a verified checkpoint and legacy-only `locality`/address evidence, then obtain explicit approval before any destructive retirement migration.
- [ ] 10.3 Remove legacy table/columns/type/constraints only through reviewed forward migration after the Exit Gate; otherwise retain them as non-authoritative forward-fix evidence.
- [ ] 10.4 Verify retirement leaves one canonical root, existing compatibility routes operational, all board rows intact, historical audit readable, and DB-4 still deferred.
- [ ] 10.5 Archive this OpenSpec change only after retirement eligibility and every required Exit Gate task are complete; do not start DB-2 or DB-4 as part of closure.
