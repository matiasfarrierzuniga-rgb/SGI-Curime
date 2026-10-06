## Context

See `proposal.md` and `specs/identity/person-first-ownership/spec.md` for normative behavior.

Audit evidence records a partial Person-first foundation: Person owns structured identity and personal contact fields; User and Affiliate retain duplicate live personal fields and independently mutate them; requests are substantially submitted snapshots; and historical records contain valid snapshot evidence. `User.email` is the authoritative unique login/access address. Retained nullable, non-unique `Person.email` has audit-proven independent directory/contact/search semantics, but may become a removal candidate if no productive independent contact use case is certified. No duplicate field is currently proven safe to remove.

`reconcile-institutional-access-contract-v1` completed Phase A and has Phase B WIP/stash. That WIP preserves safe request-first behavior but is not canonical design. It remains temporarily blocked after Phase A/during B; do not modify, commit, extend, or treat it as authoritative until the checkpoint below is complete, then reapply/reconcile it against the approved ownership contract.

## Goals / Non-Goals

**Goals:**

- Make Person canonical for approved personal identity/contact facts without merging account-access semantics into Person.
- Preserve submitted and historical evidence as snapshots, not alternate current identity sources.
- Move reads before writes, writes before constraints/removals, and require measurable certification at every checkpoint.
- Make data migration deterministic, transaction-safe, reversible where data is not destructively removed, and reviewable where identity evidence conflicts.

**Non-Goals:**

- No production, Prisma, migration, or Phase B WIP changes in this planning change.
- No arbitrary splitting/parsing of generic `fullName` into Person structured-name fields.
- No synchronization between `User.email` and `Person.email` in either direction, including registration. Only an explicit personal-contact/profile workflow may write retained `Person.email`.
- No removal of retained `Person.email` without evidence that no productive independent personal-contact use case exists.
- No deletion of snapshots, silent merge of duplicate identities, or automatic conversion of nullable Person links to required links.

## Decisions

### 1. Ownership model and matrix

Categories: `CANONICAL_PERSON_DATA`, `ACCESS_ACCOUNT_DATA`, `DOMAIN_SPECIFIC_DATA`, `SUBMITTED_SNAPSHOT`, and `LEGACY_OR_TRANSITIONAL_DUPLICATE`. “Current readers/writers” is audit-established exposure, not a claim that all implementation locations were enumerated.

