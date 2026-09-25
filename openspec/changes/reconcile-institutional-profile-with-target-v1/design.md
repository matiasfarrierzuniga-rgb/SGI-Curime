## Context

See `proposal.md` for motivation and `specs/organization/organization-profile-foundation/spec.md` for the behavioral contract.

The accepted/frozen Target v1 names `OrganizationProfile` as the sole institutional root. DB-1 implemented and locally validated that foundation on a branch diverged from `main`. Meanwhile, shared `main` added:

- migration `20260920120000_add_institutional_profile`, which creates a nullable `InstitutionalProfile` singleton and inserts `id = 1`;
- migration `20260922120000_add_institutional_board`, whose `BoardTerm.institutionalProfileId` references that singleton;
- authenticated profile GET/PATCH behavior, capabilities, and audit events;
- DINADECO report and frontend consumers;
- `BoardTerm`, `BoardAppointment`, and `BoardPosition` administration.

The original DB-1 migration is not part of shared `main`. Applying it unchanged after the shared migrations would create a second table and authority. Conversely, discarding current-main functionality would lose merged behavior. Reconciliation therefore starts from shared `main`, preserves its migration history, and ports the DB-1 invariants through new forward work rather than merging the DB-1 implementation unchanged.

The intended architecture is:

```text
Before
  /institutional-profile ─┐
  DINADECO reports ───────┼──> InstitutionalProfile (authority, id=1)
  BoardTerm FK ───────────┘

Compatibility and reconciliation
  existing HTTP/report shapes ──> compatibility mapper ──> one declared authority
  BoardTerm FK ──────────────────────────────────────────> same authority

After
  /institutional-profile ─┐
  DINADECO reports ───────┼──> OrganizationProfile (sole authority, id=1)
  BoardTerm FK ───────────┘

  InstitutionalProfile storage: retired after gate
  Board* models: retained as transitional governance compatibility for DB-4
```

## Goals / Non-Goals

**Goals:**

- Reach one physical and semantic institutional authority without rewriting shared migrations.
- Preserve verified institutional values and stop on ambiguity or conflict.
- Preserve current profile, DINADECO, board, authorization, and audit behavior through controlled compatibility.
- Move board referential integrity to canonical `OrganizationProfile` without redesigning governance.
- Make every transition phase deployable, observable, abortable, and gated.
- Reconcile Current/AS-IS documentation to the actual post-PR #94 baseline while leaving Target v1 frozen.

**Non-Goals:**

- No DB-2 identity reconciliation.
- No DB-4 implementation or renaming of `BoardTerm`, `BoardAppointment`, or `BoardPosition` to Target governance entities.
- No redesign of DINADECO financial calculations or report format.
- No new organization/multi-tenancy model and no distributed `organizationId`.
- No rewrite or deletion of shared migrations.
- No rewriting historical audit events.
- No permanent dual-table, dual-write, or synchronization architecture.

## Decisions

### 1. Reconcile from shared main through a phased physical cutover

The implementation SHALL be authored against current `main`. The shared `InstitutionalProfile` and board migrations remain immutable. The branch-only DB-1 migration SHALL NOT be merged and deployed unchanged; its constraints, initializer safety, and tests are design evidence to port into new forward migration and verification work.

For the normal shared-main state, physical cutover prefers an in-place evolution of the existing singleton rather than creating a parallel root:

1. Add canonical shadow fields or equivalent transitional representation while `InstitutionalProfile` remains the sole authority.
2. Reconcile complete authoritative values into that same row.
3. Switch application mappings and rename the physical root to `OrganizationProfile` in a controlled cutover.
4. Repoint/verify board referential integrity and enforce canonical constraints.
5. Remove legacy-only storage only after all compatibility and exit checks pass.

PostgreSQL table rename preserves row identity and can preserve FK object references, but the migration SHALL explicitly inspect and normalize FK/constraint names and targets rather than relying on that side effect without evidence.

