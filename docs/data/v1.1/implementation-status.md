# SGI-Curime Frozen Target V1.1 Implementation Status

**Canonical bridge: DESIGN → IMPLEMENTATION → DEFERRED CUTOVER**

**Merge checkpoint:** main@71aa989 (PR #102), merged and verified

## Structural Implementation

| Metric | Frozen V1 | Frozen V1.1 | Delta |
| --- | ---: | ---: | ---: |
| Persistent entities | 40 | 49 | +9 |
| Transitional entities | 1 | 1 | 0 |
| Master relationships | 61 | 77 | +16 |

**Persistent-entity delta:** +5 Volunteering +4 Entrepreneurship

**Relationship delta:** +11 Volunteering +5 Entrepreneurship

## Implementation Status by Package

| Package | IMPLEMENTATION_STATUS | Meaning |
| --- | --- | --- |
| V1 package (`docs/data/`) | `NOT_IMPLEMENTED_BY_THIS_PACKAGE` | Frozen historical design authority; preserved as engineering evidence |
| V1.1 package (`docs/data/v1.1/`) | `IMPLEMENTED_BY_MERGE_AT_71aa989` | Structural contract merged and verified at main@71aa989 |

## Verified Evidence

- Schema and migration state at main@71aa989: 49 persistent + 1 transitional entities
- Test harness confirms: 49 persistent + 77 persistent Target relationships
- PR #102 merge: structural contract IMPLEMENTED, not pending design
- All 13 design decisions (TM-D01..TM-D13) are CLOSED or CLOSED_WITH_MIGRATION_GATE
- Business validation: all business gates closed (`BUSINESS_GATES_REMAINING=0`)

## Deferred Cutover Gates (evidence-dependent)

The following gates remain evidence-dependent and are not yet enforced as DB constraints. Structural implementation does **not** imply completed historical reconciliation:

| Gate | Blocks | Evidence Required | Exit Criterion |
| --- | --- | --- | --- |
| `ID-01` | `User.personId NOT NULL UNIQUE`, `Affiliate.personId NOT NULL UNIQUE`; duplicate-data removal | Reconciliation coverage, duplicate-resolution decisions, approved quarantine and rollback plan | Every affected record maps to canonical Person or approved quarantine path; rollback tested |
| `ASM-ATT-01` | Target attendance/justification FKs before verified parent mapping | Convocation, attendance and justification report including `JUSTIFIED` exceptions | Every linked row has verified parents; incomplete rows quarantined outside enforcement |
| `FIN-ORIGIN-01` | Removal of generic `source`/`sourceId` | Origin classification and Payment/Donation/Disbursement correspondence reports | Every movement is valid manual or has exactly one verified supported origin; exceptions quarantined |
| `FIN-DON-01` | `Donation.originalMovementId NOT NULL`; removal of redundant reversal representation | FK validation, reviewed matching and unresolved exception list | Each retained Donation has one verified original movement; reversal chain valid; unresolved rows quarantined |
| `INV-LEDGER-01` | Signed ledger/current-quantity enforcement before opening-balance backfill | Approved opening-balance algorithm, conversion report and non-negative balance validation | Reconstructed balances match available-quantity semantics with no unresolved negative balance |
| `INV-LOAN-01` | Historical loan-movement FKs without evidence | Loan-to-movement evidence report and unresolved nullable-link list | Only evidence-backed links created; unsupported links remain null or quarantined |
| `ASM-DATE-01` | `heldAt` backfill/enforcement that would infer historical occurrence | Fresh Assembly date/status extract and exception report | `date → scheduledAt`; `heldAt` populated only by explicit evidence; exceptions quarantined |
| `RES-STATUS-01` | Destructive removal of `CONFIRMED`/`COMPLETED` | Reader/writer audit, updated tests, persisted-status query result and compatibility-removal review | No readers, writers, tests or persisted rows depend on legacy states; safe enum migration approved |

At the merge checkpoint, `User.personId` and `Affiliate.personId` remain nullable
and unique. Their final `NOT NULL` enforcement remains deferred under `ID-01`.

## Package Distinction

- **V1 package** (`IMPLEMENTATION_STATUS=NOT_IMPLEMENTED_BY_THIS_PACKAGE`): The frozen historical design. It is the authority for inherited decisions and must not be overwritten by V1.1 additive structure.

- **V1.1 package** (`IMPLEMENTATION_STATUS=IMPLEMENTED_BY_MERGE_AT_71aa989`): The merged structural contract at main@71aa989 (PR #102). It provides the implemented boundary, but deferred gates require evidence before enforcement.

- **Current model** (`current-model.md`): Reflects 49 persistent + 1 transitional at main@71aa989. The gap between the V1.1 Target design and the current physical shape is documented in the migration roadmap and gap matrix, not in this frozen baseline.

- **Logical/physical mappings:** `OrganizationProfile` maps to physical
  `InstitutionalProfile`; `GovernanceTerm` maps to physical `BoardTerm`; and
  `GovernanceMembership` maps to physical `BoardAppointment`. These mappings
  preserve compatibility and do not represent duplicate logical roots.

## Do Not Treat Structural Implementation as Completed Historical Reconciliation

- The V1.1 structural contract (49 persistent + 1 transitional + 77 relationships) is merged and verified.
- Evidence-dependent cutover remains deferred per the 8 documented gates.
- Do not treat the merged implementation as implying that all historical v1 → v1.1 gaps are resolved.
- The V1 design remains the historical authority; V1.1 adds additive structure that is now merged.
- Final cutover requires evidence per each gate; until then, the boundary between structural implementation and historical reconciliation is explicit and labeled.

## Canonical Workflow

```text
DESIGN → Frozen V1 (40 persistent + 1 transitional + 61 relationships)
         → Frozen V1.1 (49 persistent + 1 transitional + 77 relationships) [MERGED]
         → refresh AS-IS
         → AS-IS / Target V1.1 Gap Matrix
         → Migration Roadmap V1.1
         → implementation waves
         → validation
         → evidence-dependent cutover per 8 gates
         → historical reconciliation (deferred, evidence-dependent)
```

## Warning

Structural implementation at main@71aa989 does not imply completed historical reconciliation of v1 → v1.1 gaps. The deferred gates (ID-01, ASM-ATT-01, FIN-ORIGIN-01, FIN-DON-01, INV-LEDGER-01, INV-LOAN-01, ASM-DATE-01, RES-STATUS-01) remain evidence-dependent and open. Treating structural implementation as completed reconciliation is a category error.