| Record / fields | Category → target owner | Current readers / writers / API exposure | Action | Risk |
| --- | --- | --- | --- | --- |
| Person `firstName`, `firstSurname`, `secondSurname`, `identification`, `identificationType`, `normalizedIdentification`, `birthDate`, phone parts, `address` | canonical → Person | Person-rooted user, board, venture reads; resolver/registration/request approval create or resolve | retain; evidence-backed profile completion only | low/medium |
| Person `email` | canonical → Person, independent personal-contact semantics if retained | directory/contact display/search; AffiliateRequest creation only when creating Person; no auth/resolver use | never sync with User; registration does not copy; write only through explicit personal-contact/profile flow; removal candidate only if independent productive use is disproven | high |
| Person `legacyFullName` | legacy duplicate → structured Person name | board/user readers; compatibility/reconciliation fallback | migrate readers; remove only after certification | high |
| User `personId` | access-account relation → User→Person | user listing/detail and approval linkage; admin seed includes null link | retain nullable until reconciliation proof; later constraint gate | high |
| User `email`, password/status/role/session/lock lifecycle | access account → User | auth lookup, activation, reset, notifications, account APIs | retain; never default-sync from Person | critical |
| User `fullName`, identification/type, phone variants, address | legacy duplicate → Person projection | User-rooted legacy reads, reservation `User.fullName`/`User.email`; `PATCH /users/:id` writes fields | version reads/API, route writes through Person, retire only at zero use | high/medium |
| UserRequest `personId`, reason/status/review metadata | domain → request→Person / UserRequest | request review/approval | retain nullable link and workflow evidence | low |
| UserRequest generic identity/contact fields (`fullName`, identity/type, email, phone parts, address) | submitted snapshot → UserRequest, then User.email on approval | public request submission, review/API; approval uses submitted access email for User | rename to explicit `submitted*` API/schema field names compatibly; retain source values; never arbitrary parse `fullName` | critical |
| Affiliate `personId`, type/status/occupation/workplace/dates/history | domain → Affiliate→Person / Affiliate | affiliate reads/approval | retain; link constraint only after reconciliation | high/low |
| Affiliate `fullName`, identity/type, birthDate, phone variants, email, address | legacy duplicate → Person projection | Affiliate GET/PATCH and frontend forms/types; approval copy path | stage read projection, canonical write, then removal | high/critical |
| Person `gender` (future addition if gender is retained) | canonical → Person | future Person projection/read-write contract | add only in later approved schema work; reconcile from Affiliate evidence before cutover | high |
| Affiliate `gender` | legacy/transitional duplicate → Person.gender if gender is retained | Affiliate contract readers/writers | inventory all readers/writers; backfill/reconcile safely; migrate reads/writes; remove only after certification and conflict evidence | high |
| AffiliateRequest `personId`, status/review metadata | domain → request→Person / AffiliateRequest | public/admin request flow | retain nullable link/workflow evidence | low |
| AffiliateRequest generic identity/contact fields including gender | submitted snapshot → AffiliateRequest | public submission/review/API; approval copies into Affiliate | explicit `submitted*` compatibility transition; retain unchanged snapshots | low/critical |
| Donation `donorPersonId`; `donorName`, `donorIdentification` | relation / submitted snapshot → Donation | donation API/history | retain; never replace donation-time evidence with current Person | critical |
| VolunteerApplication `personId`; `submitted*` fields | relation / submitted snapshot → application | application flow/history | retain; explicit model is target snapshot pattern | low |
| VolunteerParticipation `personId`, `applicationId`; VentureAssociation `personId`; VentureRequest `reconciledPersonId` | domain relation → respective model | participation/venture flows | retain nullable where currently nullable | low |
| VentureRequestRevision `submittedData`; IdentityReconciliationManifest raw identity/source snapshot | submitted snapshot → respective record | revision/reconciliation evidence | retain per retention decision; do not normalize away evidence | critical/high |
| IdentityReconciliationManifest `selectedPersonId` | domain relation → manifest→Person | reconciliation decision | retain | low |
| GovernanceMembership `legacyPersonId`; affiliate/position/history | legacy relation / domain → explicit Person relation and governance membership | board appointments; scalar maps to `BoardAppointment.personId` without Prisma relation | staged FK/semantic rename; preserve dual-link meaning | high |
| Reservation `requesterUserId`, `approvedById` | access-account relation → User | reservation flow | retain; no person snapshot conversion | low |
| InventoryLoan `borrowerNameSnapshot`, `borrowerAffiliateId` | submitted snapshot / domain relation → loan | loan history | retain snapshot and nullable affiliation link | critical/low |

### 2. Canonical writes, reads, and snapshot policy

Approved current-person identity/contact mutation MUST enter through one Person write contract. User and Affiliate contracts may expose compatibility projections during transition but MUST NOT independently persist migrated Person fields. Canonical reads switch to Person-backed projections before duplicate storage is removed; `User.email` stays User-owned. `User.email` is the only authoritative login/access email; `Person.email`, if retained, is independent personal/contact data. Neither value auto-syncs to the other, registration does not copy either value, and only an explicit personal-contact/profile workflow may write `Person.email`.

Request and history records preserve submitted/time-specific values. Generic request names migrate to explicit submitted names through additive schema/API compatibility: expose both old and new fields for one announced transition, write authoritative submitted fields, backfill by direct value copy, migrate consumers, then remove generic aliases only after certification. Generic `fullName` remains opaque submitted evidence; it MUST NOT be arbitrarily parsed into first/surname fields. Structured Person updates require existing structured evidence or a deliberate review/correction path.

### 3. Reconciliation, identity safety, and transactions

Normalized identity is reconciliation key with identification type. Preflight classifies records as safely linked, null `personId`, duplicate candidate, conflicting data, incomplete data, or no trustworthy identity evidence. Ambiguous matches, duplicated normalized identities, and conflicting personal values enter an exception/quarantine workflow with source snapshot and decision evidence; no automatic merge or overwrite occurs.

Each unit that resolves/creates Person plus linked User/Affiliate/request state MUST use a transaction with uniqueness/conflict handling and idempotent rerun behavior. Gender conflicts between Affiliate evidence and a future Person target require reconciliation evidence; they MUST NOT be silently overwritten. Read migration MUST tolerate null links through documented compatibility projections or explicit incomplete-state outcomes until that population is reconciled. `UserRequest.personId` and `AffiliateRequest.personId` intentionally remain nullable pending reconciliation; approval/final domain creation resolves Person.

