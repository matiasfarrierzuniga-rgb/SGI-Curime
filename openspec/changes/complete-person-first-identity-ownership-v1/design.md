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

## Appendix A — Stage A Evidence / Frozen Contract

### Scope and evidence boundary

Stage A records source inspection only. It changes no runtime behavior, schema, data, API, frontend, test, Phase B WIP/stash, or production configuration. **No database was accessed.** Conflict counts, duplicate counts, and null-link counts are unknown; Stage B preflight owns those measurements and must not be inferred from source code.

Primary schema evidence: `backend/prisma/schema.prisma:48-76` (Person), `109-153` (User), `214-240` (UserRequest), `242-302` (Affiliate/AffiliateRequest), `348-374` (BoardAppointment), `662-695` (Donation), `819-855` (InventoryLoan), `901-951` (VolunteerApplication/VolunteerParticipation), and `996-1072` (venture/manifest models). Source citations below identify observed readers/writers, not an assertion of exhaustive runtime reachability.

### Field-family ownership matrix

| Current model.field(s) | Category | Frozen target owner | Current readers / writers | API exposure | Action | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Person.`firstName`, `firstSurname`, `secondSurname`, `identification`, `identificationType`, `normalizedIdentification`, `birthDate`, `phoneCountryCode`, `phoneNationalNumber`, `address` | CANONICAL_PERSON_DATA | Person | resolver: `identity/runtime-person-resolver.service.ts:81-94`; registration: `modules/users/application/use-cases/register-user.use-case.ts:51-91`; request approval resolves/reads Person | Person-backed user/list-detail and board/venture projections | retain; later write only via canonical Person contract | medium |
| Person.`email` | CANONICAL_PERSON_DATA; independent contact only if retained | Person | admin directory reads/search: `prisma-users.repository.ts:68-84,126-146,420-475`; excluded by resolver `runtime-person-resolver.service.ts:81-94`; registration omits it `register-user.use-case.ts:51-91`; AffiliateRequest creation writes only when Person newly created: `affiliate-requests.service.ts:50-59` | user administration directory/contact/search; not login/resolver | retain as contact-only pending independent-use certification; removal candidate if no productive independent use; no new write authorization from this inventory | high |
| Person.`legacyFullName` | LEGACY_OR_TRANSITIONAL_DUPLICATE | structured Person name | board/user compatibility readers | indirect Person/user projections | migrate readers; retire only after certification | high |
| Person.`gender` (absent) | future CANONICAL_PERSON_DATA if retained | Person | no current model field/read/write | none | later additive field only after separate approval and reconciled Affiliate evidence | high |
| User.`personId` | ACCESS_ACCOUNT_DATA relation | User → Person | user detail/list and approval linkage; schema nullable at `109-153` | user contracts | target required only after later certification; current nullable behavior unchanged | high |
| User.`email`, `passwordHash`, role/status/session/lock lifecycle | ACCESS_ACCOUNT_DATA | User | authentication, activation, reset, notifications, account flows | account API; `PATCH /users/:id` includes email | retain; `User.email` sole login/access email; never sync with Person | critical |
| User.`fullName`, `identification`, `identificationType`, `phone`, `phoneCountryCode`, `phoneNationalNumber`, `address` | LEGACY_OR_TRANSITIONAL_DUPLICATE | Person projection | registration/admin registration; UserRequest approval: `user-requests.service.ts:201-284`; PATCH DTO/use case/repository: `update-user.dto.ts:17-47`, `update-user.use-case.ts:28-67`, `prisma-users.repository.ts:338-355`; reservation reads use User display/email | `GET /users`, user detail, `PATCH /users/:id` | version reads, later route personal writes through Person, then retire only at zero use | high |
| UserRequest.`personId`, `reason`, status/review fields | DOMAIN_SPECIFIC_DATA | UserRequest → Person / request | approval currently rejects null link: `user-requests.service.ts:201-210` | request review/approval | intentionally nullable; later approved lifecycle may resolve it; Stage A changes nothing | high |
| UserRequest.`fullName`, `identification`, `identificationType`, `email`, phone fields, `address` | SUBMITTED_SNAPSHOT | UserRequest; submitted `email` copied to User on approval | public submission/review; approval copies `userRequest.email` to `User.email`: `user-requests.service.ts:255-284` | request endpoints and registration frontend | future direct-copy `submitted*` aliases/fields; no arbitrary full-name parsing | critical |
| Affiliate.`personId`, affiliation type/status/date, `occupation`, `workplace` | DOMAIN_SPECIFIC_DATA | Affiliate → Person; Affiliate owns membership facts | affiliate service and approval creation: `affiliate-requests.service.ts:189-205` | affiliate list/detail/PATCH | retain; later require link only after certification | high |
| Affiliate.`fullName`, `identification`, `identificationType`, `birthDate`, phone fields, `email`, `address` | LEGACY_OR_TRANSITIONAL_DUPLICATE | Person projection | direct PATCH DTO/service: `affiliates/dto/update-affiliate.dto.ts:22-91`, `affiliates/affiliates.service.ts:79-141`; approval copies request: `affiliate-requests.service.ts:152-205` | affiliate GET/list/detail and `PATCH /affiliates/:id`; frontend forms/types | stage projections, canonical writes, then retirement certification | critical |
| Affiliate.`gender` | LEGACY_OR_TRANSITIONAL_DUPLICATE | future Person.`gender` if retained | list/detail/PATCH through Affiliate DTO/service; request creation/review/approval: `affiliate-requests.service.ts:15-37,46-80,124-205` | affiliate and AffiliateRequest contracts | reconcile conflicts with evidence; retain until later approved Person field/cutover | high |
| AffiliateRequest.`personId`, status/review fields | DOMAIN_SPECIFIC_DATA | AffiliateRequest → Person / request | create resolves Person; approval rejects null: `affiliate-requests.service.ts:46-80,124-150` | public/admin request contracts | intentionally nullable; preserve current behavior | high |
| AffiliateRequest.`fullName`, `identification`, `identificationType`, `birthDate`, `gender`, phone fields, `email`, `address`, occupation/workplace/reason | SUBMITTED_SNAPSHOT | AffiliateRequest | selected/reviewed at `affiliate-requests.service.ts:15-37,91-123`; creation `46-80`; approval copies to Affiliate `189-205` | request create/list/detail/review APIs and frontend | future explicit `submitted*` direct-copy plan; snapshots remain evidence | critical |
| Donation.`donorPersonId` | DOMAIN_SPECIFIC_DATA relation | Donation → Person | donation/history flows | donation API/history | retain nullable relation | low |
| Donation.`donorName`, `donorIdentification` | SUBMITTED_SNAPSHOT | Donation | schema `662-695` | donation API/history | retain donation-time evidence; never replace with current Person | critical |
| VolunteerApplication.`personId` | DOMAIN_SPECIFIC_DATA relation | VolunteerApplication → Person | schema `901-929` | application flow | retain nullable | low |
| VolunteerApplication.`submittedFullName`, `submittedIdentificationType`, `submittedIdentification`, `submittedNormalizedIdentification`, `submittedEmail`, `submittedPhone` | SUBMITTED_SNAPSHOT | VolunteerApplication | schema `901-929` | application flow | retain; reference target naming pattern | low |
| VolunteerParticipation.`personId`, `applicationId` | DOMAIN_SPECIFIC_DATA relation | VolunteerParticipation | schema `931-951` | participation flow | retain | low |
| VentureAssociation.`personId` | DOMAIN_SPECIFIC_DATA relation | VentureAssociation | schema `996-1009` | venture flow | retain | low |
| VentureRequest.`reconciledPersonId` | DOMAIN_SPECIFIC_DATA relation | VentureRequest | schema `1011-1028` | venture-request flow | retain nullable | low |
| VentureRequestRevision.`submittedData` | SUBMITTED_SNAPSHOT | VentureRequestRevision | schema `1030-1041` | revision/history | retain opaque submitted evidence | critical |
| IdentityReconciliationManifest identity fields/source snapshot | SUBMITTED_SNAPSHOT | Manifest | schema `1043-1072` | reconciliation evidence | retain pending formal retention decision | high |
| IdentityReconciliationManifest.`selectedPersonId` | DOMAIN_SPECIFIC_DATA relation | Manifest → Person | schema `1043-1072` | reconciliation decision | retain | low |
| BoardAppointment.`personId`; GovernanceMembership legacy person scalar | DOMAIN relation / LEGACY_OR_TRANSITIONAL_DUPLICATE | explicit Person relation / governance | schema `348-374`; board readers | governance API | preserve meaning; later staged FK/semantic cleanup | high |
| InventoryLoan.`borrowerNameSnapshot` | SUBMITTED_SNAPSHOT | InventoryLoan | schema `819-855` | loan history | retain snapshot | critical |
| InventoryLoan.`borrowerAffiliateId` | DOMAIN_SPECIFIC_DATA relation | InventoryLoan → Affiliate | schema `819-855` | loan flow | retain nullable | low |
| Reservation.`requesterUserId`, `approvedById` | ACCESS_ACCOUNT_DATA relation | Reservation → User | reservation flow reads User display/access email | reservation contracts | retain; no Person snapshot conversion | low |

