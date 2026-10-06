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