### 4. API and frontend transition

Version contracts per resource before cutover: current fields, canonical projection, legacy alias, write owner, deprecation date, consumer, and test. APIs return declared Person-derived projections for migrated personal values and separately expose account email. Database compatibility and API compatibility are separate staged decisions; API compatibility exists only inside this staged change, not automatically as another release. A temporary API shape MAY project migrated values from Person. A V1.1 window is permitted only for an actual documented external consumer. Frontend types/forms migrate alongside API clients; no client derives current person data from submitted snapshots.

### 5. Stage gates A–E

| Stage | Deliverable / exit checkpoint |
| --- | --- |
| A — Contract and decision gates | Record frozen email/gender/link/compatibility decisions in inventory/matrix, complete API consumer catalog and retention policy, and approve canonical write contract. |
| B — Preflight and compatibility | Normalized-ID inventory; null-link/duplicate/conflict reports; backup and rollback rehearsals; additive snapshot names and compatible read projections. At completion, reconcile/reapply preserved access-contract Phase B WIP against this contract. |
| C — Reconciliation and schema | Transactional evidence-backed link/profile reconciliation; exception queue; future `Person.gender` addition only if gender is retained and separately approved; additive links/FKs/indices only after preflight evidence; no destructive removals. |
| D — Read/write/API/frontend cutover | Migrate consumers to Person projections; move User/Affiliate writes to Person contract; complete API versions and compatibility deprecation; prove snapshots remain immutable evidence. |
| E — Certification and retirement | Certify zero productive legacy reads/writes, Person-derived mapping, no frontend legacy semantics, data integrity, transaction conflicts, reconciliation independence, rollback, focused backend/frontend tests, build, and E2E; remove aliases/duplicates only in separately approved destructive migration. Make final `User.personId`/`Affiliate.personId` required only after certified 100% safe linking, zero nulls/conflicts, normalized uniqueness, preflight, and rollback evidence. |

### 6. Rollback

Before destructive removal, rollback restores application/API routing to compatibility projections and retains additive data, snapshots, manifest evidence, and backup references. Migrations require tested rollback or forward-repair instructions. A partially executed reconciliation reruns idempotently or restores its bounded transaction; quarantined records remain unresolved rather than guessed.

## Risks / Trade-offs

- [Retained Person.email lacks productive use] → certify directory/contact/search use and explicit write workflow; otherwise nominate it as a removal candidate. No auto-sync or registration copy is permitted.
- [Affiliate gender conflicts with future Person.gender] → preserve reconciliation evidence, quarantine conflicts, and migrate/removal only after certified readers/writers and mappings.
- [Duplicate or malformed identities select wrong person] → normalized-ID preflight, transaction uniqueness, exception quarantine, human review.
- [Null `personId` records fail after a constraint] → retain nullable links and certify full classified population before enforcement.
- [API cutover breaks consumers] → separate DB/API compatibility; temporary Person projections only inside staged change; V1.1 only for documented external consumer; contract tests and staged deprecation.
- [Snapshot cleanup rewrites history] → direct-copy renaming only; no arbitrary name parsing; retain submitted/historical evidence.
- [Phase B WIP drifts from final contract] → preserve untouched, then reapply/reconcile at Stage B checkpoint with focused tests.

## Migration Plan

Apply Stages A–E in order. Each stage requires recorded preflight/result evidence, focused tests, and explicit checkpoint approval before next stage. Frozen decisions admit no fallback semantics. Destructive duplicate removal and non-null enforcement are outside this change’s implementation authorization until Stage E certification and separate approval.

## Operational Gates

- Certify productive independent `Person.email` use before retaining it permanently; otherwise propose removal separately. Its write path remains explicit personal-contact/profile only.
- Certify every Affiliate-gender reader/writer, Person-derived mapping, and reconciliation result before retiring the legacy duplicate. A future `Person.gender` schema addition requires later approval.
- Document actual external consumers before declaring any V1.1 API compatibility window.
- Certify 100% safe linking, zero nulls/conflicts, normalized uniqueness, preflight, and rollback evidence before proposing required final `User.personId` or `Affiliate.personId`.