### Contract and consumer catalog

| Surface | Current route / consumer | Current shape or direct mutation | Stage A disposition |
| --- | --- | --- | --- |
| Users backend | `GET /users`, user detail; `PATCH /users/:id` | legacy duplicate fields plus account email; direct PATCH writer cited above | version/projection design deferred to Stage D; legacy writer remains |
| User registration/admin registration | registration use case and admin registration path | creates/uses Person for structured identity but does not write `Person.email` | legacy path remains pending Stage D |
| UserRequest | request routes, approval `user-requests.service.ts:201-284` | generic snapshots; approval writes User duplicates and `User.email`; rejects null `personId` | preserve snapshots; later direct-copy explicit `submitted*` names; no parsing |
| Affiliates backend | list/detail and `PATCH /affiliates/:id` | direct PATCH payload validates/writes legacy personal scalars, including `gender` | legacy writer remains pending Stage D |
| AffiliateRequest | public create/list/detail/review/approval | generic submitted values; create may set `Person.email` only for newly created Person; approval copies into Affiliate | preserve snapshot; legacy divergence pending Stage D, not authorization for new Person-email writes |
| Users frontend | `frontend/src/features/users/{api,model,ui}` | types/API/dialogs consume User contracts | migrate only during Stage D |
| Affiliates frontend | `frontend/src/features/affiliates/{api,model,ui}`; `EditAffiliateModal` | types/API/form submits direct Affiliate PATCH payload | migrate only during Stage D |
| UserRequest frontend | `frontend/src/features/user-requests/{api,model,ui}`; `RegisterPage` | generic request submission/types | migrate only during Stage D |
| AffiliateRequest frontend | `frontend/src/features/affiliate-requests/{api,model,ui}`; detail/map consumers | request snapshots/types | migrate only during Stage D |
| Reservation frontend/downstream | `frontend/src/features/reservations/{model,ui}` detail consumers | User-derived display/access-email legacy reads | catalogued; migration deferred |
| Tests | backend User/Affiliate/request/resolver tests; frontend feature tests | duplicate/snapshot contract coverage identified by prior audit | no tests run; exact suite changes Stage D/E |
| External consumers | none evidenced by inspected reports/sources | N/A | no V1.1 window authorized absent documented consumer |