Alternative rejected: create a new `OrganizationProfile`, copy data, and keep both active. It expands conflict surface and creates a dual-authority window. A separate canonical table is permitted only as a short-lived recovery path for an environment where it already exists; it is not the normal shared-main migration design.

### 2. Supported preflight states are explicit

Preflight classifies each target before mutation:

| State | Legacy table | Canonical table | Rule |
| --- | --- | --- | --- |
| MAIN_LEGACY_ONLY | present | absent | Normal in-place reconciliation path. |
| CANONICAL_ONLY | absent | present | Verify migration provenance and canonical row; preserve only after re-attestation. |
| BOTH_EQUIVALENT | present | present | Stop normal automation; reviewed cutover may retain the attested canonical row only after proving legacy is blank/equivalent and board FKs are preserved. |
| BOTH_CONFLICTING | present | present | Block; no overwrite, merge, or deletion. |
| NEITHER | absent | absent | Block; this is not an approved baseline. |
| HISTORY_MISMATCH | any | any | Block before mutation and produce recovery evidence. |

The previously initialized local DB-1 database is `CANONICAL_ONLY` evidence, not shared migration authority. It must be backed up and re-attested before use on a reconciled branch; its values SHALL NOT be copied into source control or used to rewrite migration records.

### 3. Single authority is a phase invariant

| Phase | Authority | Read rule | Write rule |
| --- | --- | --- | --- |
| A-B | `InstitutionalProfile` row `id=1` | Existing consumers read legacy model/compatibility projection. | Existing service is sole writer; canonical shadow fields are controlled only by reconciliation. |
| C | `InstitutionalProfile` row with verified canonical values | Compatibility projection reads verified canonical values. | Normal writes are paused or constrained; controlled reconciler is sole authority for transition fields. |
| D onward | `OrganizationProfile` row `id=1` | All internal reads use canonical model; legacy response names are projections. | Canonical service is sole writer. |

No trigger, service, or job may independently write two roots. If an already-divergent environment contains two tables, all mutations stop until one row is selected through the reviewed preflight rules.

### 4. D1 - `dinadecoRegion` maps to `region` only with attestation

`dinadecoRegion` and Target `region` refer to the competent institutional/DINADECO region, so they are a mapping candidate, not an unconditional rename. Reconciliation accepts the current value only when it is nonblank, within the Target bound, and exactly confirmed by the authoritative dataset. Otherwise controlled configuration supplies canonical `region` and any mismatch blocks cutover.

Alternative rejected: unconditional SQL copy. Existing nullability and free-form capture do not prove semantic or authoritative equivalence.

### 5. D2 - `physicalAddress` requires authoritative input

`correspondenceAddress` is not automatically equivalent to `physicalAddress`. Canonical `physicalAddress` SHALL come from re-attested controlled configuration or an explicit authority statement that the current correspondence value is also the official physical address. `locality` is never concatenated automatically.

During API compatibility, the old `correspondenceAddress` key projects the authoritative canonical address only after that compatibility meaning is documented. A deployment that requires a distinct correspondence address cannot retire legacy compatibility under this change until a separate approved contract exists.

Alternative rejected: concatenate locality, district, and correspondence text. That invents an address representation and can silently alter legal data.

### 6. D3 - Organization type uses an explicit semantic mapping

Current enum values map to canonical text as follows, subject to authoritative confirmation:

| Current enum | Canonical text |
| --- | --- |
| `INTEGRAL` | `Asociación de Desarrollo Integral` |
| `SPECIFIC` | `Asociación de Desarrollo Específica` |

The Target remains bounded free text, not the current enum. Null, unknown, or conflicting values require controlled configuration. The compatibility response maps the canonical approved text back to the existing enum only when it matches one of these two meanings; otherwise compatibility cutover blocks rather than emitting a false enum.

Alternative rejected: change Target to the enum. That would redesign frozen vocabulary around a current implementation detail.

