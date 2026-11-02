# Tasks

> **APPLY GATES:** Explicit Apply authorization is required for every implementation task. The minimum capture/snapshot increment (M) does not require A.1–A.4 or A.6 because it creates no eligibility decision, catalog validation, agreement record, or terminal-route change. Territorial eligibility and decision integration (A–E) remain blocked until A.1–A.6 close. Structural OpenSpec validation does not satisfy either gate.

## M. Minimum technical increment — declared residence capture and snapshot

> **Scope boundary:** additive, nullable declaration capture only. It preserves submitted code strings, community/locality, and descriptive address. It does **not** select API INEC/IGN, cache, or catalog; label codes as official; validate hierarchy; evaluate coverage; create review evidence; alter approval/rejection; model a Junta agreement; import/analyze the padrón; or change RBAC.

- [x] M.1 Freeze compatible DTO/response contract for optional declared province/canton/district code strings and community/locality, preserving existing descriptive address and `submittedAddress`; verify examples distinguish `declared` from `officially validated` and retain old-client compatibility.
- [x] M.2 Define additive nullable `AffiliateRequest` snapshot fields for declared code strings and community/locality only; verify schema review excludes catalog source/version/integrity claims, relational geographic tables, review entities, agreement links, inferred backfill, `Person`, `OrganizationProfile`, `UserRequest`, and RBAC changes.
- [x] M.3 Implement server-side capture and immutable snapshot mapping for the declared values without geography lookup, hierarchy assertion, or eligibility result; verify valid optional payload, absent fields, malformed field lengths/types, over-posting, and later `Person.address` change cases.
- [x] M.4 Add nullable list/detail response projections with explicit unverified declaration status; verify historical rows remain readable and no client interprets a value as coverage, residency proof, or eligibility.
- [x] M.5 Extend public capture and protected detail display with neutral explanation that fields are declarations and do not decide affiliation; verify validation, keyboard, focus, mobile layout, loading/error states, and no promise of geographic verification.
- [x] M.6 Add focused backend/frontend/privacy compatibility tests; verify snapshots are immutable, notifications/audit do not duplicate detailed residence, no terminal route behavior changes, and existing authorization remains unchanged.
- [ ] M.7 With explicit disposable-database authorization, certify additive migration and rollback behavior for null historical rows; otherwise record `NOT_EXECUTED`. Retain captured snapshots on rollback; never backfill from historical addresses.

## A. Contracts and residence model