### Canonical future write and snapshot contract

- **Stage A establishes no production behavioral change.** It freezes future behavior only.
- Approved future canonical path: Person owns migrated personal identity/contact values. User and Affiliate may expose declared compatibility projections but may not independently persist migrated Person values after Stage D cutover.
- `User.email` remains sole access/login email. No User↔Person email synchronization, including registration.
- `Person.email`: no explicit profile workflow currently exists. Current AffiliateRequest creation sets it only on a newly created Person (`affiliate-requests.service.ts:50-59`). This is legacy divergence pending Stage D; it does not authorize new writes.
- Remaining legacy writers pending Stage D: User registration/admin registration; UserRequest approval; `PATCH /users/:id`; AffiliateRequest approval; `PATCH /affiliates/:id`.
- UserRequest and AffiliateRequest generic identity/contact fields are historical submitted snapshots. Future explicit `submitted*` fields/aliases use direct-value copy only. `fullName` remains opaque evidence: no heuristic or arbitrary parsing. UserRequest approval currently rejects null `personId`; a later approved lifecycle may resolve it, but Stage A changes nothing.
- Gender: current evidence includes Affiliate list/detail/PATCH and AffiliateRequest create/review/approval. `Person.gender` does not exist. If retained, it is a future Person field only after separate approval and conflict reconciliation evidence.

### Approval gate, evidence, and rollback ownership

| Gate | Required evidence / owner | Authorization and rollback boundary |
| --- | --- | --- |
| Stage A completion | this frozen matrix/catalog/contract; change owner collects and presents evidence | human review approval before any Stage B work; no production/schema work begins before approval |
| Stages B–E | stage-specific preflight, compatibility, reconciliation, test, rollback, and certification evidence; change owner collects | separate checkpoint approval before next stage |
| Database-mutating validation or destructive rollback | operator-run evidence against authorized/disposable data | human release/database operator authorizes and executes DB-mutating validation and destructive rollback; agents do not self-authorize |
| Production/schema start | approved Stage A and relevant later checkpoint evidence | prohibited before review approval |

Stage B onwards remains separate: it owns data preflight, counts, backup/rollback rehearsal, compatibility design, and the deferred Phase B stash reconciliation checkpoint. No data-state certification is made by Stage A.