### 7. D4 - `locality` is preserved as legacy evidence, not mapped

Target v1 has no `locality`. Reconciliation SHALL snapshot its pre-cutover value in backup/evidence and keep it readable only during the bounded compatibility phase. It does not populate `district` or `physicalAddress` automatically. Existing nullable API responses may return the preserved value during compatibility and `null` after retirement; retirement requires evidence that no active consumer depends on it.

This is explicit retirement, not silent data loss. DB-4 does not own this field and is unaffected.

### 8. D5 - Contact mappings are direct after validation

The mappings are:

- `phone` -> `notificationPhone`
- `telefax` -> `notificationFax`
- `email` -> `notificationEmail`

Each value is trimmed, bounded by the canonical physical contract, compared to authoritative configuration, and rejected on conflict. Fax may remain null. Existing response/request keys remain compatibility aliases; writes translate to one canonical field and never dual-write independent storage.

### 9. D6 - Requiredness is enforced after complete reconciliation

Current nullable values cannot be tightened safely in the preparation phase. The sequence is:

1. Inventory both table state and every institutional field.
2. Validate direct candidates without mutating them.
3. Obtain controlled authoritative values for every missing, ambiguous, or conflicting required field.
4. Create a checkpoint and record hashes/field-presence evidence without logging full payloads.
5. Reconcile one complete row atomically through create-or-verify/no-overwrite semantics.
6. Verify all required fields and compatibility projections.
7. Enforce bounded types, nonblank checks, fixed `id = 1`, non-null canonical fields, and delete protection.

Enforcement does not occur if step 3 or any comparison fails. No placeholder, default institutional text, frontend fallback, or migration-time fabricated value is allowed.

### 10. D7 - Preserve external routes with a bounded compatibility adapter

`GET/PATCH /institutional-profile`, `adm.institutional-profile.read`, and `adm.institutional-profile.update` remain stable during this change. The service becomes an adapter over canonical persistence:

| Existing field | Canonical source |
| --- | --- |
| `legalName` | `legalName` |
| `legalIdentification` | `legalIdentification` |
| `dinadecoRegistrationCode` | `dinadecoRegistrationCode` |
| `dinadecoRegion` | `region` |
| `organizationType` | reviewed text/enum compatibility mapping |
| `province`, `canton`, `district` | same canonical fields |
| `correspondenceAddress` | attested `physicalAddress` compatibility projection |
| `phone` | `notificationPhone` |
| `telefax` | `notificationFax` |
| `email` | `notificationEmail` |
| `locality` | preserved transitional value, then nullable `null` after retirement |

PATCH no longer permits clearing canonical required fields. UI validation and error handling must reflect this tightened invariant. DINADECO keeps its established `data.institutionalProfile` shape while sourcing values from the canonical model. Internal canonical endpoints or renames are follow-up work, not required for this cutover.

Alternative rejected: immediately rename routes and frontend types. That expands scope and breaks merged clients without helping physical convergence.

### 11. D8 - Repoint the existing board FK without DB-4 redesign

`BoardTerm`, `BoardAppointment`, and `BoardPosition` remain unchanged in domain behavior. `BoardTerm.institutionalProfileId` remains a transitional column name during this reconciliation, continues to contain `1`, and is repointed to the canonical table in the physical-cutover transaction. All term and appointment row counts and identifying fields are compared before and after.

After cutover, the Prisma relation may use a canonical relation name mapped to the transitional column. Renaming/replacing `BoardTerm`, changing `Person` to `Affiliate`, adding governance status, or creating a position catalog belongs to DB-4.

Alternative rejected: implement Target governance now. It would combine separate migration waves and introduce unresolved person/affiliate/history decisions.

### 12. D9 - Preserve historical audit and canonicalize future events