- [ ] A.1 **PARTIAL — functional scope confirmed; statutory evidence pending:** Curime locality → Nicoya district → Nicoya canton → Guanacaste province is owner-confirmed for policy design. Obtain statute/article/resolution, issuing authority, effective date, and custody reference; verify it corroborates Curime locality and rejects district-, canton-, province-, or Nicoya-wide inference not present in the source.
- [ ] A.2 **BLOCKED — legal lifecycle:** confirm resolution period, effects of no response, notification duties, and appeal/reconsideration rules; verify approved minutes/legal guidance identify each rule or explicitly retain no-automation behavior.
- [ ] A.3 **BLOCKED — institutional decision contract:** confirm the minimum structured Junta Directiva agreement reference and whether act/session number, agreement number, date, and source relation are mandatory; verify one fictitious approval and one fictitious denial can be identified without free-text-only inference.
- [ ] A.4 **PARTIAL — source/version/Curime verified; legal publication gate pending:** certify license and redistribution for INEC Localidades 2024, update `2024-12-31`; preserve verified archive hash and schema evidence, confirm update cadence, and approve static-artifact publication. Verify `GUANACASTE / NICOYA / NICOYA / CURIME`, `COD_UGED 50201`, category `POBLADO`, plus a homonymous Curime elsewhere.
- [ ] A.5 **BLOCKED — privacy governance:** approve purpose, access, retention, correction, and minimization for structured residence and review evidence; verify audit/notification examples contain no full address, identification, or unnecessary agreement content.
- [ ] A.6 **PARTIAL — scope fixed; policy activation blocked:** translate corroborated A.1 into one versioned coverage policy whose only candidate included locality is Curime; define excluded and manual-review cases. Verify selecting Curime, completing the hierarchy, or supplying an exact address never yields automatic residency verification, eligibility, approval, or rejection.
- [ ] A.7.1 Freeze the future protected `PATCH /affiliate-requests/:id/review-evidence` contract for `PENDING` requests: expected evidence version, append-only replacement, `404`, `403`, terminal `409`, stale-version `409`, and null review read; verify normative examples cover each outcome without creating the endpoint.
- [ ] A.7.2 Freeze semantic separation: territorial outcome, proposed institutional outcome, recording actor, and Junta agreement reference; verify an eligible review leaves the request `PENDING` and never identifies the operator as institutional decision-maker.
- [ ] A.7.3 Freeze the technical envelope for a Junta agreement reference: schema/version, agreement identifier, custodian/source reference, owner-approved act/session/date fields, and optional contextual `AssemblyResolution`; verify no `Assembly` relation, internal id, free text, Role, or governance position alone is sufficient.
- [ ] A.7.4 Freeze unchanged terminal compatibility: approval retains no body and rejection retains non-empty `rejectionReason`; verify no review-evidence contract activates a terminal gate before separate owner-approved Apply.
- [ ] A.8.1 Define later additive Prisma expansion: request-owned append-only evidence, actor/FK/index strategy, immutable version, supersession link, one current pending evidence rule, and nullable terminal-resolution evidence link; verify no destructive changes or inferred backfill.
- [ ] A.8.2 Define minimal evidence/audit data boundary: policy version, institutional source reference, result, action metadata and changed fields only; verify audit/notifications exclude address, community, identification, full rationale and full agreement content.
- [ ] A.8.3 Define protected response/UI projection: declared snapshot status, review absent/not-recorded/current summary, historical incomplete state, and agreement reference only when independently recorded; verify no selector, agreement form, eligibility action, or RBAC change is introduced before C.1.
- [ ] A.8.4 Prepare migration and concurrency certification plan for a disposable PostgreSQL environment; verify planned cases cover append/supersede, stale version, terminal conflict, FK/index integrity, rollback retention, and concurrent terminal claims without touching production/local data.
- [ ] A.9 Implement migration preflight and rollback plan for disposable PostgreSQL only; verify SQL review proves existing rows remain valid, terminal rows remain unchanged, new fields are nullable, and rollback retains captured evidence rather than deleting it.
- [ ] A.10 Add later backend contract/model tests for catalog provenance, evidence append/supersession, agreement-reference independence, optional Assembly context, FK integrity, and no inferred backfill; verify focused tests pass before continuing to B.

## B. Public form capture

- [ ] B.1 Close license/redistribution gate for source and derived artifact before repository publication or deployment; verify approval records permitted use, attribution, redistribution, version/update expectations, and custody of source evidence.
- [x] B.2 Implement a deterministic generator for INEC Localidades 2024 that verifies source URL/hash, metadata date/version and DBF schema, excludes geometry, deduplicates points by hierarchy/name/category, and emits sorted catalog plus manifest; verify two runs are byte-identical and altered hash/schema fails closed.
- [x] B.3 Define version-scoped opaque `localityKey` without treating `COD_SNIT`, `ID` or `ID_MGN` as business keys; verify Curime target and homonymous Curime records remain distinct by full hierarchy/category.
- [x] B.4 Add an immutable artifact loader and read-only NestJS endpoints for provinces, cantons, districts and localities; verify each child endpoint requires a valid complete parent path, returns catalog version, and performs no runtime INEC request or database write.
- [x] B.5 Add backend hierarchy validation for version plus Province → Canton → District → Locality; verify Curime succeeds under `50201`, mixed parents, unknown keys, browser labels, tampered/unsupported versions fail, and unavailable artifact returns `503 CATALOG_UNAVAILABLE` without deciding eligibility.
- [ ] B.6 Extend public creation compatibly with server-canonical catalog provenance while preserving M snapshots and exact address; verify spoofed metadata is ignored/rejected, historical nullable rows remain readable, no address backfill occurs, and accepted requests remain `PENDING`.
- [ ] B.7 Upgrade `/afiliacion` to four dependent selectors after B.1–B.6: parent changes synchronously clear descendants, disabled children cannot submit, exact address remains complementary, and copy never promises residence or eligibility. Verify keyboard, focus, errors, 320/375/768/1024/1440 layouts and single submit.
- [ ] B.8 Guard option queries by catalog version and full parent path with cancellation/request identity; verify late responses cannot repopulate stale canton, district or locality selections and changing any ancestor invalidates descendant cache state.
- [ ] B.9 Implement coordinated compatibility rollout before making catalog fields required; verify old response consumers tolerate nullable provenance, historical requests show incomplete evidence, and versioned tests document pre-/post-activation behavior.
- [ ] B.10 Preserve generic operational notifications; verify producer/inbox tests exclude identity, codes, locality, address, catalog provenance and review evidence.