## Appendix B — Stage B1 Backend / Consumer Design Evidence

### B1 scope and evidence boundary

This appendix records Stage B1 evidence for tasks 2.1–2.5. It is based on frozen Stage A contract, current backend/frontend sources, and Atlas handoff evidence. No database, Prisma schema, migration, stash, production code, or Stage C+ artifact was accessed or changed by Forge.

### 2.1 Atlas read-only preflight evidence

Atlas verified current development Compose PostgreSQL database `sgi_curime` using role `sgi_user`. Every inspection query used `BEGIN TRANSACTION READ ONLY` followed by `ROLLBACK`; no database state changed. The current Compose development database has a persistent volume and is not disposable test evidence.

Atlas-supplied classification algorithm uses normalized identification plus identification type, preserves null/invalid identity evidence as incomplete, and separates: safely linked User/Affiliate; null-`personId` candidate; duplicate candidate; conflict; and insufficient evidence. It does not infer links, parse names, merge identities, or treat legacy-vs-Person equality as reconciliation proof. This matches frozen Stage A classification gates and the application’s existing normalized identity classifications.

| Preflight measure | Verified result |
| --- | --- |
| `INCOMPLETE` | 1 row; `identificationType` is null |
| safely-linked User | 0 |
| safely-linked Affiliate | 0 |
| null-`personId` candidate | 0 |
| duplicate candidate | 0 |
| conflict | 0 |
| insufficient evidence | 0 |
| `IdentityReconciliationManifest` V1 User/Affiliate entries | 0 |
| linked legacy-vs-Person divergence | 0; not reconciliation proof |

| Raw population measure | Verified result |
| --- | --- |
| User total / linked / unlinked | 1 / 0 / 1 |
| Affiliate total / linked / unlinked | 0 / 0 / 0 |

Stage C remains blocked from treating zero divergence, zero manifest entries, or these raw counts as safe-linking certification.

### 2.2 Conflict quarantine, human review, and deterministic manifest reruns

#### Classify and quarantine

1. Stage B preflight materializes one immutable source snapshot per `User` or `Affiliate` source record before resolution. Snapshot fields are current `IdentitySource` evidence: source model/id, `personId`, identification/type, full name, birth date, email, phone country/national values, and address. Its hash is `sourceFingerprint` from `identity-reconciliation.ts:182-199`; use normalization/manifest/decision versions exported by `identity-link-migration.ts:288-292`.
2. Identity key is only `<identificationType>:<normalizedIdentification>`. Preflight assigns existing classifications: `IDENTITY_MATCH`, `IDENTITY_NOT_FOUND`, `IDENTITY_CONFLICT`, `IDENTITY_INCOMPLETE`, `IDENTITY_DUPLICATE`, or `MANUAL_REVIEW_REQUIRED`. A null key, invalid identification/type, multiple Person candidates, conflicting source values, stale fingerprint, incompatible existing link, missing selected Person, or conflicting manifest selection is not safe.
3. Every non-safe source enters quarantine. Quarantine is logical queue/state, not a new domain state for User, Affiliate, Person, or requests. It retains source snapshot, source fingerprint, normalization/manifest/decision versions, cluster key if available, all conflict codes, candidate Person ids/count, current link, and review disposition. It neither links records nor overwrites Person, User, Affiliate, request, or snapshot values.
4. `IDENTITY_MATCH` and `IDENTITY_NOT_FOUND` may become link candidates only when `personCreationAllowed`, exactly one selected existing/created Person, no review requirement, current fingerprint, and no assignment-cardinality conflict are all true. `IDENTITY_NOT_FOUND` creation remains a future Stage C transactional action, not Stage B behavior.
5. Never infer structured Person names from `fullName`; it remains source evidence. User email remains access data and is never copied to Person email. Conflicting gender evidence remains quarantined pending separately approved Person.gender work.

#### Human-review decision contract

Reviewer receives source snapshot, immutable fingerprint, identity key, manifest/normalization/decision versions, conflict codes, candidates, existing link, and any prior review. Allowed reviewed outcomes are: select exactly one compatible existing Person; approve creation only where complete structured evidence and later Stage C transaction rules permit it; retain unresolved; or reject a proposed link. “Merge”, “overwrite canonical Person”, and “pick first candidate” are not outcomes.

Reviewer submission must include reviewer identity, timestamp, rationale, selected Person id or explicit no-selection, expected source fingerprint, and expected decision/confirmation fingerprint. The server recomputes fingerprints and rejects stale evidence. `manual-legacy-user-reconciliation.ts:134-282` establishes existing useful precedent: single-match requirement, structured-name compatibility, linked-user ownership check, explicit confirmation, and no write when blocked. General Stage B review must extend this safety shape to both User and Affiliate; it must not reuse that user-only procedure as an authorization shortcut.