Existing rows with action `INSTITUTIONAL_PROFILE_UPDATED` and entity type `InstitutionalProfile` remain untouched. After cutover, profile mutations emit one `ORGANIZATION_PROFILE_UPDATED` event with entity type `OrganizationProfile`, entity id `1`, actor/context, and sanitized changed-field names using canonical names.

Audit readers and filters that expose institutional history are updated to treat both action/entity generations as the same historical stream. No mutation emits both events, and no existing event is rewritten.

Alternative rejected: continue legacy naming forever. It obscures the canonical aggregate and makes retirement unverifiable.

### 13. D10 - Existing rows use compare, attest, and preserve semantics

Reconciliation follows this precedence:

1. If a complete canonical row exists, verify it against the approved authoritative dataset. Preserve it exactly if it matches; never overwrite it from a legacy row.
2. Compare every mapped non-null legacy value. Any disagreement blocks reconciliation and reports field names only.
3. If no canonical row exists, treat legacy values only as candidates. Controlled authoritative configuration confirms or supplies every canonical value before in-place cutover.
4. If both rows exist and agree, the canonical row may win only through an explicit reviewed cutover that preserves board references and snapshots legacy-only `locality` evidence.
5. Rerun the controlled operation with the same configuration and prove no value or protected timestamp changes.

The locally initialized DB-1 row may satisfy step 1 after re-attestation and checkpoint. Local initialization evidence does not authorize production data or migration-history changes.

### 14. Documentation is reconciled as Current versus Target

Apply updates Current/AS-IS inventories and gap matrices to the actual post-PR #94 baseline before describing reconciliation progress. It preserves the accepted Target v1 package, records `InstitutionalProfile` and Board* as current/transitional structures, and records canonical cutover evidence after implementation. Archived DB-1 remains historical and is not reopened or rewritten.

### 15. Legacy retirement is a separate destructive gate

Legacy columns/table/type/constraint removal is not coupled to initial compatibility deployment. Retirement requires:

- canonical constraints and delete protection verified;
- all application reads/writes and board FKs verified against `OrganizationProfile`;
- DINADECO/profile/board behavior verified;
- no legacy writes observed;
- legacy-only data snapshot retained;
- checkpoint and reviewed recovery plan available;
- Current documentation updated;
- explicit confirmation that DB-4 remains deferred.

If any condition fails, legacy storage remains non-authoritative but retained for forward-fix. It must not be reactivated as a writer.

## Risks / Trade-offs

- [Current nullable row lacks canonical required data] -> Block cutover until controlled authoritative configuration supplies and attests every required field.
- [Address or region values appear similar but differ semantically] -> Require exact field-level attestation; never infer or concatenate.
- [Compatibility PATCH historically accepts null] -> Tighten only at canonical cutover, update UI/error tests, and preserve row on rejection.
- [Temporary legacy fields outlive cutover] -> Mark them non-authoritative, instrument/read-audit them, and require a dated retirement gate.
- [Board FK transition damages historical rows] -> Use transactional FK cutover, before/after row fingerprints, and rollback checkpoint.
- [Existing canonical-only local database has divergent migration history] -> Classify before mutation; re-attest and preserve data through reviewed recovery rather than editing migration records.
- [Audit clients filter only legacy action] -> Add read compatibility for both generations before emitting canonical-only future events.
- [In-place table rename causes deployment ordering issues] -> Separate compatibility-ready application deployment from physical cutover and require maintenance/readiness gates.
- [Documentation foundation is stale against main] -> Reconcile AS-IS statements during Apply while leaving Target documents unchanged.
- [Scope drifts into governance redesign] -> Treat Board* as transitional and prohibit Governance* implementation in this change.

## Migration Plan

### Phase A - Preconditions and checkpoint

1. Integrate/reconcile documentation and implementation planning against current `main`; do not merge DB-1 implementation unchanged.
2. Inventory migration records, table presence, singleton rows, constraints, board counts/FKs, consumers, audit actions, and environment purpose.
3. Classify the database into one supported preflight state.
4. Create and verify a restorable checkpoint before any mutation.
5. Abort on migration-history mismatch, multiple rows, unknown authority, or conflicting institutional values.