## C. Administrative territorial review

- [ ] C.1 Implement protected append-only review-evidence service/endpoint for `PENDING` requests using existing authorization and expected evidence version; verify unauthorized, terminal, stale, duplicate, positive, negative, and ambiguous cases.
- [ ] C.2 Implement backend policy evaluation that distinguishes catalog validity from human eligibility and refuses review when policy evidence is inactive or unknown; verify Curime selection and broad district membership alone cannot produce `ELIGIBLE`.
- [ ] C.3 Extend list/detail projections with minimal review status and protected detailed submitted/review evidence; verify list minimization, authoritative detail, historical null states, and no current Person projection overwrites submitted values.
- [ ] C.4 Update administrative detail UI to display declared residence, source/version, policy, territorial result, institutional decision evidence, and incomplete/stale warnings; verify positive, outside-coverage, ambiguous, historical, loading, error, and terminal states.
- [ ] C.5 Add review controls for eligible, ineligible, and manual-review-required outcomes plus proposed institutional resolution and agreement reference; verify labels, confirmation, busy lock, keyboard/focus, 320/375/768/1024/1440 layouts, and backend error rendering.
- [ ] C.6 Record minimized audit events for evidence append/supersession; verify audit tests include actor, request id, evidence id/version, result, and policy version while excluding residence and full agreement content.

## D. Safe approval and rejection integration

- [ ] D.1 Extend approval transaction to lock and revalidate current review evidence, `ELIGIBLE` result, applicable policy, matching `APPROVE` outcome, complete agreement reference, Person identity, and duplicate Affiliate rules before creating Affiliate; verify failure at any gate leaves request `PENDING` and creates no Affiliate.
- [ ] D.2 Extend rejection transaction to require current matching `REJECT` evidence, complete agreement reference, and existing non-empty reason, binding terminal evidence and audit atomically; verify audit failure, stale evidence, missing agreement, and concurrent resolution roll back.
- [ ] D.3 Preserve existing approve/reject route and payload compatibility plus compare-and-set behavior; verify HTTP contract tests prove approve remains no-body, reject retains `rejectionReason`, new evidence is pre-recorded, and terminal responses add only nullable compatible fields.
- [ ] D.4 Bind each terminal request to exact review evidence and prevent later replacement; verify database/service tests show terminal evidence is immutable and two concurrent approval/rejection attempts commit at most one result.
- [ ] D.5 Confirm Person First boundaries during resolution; verify tests prove submitted residence is not copied into `Person`, historical snapshots are unchanged, and Affiliate creation still uses backend-owned transaction only.

## E. Tests, compatibility, and certification

- [ ] E.1 Run focused backend unit and HTTP suites for DTO validation, catalog hierarchy, policy outcomes, privacy, authorization, historical compatibility, approval, rejection, audit rollback, and concurrency; record each command as `PASSED` or `FAILED` with counts.
- [ ] E.2 With explicit disposable-database authorization, run PostgreSQL migration and integration certification for additive expansion, null historical rows, FK/index behavior, transaction rollback, and concurrent terminal claims; otherwise record `NOT_EXECUTED` without claiming certification.
- [ ] E.3 Run focused frontend tests for public capture and administrative review, then architecture check and build; verify no changes to `UserRequest`, Eventos, Perfil institucional, navigation authorization, general RBAC, or unrelated feature boundaries.
- [ ] E.4 Perform authorized manual accessibility/responsive review for public and administrative flows at 320/375/768/1024/1440 px, keyboard, focus, status text, errors, and screen-reader labels; record unexecuted checks as `NOT_VERIFIED`.
- [ ] E.5 Execute security/privacy regression review for 401/403, direct routes, spoofed catalog metadata, over-posting, enumeration-safe conflicts, logs, notifications, and audit minimization; verify no detailed residence escapes protected review surfaces.
- [ ] E.6 Validate OpenSpec strictly, run `git diff --check`, and inspect Git scope; verify only approved SGI-AFF-V1-01 files are included and preserved local Eventos/Perfil institucional work remains untouched.
- [ ] E.7 Produce owner acceptance evidence mapping every spec scenario to automated or manual proof and explicitly list unresolved legal/catalog/privacy decisions; do not mark ready for archive or deployment while any blocking decision or required verification remains open.

## Workflow follow-up

- Request separate authorization before Apply; this proposal alone does not authorize implementation.
- Archive only after all tracked tasks, required owner decisions, and verification evidence are complete and archive is explicitly requested.