#### IdentityReconciliationManifest evidence and rerun algorithm

`IdentityReconciliationManifest` remains reconciliation evidence: retain raw source snapshot and `selectedPersonId`; associate each decision with source model/id, source fingerprint, identity cluster key, classification, `personCreationAllowed`, review requirement, conflict codes, normalization version, manifest version, decision version, reviewer disposition/evidence, and decision timestamp. Any extra persistence fields needed for that association are additive Stage C work under Atlas ownership; Stage B does not prescribe a schema mutation.

Deterministic rerun procedure:

1. Read sources in stable `(sourceModel, sourceId)` order; normalize using recorded version; group/sort clusters using current `reconcileIdentitySources` ordering.
2. Recompute source fingerprint from untouched source evidence. Find manifest decision by `(sourceModel, sourceId)`; do not select by display name or email.
3. If zero or multiple decisions exist, selected Person is absent, fingerprint differs, versions differ, review is required, classification is unsafe, link conflicts, or one Person receives multiple same-model assignments, mark/rekeep quarantine. Do not mutate link.
4. If source already links selected Person and fingerprint/version evidence remains current, result is idempotent `ALREADY_CORRECT`; write no duplicate link/Person/decision.
5. Only a safe, current, single decision with null source link produces one planned assignment. Stage C executes its Person resolution/creation and link mutation atomically; unique/race failure rolls back unit and returns quarantine/conflict or documented idempotent result.
6. Re-run after source or decision change creates/retains new evidence keyed by new fingerprint/version; old evidence remains auditable. A review never survives changed source facts merely because source id matches.

`buildIdentityLinkPlan` already encodes key non-write gates: stale manifests, missing selected Person, incompatible existing links, multiple manifest selections, multiple assignments, unclassified cases, and manual-review counts (`identity-link-migration.ts:67-143`). Stage C implementation must preserve these gates; it may not convert `assignments` into direct writes without bounded transaction and rollback evidence.

### 2.3 Additive UserRequest / AffiliateRequest submitted-snapshot transition

#### Additive storage and direct-copy map

Stage C, with Atlas-owned schema work, adds explicit submitted names while retaining legacy generic columns and values. Migration copies each source value byte-for-byte/value-for-value after existing column representation conversion only; it does not derive current Person values, normalize historical text, or parse `fullName`.

| Request | Legacy field | Additive authoritative field | Rule |
| --- | --- | --- | --- |
| UserRequest | `fullName` | `submittedFullName` | direct copy; opaque, never structured-name input |
| UserRequest | `identificationType`, `identification` | `submittedIdentificationType`, `submittedIdentification` | direct copy |
| UserRequest | `email` | `submittedEmail` | direct copy; approval still creates User access email from submitted access evidence, never Person email |
| UserRequest | `phoneCountryCode`, `phoneNationalNumber`, `phone`, `address` | `submittedPhoneCountryCode`, `submittedPhoneNationalNumber`, `submittedPhone`, `submittedAddress` | direct copy; snapshot remains historical |
| UserRequest | `reason` | `submittedReason` | direct copy; request workflow metadata remains separate |
| AffiliateRequest | `fullName` | `submittedFullName` | direct copy; opaque, never structured-name input |
| AffiliateRequest | `identificationType`, `identification` | `submittedIdentificationType`, `submittedIdentification` | direct copy |
| AffiliateRequest | `birthDate`, `gender` | `submittedBirthDate`, `submittedGender` | direct copy; gender is snapshot evidence, not Person.gender authorization |
| AffiliateRequest | `phoneCountryCode`, `phoneNationalNumber`, `phone`, `email`, `address` | `submittedPhoneCountryCode`, `submittedPhoneNationalNumber`, `submittedPhone`, `submittedEmail`, `submittedAddress` | direct copy |
| AffiliateRequest | `occupation`, `workplace`, `affiliationReason` | `submittedOccupation`, `submittedWorkplace`, `submittedAffiliationReason` | direct copy; approved Affiliate owns resulting membership facts where frozen contract says so |

No submitted alias maps to `Person.email`; UserRequest `submittedEmail` is access-email submission evidence and retains current approval semantics until approved Stage D write cutover. `firstName`/surname inputs are structured resolution evidence where current endpoint accepts them; they are not a backfill target for generic `fullName`.

#### API alias/version plan