### Phase B - Compatibility preparation

1. Introduce canonical field representation on the existing authority without creating a second writable root.
2. Add compatibility mappers and tests for profile, DINADECO, and frontend contracts.
3. Make write routing explicit and prevent independent writes to transitional canonical fields.
4. Add audit-reader compatibility for legacy and future canonical event names.

### Phase C - Authoritative data reconciliation

1. Load approved values only through controlled process configuration.
2. Compare direct and transformed candidate fields according to D1-D6.
3. Snapshot legacy-only `locality` and any correspondence evidence.
4. Populate/verify one complete canonical value set atomically.
5. Rerun and prove idempotency, no overwrite, and stable protected timestamps.

### Phase D - Consumer compatibility and cutover

1. Route profile service/controller through canonical field semantics while retaining existing HTTP names.
2. Route DINADECO reads through canonical persistence while retaining its external response shape and transaction consistency.
3. Update frontend validation so canonical required fields cannot be cleared.
4. Verify capability behavior remains unchanged.

### Phase E - Physical root and board FK cutover

1. Rename or select the verified canonical physical root according to the approved preflight state.
2. Repoint and verify `BoardTerm.institutionalProfileId` against canonical `OrganizationProfile` in a controlled transaction.
3. Verify every board term/appointment fingerprint and board API behavior.
4. Switch Prisma canonical ownership without introducing Governance* entities.

### Phase F - Canonical enforcement and verification

1. Enforce fixed identity, requiredness, bounds, nonblank checks, nullable fax, and delete protection.
2. Emit canonical future audit events and verify combined history reads.
3. Prove one row, one authority, no dual writes, preserved DINADECO/profile/frontend/board behavior, and preserved migration history.
4. Reconcile Current/AS-IS documentation and record Target v1 unchanged.

### Phase G - Legacy retirement

1. Observe and prove zero legacy readers/writers/FKs.
2. Obtain explicit retirement approval after the exit gate passes.
3. Remove legacy table/columns/type only through a later reviewed forward migration in this change or a narrowly scoped follow-up if deployment timing requires separation.
4. Preserve checkpoint and field-mapping evidence; never delete or rewrite historical audit records.

## Rollback And Abort Strategy

- Before cutover: abort with no data mutation; restore application version if compatibility preparation fails.
- During controlled reconciliation: transaction rollback on any missing/conflicting field; never partially write canonical values.
- During physical/FK cutover: execute under a checkpoint and transactional DDL where supported; rollback the transaction on verification failure.
- After canonical writes begin: do not reactivate independent legacy writes. Forward-fix canonical code/schema or restore the full checkpoint under reviewed incident procedure.
- After legacy retirement: rollback requires full checkpoint restoration or a new forward migration; no ad hoc table recreation or migration-history editing.

## Verification Gates

The reconciliation Exit Gate requires all of the following:

- one authoritative `OrganizationProfile` row with `id = 1`;
- every required canonical field non-null, nonblank, bounded, and equal to attested values;
- fax null or valid nonblank;
- canonical singleton and delete protections present;
- no authoritative `InstitutionalProfile` writer or independent read source;
- profile API and frontend compatibility verified;
- DINADECO institutional output and transaction behavior preserved;
- all BoardTerm/BoardAppointment rows and FK integrity preserved;
- capabilities unchanged unless separately approved;
- historical legacy audit and future canonical audit both understandable, with no duplicate events;
- shared migration records unchanged and new migrations applied forward-only;
- Current/AS-IS documentation reconciled and Target v1 byte-for-byte unchanged;
- DB-1 archive retained as completed history;
- DB-2 not started and DB-4 explicitly deferred.

Failure of any item keeps reconciliation open and blocks legacy retirement.