1. **Additive API version (Stage D):** request create accepts explicit `submitted*` fields; legacy generic input aliases are accepted only when matching submitted value exactly. Supplying both unequal values returns validation conflict. Response/list/detail return canonical `submitted*` fields and legacy aliases with equal values. Approval/rejection route/status/authorization remain unchanged.
2. **Frontend migration (Stage D):** `frontend/src/features/user-requests/{api,model,ui}` and `frontend/src/features/affiliate-requests/{api,model,ui}` submit/read `submitted*`; request detail/table continues rendering submitted evidence, never current Person projection. Existing public routes remain `/user-requests` and `/affiliate-requests`; no V1.1 route is authorized.
3. **Alias retirement (Stage E):** remove generic API aliases only after direct-copy verification, API/frontend consumer migration, zero productive generic reader/writer certification, snapshot-immutability tests, and separately approved destructive work. Database alias removal is independently gated from API alias removal.

The human owner approved the calendar deprecation date for the request `submitted*` compatibility aliases as **2026-11-30**. That date marks formal deprecation of the legacy generic aliases; it does **not** authorize automatic removal. Physical schema/API alias removal remains gated by Stage E certification and requires all of: zero productive legacy readers, zero productive legacy writers, migrated frontend/API consumers, completed reconciliation, no unresolved dependency requiring an alias, passing backend/frontend tests, passing builds, passing required E2E/certification, and separately approved destructive removal. If Stage E certification is not complete by 2026-11-30, the aliases stay available but deprecated until every removal gate is satisfied. No alias is implemented or removed by this decision.

Current consumer evidence: UserRequest generic request select/create/review/approval is `backend/src/user-requests/user-requests.service.ts:19-36,48-97,169-324`; DTO is `dto/create-user-request.dto.ts`; frontend API/type/form are `frontend/src/features/user-requests/{api/userRequests.api.ts,model/userRequests.types.ts,ui/RegisterPage.tsx}`. AffiliateRequest equivalents are `backend/src/affiliate-requests/affiliate-requests.service.ts:15-80,91-258`, `dto/create-affiliate-request.dto.ts`, and `frontend/src/features/affiliate-requests/{api,model,ui}`. These are snapshot readers/writers, not Person-current-data consumers.

### 2.4 Person-backed User/Affiliate projections and legacy-reader disposition

#### Compatibility contract

Database compatibility retains duplicate User/Affiliate columns and nullable Person links until Stage E evidence. API compatibility is separately scoped and temporary: endpoints may source live personal projection fields from linked Person while still returning declared legacy field names/shape during consumer migration. A null link must return documented incomplete outcome or compatibility value; it must never silently invent a Person projection. `User.email` stays only in `access.email` / account response and remains writable as access data. Person contact email, if retained, is distinct `person.contactEmail`; it must not populate `access.email` or a legacy User email alias.

User person-rooted list/detail already proves mapper direction: `PrismaUsersRepository.toAdminPerson` reads Person identity/contact fields and `toAdminUserResponse` exposes Person root plus separate `access.email` (`backend/src/modules/users/infrastructure/prisma-users.repository.ts:68-156`; `presentation/mappers/user-response.mapper.ts:27-63`). Keep this response shape for `GET /users` and `GET /users/:personId`. Account-root mutation responses remain temporary compatibility objects until Stage D routes personal updates through Person write contract.

Affiliate projections must add equivalent explicit mapper/select boundary before cutover: `Affiliate.personId` selects linked Person and maps Person-derived `fullName`, identification/type, birth date, phone country/national values, address, and retained contact email only under its independent-contact policy. Affiliate-only `id`, affiliation type/date/status, occupation, workplace, and legacy role stay Affiliate-owned. `gender` remains Affiliate compatibility data because Person.gender is not approved/present. `GET /affiliates`, `GET /affiliates/:id`, and successful `PATCH /affiliates/:id` may expose this temporary projection only after Stage D implementation; no Stage B endpoint changes it.

#### Productive reader/writer classification

| Surface / source | Observed productive legacy behavior | Disposition |
| --- | --- | --- |
| `POST /register`, `POST /admin/register`; registration use cases/repository | creates User legacy identity/contact duplicates alongside Person resolution | **Must before B2:** preserve behavior; no projection work. **C–E cleanup:** route live personal writes through Person only at Stage D; retain access email on User. |
| `GET /users`, `GET /users/:personId`; `PrismaUsersRepository.toAdminPerson`, `toAdminUserResponse`; users API/types/UI | Person-rooted list/detail already reads projection; account response still contains User duplicate fields | **Temporary projection:** preserve Person-rooted contract, separate `person.contactEmail` and `access.email`; migrate account-root mutation response/frontend expectation at Stage D. **C–E cleanup:** eliminate User duplicate read after zero-reader certification. |
| `PATCH /users/:accessId`; `UpdateUserDto`, `UpdateUserUseCase`, `updateProfile`; Users frontend `UserManagementDialogs` | writes `fullName`, phone, address directly to User; writes access email directly to User | **Must before B2:** keep live semantics, explicitly classify email as access-only. **Temporary projection:** no rewrite in B. **C–E cleanup:** Stage D split Person personal mutation from User email mutation; retire duplicate writer only after certification. |
| `POST/GET/PATCH /user-requests`; UserRequest service/DTO/frontend | generic fields are submitted snapshot create/read; approval creates User duplicate projection and uses request email for User access email | **Must before B2:** preserve immutable snapshot behavior and approval safety. **Temporary projection:** submitted aliases only, never Person-current projection. **C–E cleanup:** additive submitted fields/aliases, then migrate approval live writes at Stage D; retire generic aliases at E. |
| `POST/GET/PATCH /affiliate-requests`; service/DTO/frontend | generic fields are submitted snapshot create/read; create resolves Person; approval copies request values into Affiliate duplicates | **Must before B2:** preserve submitted snapshot and null-link conflict behavior. **Temporary projection:** submitted aliases only. **C–E cleanup:** direct-copy submitted migration; Stage D creates Affiliate with Person-backed live projection/write path; gender waits separately. |
| `GET /affiliates`, `GET /affiliates/:id`; Affiliate service/select; affiliates API/types/table/detail | reads Affiliate duplicate live personal fields, searches/sorts on them | **Must before B2:** no query/storage rewrite. **Temporary projection:** Stage D mapper/select makes response Person-backed while compatibility storage stays. **C–E cleanup:** migrate query/search to Person-derived data and certify no legacy reader before removal. |
| `PATCH /affiliates/:id`; UpdateAffiliateDto/service; EditAffiliateModal | writes Affiliate duplicate identity/contact/birth date/gender plus affiliation fields | **Must before B2:** retain current authorization/validation and identify gender as non-migratable. **Temporary projection:** none in B. **C–E cleanup:** Stage D sends canonical Person fields through Person writer; keep affiliation fields on Affiliate and gender compatibility until separate approval/certification. |
| Affiliate activation/deactivation | reads `Affiliate.personId`/Person→User relation; writes affiliation status, User role/session lifecycle | **Temporary projection:** no personal-field projection needed. **C–E cleanup:** retain ownership; not a duplicate-personal-field removal candidate. |
| Reservation/downstream User display readers cited by frozen Stage A | reads User display/access-email compatibility values | **Must before B2:** consumer contract catalog stays unchanged. **Temporary projection:** use declared User Person projection for display and separate access email. **C–E cleanup:** migrate/verify each downstream reader before User duplicate retirement. |

No actual external consumer is evidenced by Stage A or inspected source; therefore no V1.1 window, version route, or date is authorized. A future external consumer must be named, contract-tested, and given an approved compatibility date before V1.1 exists.

### 2.5 Executed disposable rehearsal evidence

Human database operator executed the rehearsal. The development database was never mutated.

#### Isolation proof

| Item | Development | Disposable |
| --- | --- | --- |
| Container | `sgi-curime-frontend-v1-refinement-postgres-1` | `sgi-stage-b-disposable` |
| Host port | 5432 | 5433 |
| Database | `sgi_curime` | `sgi_org_profile_reconciliation_test` |

Distinct container, database, and host port. The disposable container was created, used, and removed; no `sgi-stage-b` volume remained. `backend/node_modules` was absent, so `npm ci --no-audit --no-fund` was run in `backend` as a network dependency install. `DATABASE_URL`/`DIRECT_URL` pointed only at the disposable database. `npx prisma migrate deploy` reported the database already in sync with the Prisma schema.

#### Rehearsal results

| Rehearsal | Executed evidence |
| --- | --- |
| Backup / recovery | Disposable-only scratch table with 2 rows; `pg_dump --format=custom`; restore into a second disposable database `..._restore`; row count and values matched; restore database and dump file deleted. Assumption proven on disposable data. |
| Transaction failure | Bounded transaction deliberately violated a primary key; PostgreSQL returned the constraint error and ROLLBACK; only the pre-existing baseline row remained, so no partial state persisted. |
| Idempotent rerun | `node scripts/test-migration-smoke.mjs` executed twice against the disposable database; both runs passed with no pending migrations and no duplicate state. |
| Conflict preservation | Disposable-only scratch Person/Org/link tables seeded two candidate persons sharing one email with different document numbers; no link row was created (`links_total = 0`), so ambiguous evidence produced no automatic merge or overwrite. |
| Rollback path | `node scripts/test-migration-rollback.mjs` executed and passed; database consistent after rollback simulation. |
| Cleanup | All scratch tables dropped; disposable container removed. |

Post-rehearsal read-only verification of the development database returned `user_total 1`, `user_linked 0`, `affiliate_total 0`, `IdentityReconciliationManifest` 0 — unchanged from preflight.

Stage B1 rehearsal therefore covers backup/recovery, transaction failure, partial-state prevention, idempotent rerun, conflict preservation, and rollback execution against disposable data, with the development database never mutated.

#### Precise limit of this rehearsal

The rehearsal exercised existing migration harnesses (`test-migration-smoke.mjs`, `test-migration-rollback.mjs`) and disposable scratch objects. It did **not** exercise the Person-first reconciliation resolver, because `db:link-person-identities` is Stage C work and was deliberately not run. Person-first reconciliation idempotency and manifest conflict behavior therefore remain unproven until Stage C task 3.4 and remain a Stage C evidence obligation, not a Stage B1 defect.

#### Reproducibility reference

The sequence below reproduces the executed rehearsal above. It was executed once against a throwaway container; every mutation below targets the disposable database only.

Strict no-use development database guard: never run against development database `sgi_curime`; verify both container/database names are exactly `sgi-stage-b-disposable` / `sgi_org_profile_reconciliation_test`, and reject execution if `DATABASE_URL` or `DIRECT_URL` contains `sgi_curime`.

```powershell
docker run --name sgi-stage-b-disposable `
  -e POSTGRES_USER=sgi_test `
  -e POSTGRES_PASSWORD=replace-with-temporary-secret `
  -e POSTGRES_DB=sgi_org_profile_reconciliation_test `
  -p 5433:5432 -d postgres:17

docker exec sgi-stage-b-disposable pg_isready `
  -U sgi_test -d sgi_org_profile_reconciliation_test

$env:DATABASE_URL='postgresql://sgi_test:replace-with-temporary-secret@localhost:5433/sgi_org_profile_reconciliation_test'
$env:DIRECT_URL=$env:DATABASE_URL

cd backend
npm ci --no-audit --no-fund

# disposable-only backup/recovery roundtrip
psql $env:DATABASE_URL -c "CREATE TABLE _rehearsal_backup_test (id SERIAL PRIMARY KEY, key TEXT UNIQUE, value TEXT); INSERT INTO _rehearsal_backup_test (key,value) VALUES ('k1','v1'),('k2','v2');"
pg_dump $env:DATABASE_URL --format=custom --file=sgi_rehearsal.dump
psql $env:DATABASE_URL -c "CREATE DATABASE sgi_org_profile_reconciliation_test_restore;"
$restoreUrl = $env:DATABASE_URL + '_restore'
pg_restore --dbname=$restoreUrl --no-owner --no-privileges sgi_rehearsal.dump

# disposable-only bounded transaction failure: PK violation must roll back with no partial state
psql $env:DATABASE_URL -c "CREATE TABLE _tx_rehearsal (id SERIAL PRIMARY KEY, code TEXT, status TEXT); INSERT INTO _tx_rehearsal VALUES (1,'OK1','ok');"
psql $env:DATABASE_URL -c "BEGIN; INSERT INTO _tx_rehearsal VALUES (2,'FAIL1','pending'); INSERT INTO _tx_rehearsal VALUES (1,'DUP','bad'); COMMIT;"
psql $env:DATABASE_URL -c "SELECT * FROM _tx_rehearsal ORDER BY id;"

# migration idempotency and rollback harnesses, run twice
npx prisma migrate deploy
node scripts/test-migration-smoke.mjs
node scripts/test-migration-smoke.mjs
node scripts/test-migration-rollback.mjs

# disposable-only cleanup
psql $env:DATABASE_URL -c "DROP TABLE IF EXISTS _tx_rehearsal; DROP TABLE IF EXISTS _rehearsal_backup_test;"
psql $env:DATABASE_URL -c "DROP DATABASE IF EXISTS sgi_org_profile_reconciliation_test_restore;"
Remove-Item -LiteralPath sgi_rehearsal.dump

docker rm -f sgi-stage-b-disposable
```

Task 2.5 is satisfied by the executed rehearsal recorded above. Task 2.3 is satisfied by the additive submitted-snapshot design plus the human-approved alias deprecation date of 2026-11-30 recorded in section 2.3; alias removal stays gated by Stage E certification and separate destructive approval. Task 2.6 is untouched.
