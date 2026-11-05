# Design

## Context

See `proposal.md` for motivation and both delta specs for normative behavior. Current `AffiliateRequest` stores a required free-text `address` plus immutable `submittedAddress`; approval creates `Affiliate(ACTIVE)` and resolves the request in one serializable transaction. `Person.address`, request snapshots, and `OrganizationProfile` geography have different ownership and MUST remain separate.

Current public creation resolves `Person`, rejects duplicate affiliation/pending requests, and writes a `PENDING` request. Current approval verifies Person identity and request snapshot consistency; rejection now commits terminal state and audit atomically. Existing routes and states are stable. Current backend authorization remains `Administrador`; frontend capability drift is separate work.

El paquete DINADECO revisado aporta evidencia limitada: `FRAG.pdf` comunica resultados de Asamblea General y nombramientos; `FCIdoneidad.docx` refiere idoneidad y libros legales; plantillas administrativas cumplen sus finalidades observadas. Ninguno acredita límites territoriales oficiales de ADI Curime ni define admisión, plazo, silencio, recursos o acuerdo de Junta para afiliación. El padrón es fuente privada excluida: no se analiza, importa, concilia, reproduce ni usa como evidencia territorial.

No repository evidence defines ADI Curime's exact statutory coverage, resolution deadline, legal effect of no response, appeal mechanism, or minimum official agreement reference. API INEC/IGN, caché y catálogo local versionado siguen como alternativas: endpoint, disponibilidad, licencia, jerarquía, actualización e identificador de versión no están certificados. Estos son bloqueos para elegibilidad y resolución, no para el incremento mínimo de captura/snapshot.

## Goals / Non-Goals

**Goals:**

- Keep declared residence, administrative verification, canonical Person contact, and institutional domicile semantically separate.
- Add structured residence without replacing `address` or mutating existing submitted snapshots.
- Permitir un incremento técnico mínimo que capture/snapshot residencia declarada sin decidir elegibilidad ni modificar aprobación/rechazo.
- Preparar, sin activar, que backend approval dependa de evidencia territorial e institucional vigente.
- Preserve exact evidence used by a terminal decision and prevent stale/concurrent resolution.
- Stage API and data expansion compatibly for existing rows and clients.
- Keep official catalog use deterministic, versioned, and independent from remote availability at decision time.

**Non-Goals:**

- Define ADI coverage before documentary approval.
- Treat a geographic code, label, map match, or Curime selection as proof of residence.
- Add Province/Canton/District relational catalogs, coordinates, GIS polygons, or geocoding in V1.
- Change `UserRequest`, `Person` ownership, `OrganizationProfile`, Eventos, general RBAC, Roles, capabilities, or governance-to-access mapping.
- Implement legal deadlines, tacit approval/denial, appeals, applicant notification, document upload, or padrón import.
- Use `AssemblyResolution` as a general Board-agreement source, infer a Board agreement from an Assembly, or create an Assembly dependency for affiliation.

## Decisions

### 1. Use a bounded hybrid representation

Public input will retain descriptive `address` and add structured submitted values for official province/canton/district codes, corresponding submitted labels where needed for historical interpretation, and declared community/locality. Server-controlled source id, source version, and catalog integrity identifier accompany the snapshot.

The fields remain nullable in storage for historical compatibility. **Minimum increment:** new submissions may capture declared code strings, community/locality, and descriptive address as a snapshot, but no code is accepted as officially validated, no catalog provenance is asserted, and no territorial result is persisted. `submittedAddress` remains authoritative submission evidence for the descriptive address. Required codes, hierarchy validation, and source/version stamping wait for the catalog decision and coordinated rollout.

Alternative A, code plus community plus address without provenance, was rejected because later code/label changes could make historical evidence uninterpretable. Alternative B, relational geographic catalogs, was rejected because it adds synchronization cost and still cannot define ADI jurisdiction.

### 2. Store submitted territorial evidence directly on AffiliateRequest

The additive Prisma design should use nullable `submittedResidence*` scalar fields on `AffiliateRequest`, following the existing `submitted*` pattern. Candidate contract fields, finalized in task A before schema work:

- `submittedProvinceCode` and optional submitted label;
- `submittedCantonCode` and optional submitted label;
- `submittedDistrictCode` and optional submitted label;
- `submittedCommunity`;
- `submittedTerritorialSource`;
- `submittedTerritorialVersion`;
- `submittedTerritorialIntegrity`.

No backfill derives these values from `address`, `Person.address`, `Affiliate.address`, `OrganizationProfile`, seeds, or public content. Current and historical generic fields remain intact.

Alternative: place submitted residence in `Person`. Rejected because Person represents current canonical identity/contact while the request must retain submission-time evidence.

### 3. Defer administrative eligibility evidence from minimum capture

After institutional closure, use an additive request-owned review entity rather than overwritable eligibility columns. Conceptual `AffiliateRequestReviewEvidence` records:

- request relation;
- territorial outcome (`ELIGIBLE`, `INELIGIBLE`, `MANUAL_REVIEW_REQUIRED`);
- coverage policy version and institutional source reference;
- concise non-sensitive rationale/evidence reference;
- proposed institutional outcome (`APPROVE` or `REJECT`);
- structured Junta Directiva agreement reference, once its minimum contract is approved;
- recording actor and timestamp, distinct from institutional decision-maker;
- optional superseded-evidence relation or monotonic version.

`AffiliateRequest` later receives a nullable reference to exact review evidence used for terminal resolution. Existing rows remain valid. Corrections append/supersede evidence while `PENDING`; they never rewrite submitted residence. Terminal rows cannot replace their resolution evidence. This entity, policy evaluation, terminal binding, and review endpoint are excluded from minimum capture.

Alternative: mutable review columns on `AffiliateRequest`. Rejected because corrections could erase which policy and agreement supported the final decision.

### 4. Preserve terminal routes; defer one protected review-evidence API

Define DTO/API contracts before persistence work:

- `POST /affiliate-requests` keeps current fields and adds a structured residence object or equivalent additive fields; source/version are server-derived, never trusted from browser input.
- `GET /affiliate-requests` and `GET /affiliate-requests/:id` add nullable submitted-territory and review summaries. Existing response fields remain.
- Add a protected `PATCH /affiliate-requests/:id/review-evidence` contract to append or supersede territorial and institutional evidence for a `PENDING` request. It carries an expected request/review version for optimistic conflict detection.
- Keep `PATCH /affiliate-requests/:id/approve` route and no-body contract. It reads and revalidates persisted resolution evidence.
- Keep `PATCH /affiliate-requests/:id/reject` route and existing non-empty `rejectionReason`; it reads and revalidates matching persisted resolution evidence.

This future design avoids making existing approve/reject clients send new payloads while ensuring terminal decisions cannot commit without prior evidence. The new endpoint uses current backend authorization; no Secretaría Role/capability is introduced. Minimum capture does not create this endpoint or alter terminal routes.

Alternative: extend approval/rejection DTOs with all review evidence. Rejected because it couples evidence capture to terminal mutation, breaks the empty approval payload, and makes deliberate pre-resolution review harder to inspect.

### 4.1 Freeze the future review-evidence contract without activating it

The later protected resource is `PATCH /affiliate-requests/:id/review-evidence`. It is a contract only until a separately authorized Apply increment creates it. It accepts an expected current evidence version and one proposed, append-only evidence record for a `PENDING` request. Its response returns the new current evidence summary plus its immutable version; detail/list reads return `territorialReview: null` when no record exists and do not derive an eligibility result from declared fields.

The future response contract distinguishes these cases without exposing sensitive snapshots outside the existing protected surface:

| Condition | Future protected API response | Effect |
| --- | --- | --- |
| Request absent | `404` | No evidence is disclosed or created. |
| Existing authorization not satisfied | `403` | No evidence is disclosed or changed. |
| Request no longer `PENDING` | `409` (`REQUEST_ALREADY_RESOLVED`) | No evidence is created or superseded. |
| Expected evidence version differs | `409` (`REVIEW_EVIDENCE_VERSION_CONFLICT`) | Client reloads authoritative detail; no overwrite occurs. |
| No current evidence on a detail | `200` with `territorialReview: null` | This is absence of review, not `INELIGIBLE` or a fabricated historical result. |
| Later terminal command has no current applicable evidence | `409` (`REVIEW_EVIDENCE_REQUIRED`) | Applies only in the separately authorized terminal increment; current terminal routes remain unchanged. |

`403` follows the existing server-side affiliation-review authorization. It does not introduce Secretaría, a new Role, a capability, or client-side authorization inference. Error identifiers are stable contract labels; user-visible text remains backend-derived and non-sensitive.

### 4.2 Use append-only, request-owned review evidence

The future record is conceptually `AffiliateRequestReviewEvidence`, owned by one request and never updated in place. A record contains: immutable version; territorial outcome; policy version and institutional-source reference; a bounded, non-sensitive rationale/reference; proposed institutional outcome; recording actor and time; and an optional link to the evidence it supersedes. At most one unsuperseded record is current for a pending request. Replacing evidence appends a new version and links it to the prior record; it never rewrites declared residence or historical evidence.

The later Prisma design also reserves a nullable reference from `AffiliateRequest` to the exact evidence used by a terminal resolution. That reference is not created or used in A.7–A.8. It exists to prevent a later approval or rejection from relying on mutable current state after an evidence replacement.

Alternative: mutable review columns or a free-form audit JSON. Rejected because neither preserves version history, expected-version concurrency, or the exact evidence supporting a terminal decision.

### 4.3 Separate territorial review from institutional decision

Territorial evidence records a human review result under a policy; it does not admit or deny anyone. The technical envelope for a later `JuntaAgreementReference` is separate from review evidence and from the recording actor. It carries a schema/version identifier, a custodian/source reference, an agreement identifier, and only owner-approved structured fields for act/session/date. `AssemblyResolution` is an optional contextual relation only after an independently valid agreement reference identifies it; absence of that relation never invalidates an otherwise complete agreement.

The exact owner-approved required-field profile, legal sufficiency, retention and custody rules remain blocked. Until they close, no request can claim that a Junta agreement exists, and no terminal endpoint consumes this envelope.

### 4.4 Define read-only administrative states before actions exist

The protected detail can present the following states without enabling a mutation: `NOT_DECLARED`, `DECLARED_UNVERIFIED`, `REVIEW_NOT_RECORDED`, and later a current review summary. `NOT_DECLARED` and `DECLARED_UNVERIFIED` describe submitted snapshots only. `REVIEW_NOT_RECORDED` means no administrative record exists; it is never an eligibility outcome. Historical null snapshots remain incomplete rather than inferred.

Until C.1 is authorized and implemented, the interface exposes no review form, territorial outcome selector, agreement form, or action button. It may explain that no active policy/evidence workflow is configured. Existing approve/reject controls and behavior are not changed by this design phase.

### 5. Keep catalog strategy unresolved until certified

The owner selected the official INEC localities catalog as the candidate source for identifying Curime. It is not yet a certified active source: endpoint/distribution, availability, licensing, hierarchy semantics, release/version, update behavior, integrity and runtime fallback remain required closure. After certification, decide whether a versioned read-only local artifact is required for deterministic validation; it must include source, release/version, retrieval date, license note, and integrity hash. Backend hierarchy validation and frontend selectors remain deferred. Minimum capture treats submitted codes as declarations only.

The artifact does not define coverage. A separate, versioned coverage configuration identifies only evidence-approved combinations or manual rules and carries an institutional evidence reference. No policy is activated until owner approval.

Alternative: browser-only validation or live external lookup. Rejected because both permit bypass and make decisions dependent on network/provider drift.

### 5.1 Record confirmed functional coverage without activating it

The owner-confirmed functional scope is exactly **Curime locality → Nicoya district → Nicoya canton → Guanacaste province**. This definition narrows future policy design to one locality; it does not yet establish statutory jurisdiction, verified residence, or eligibility. A statute/article/resolution with issuing authority, effective date and custody reference must corroborate it before any active coverage policy exists.

After catalog certification, public capture uses dependent filters in this order: Province → Canton → District → Locality. Each choice limits the next list to its parent. The implementation stores submitted codes/labels and catalog provenance as immutable request evidence. `address` remains a complementary descriptive field; it neither derives the selected locality nor overrides the snapshot. Historical rows retain nullable fields and are never backfilled from address.

The operational meaning remains three separate facts: (1) selected values are declared location, (2) a later authorized human review may establish a verified-residence-compatible territorial result under active policy, and (3) a Junta agreement supports a terminal institutional decision. Selecting Curime, completing the filter, or validating catalog hierarchy never performs any of the latter two facts.

Alternative: treat the confirmed locality as an active automatic coverage rule. Rejected because statutory evidence, catalog certification, privacy governance and human review remain unresolved.

### 5.2 Generate a reproducible minimal catalog artifact

The certified source candidate is the INEC publication **Localidades 2024**, updated `2024-12-31`, distributed as `Localidades 2024.zip`. The verified archive contains an ESRI Shapefile plus ISO metadata and exposes `NOMB_UGEP`, `NOMB_UGEC`, `NOMB_UGED`, `COD_UGED`, `NOMB_LOC`, `CAT_PUNTO`, `DESCR_CAT`, `COD_SNIT`, `FUENTE`, `FECHA_ACTU` and point identifiers. The verified Curime target is `GUANACASTE / NICOYA / NICOYA / CURIME`, `COD_UGED=50201`, category `POBLADO`. Other `CURIME` records exist, so locality name alone is never an identity or valid selection.

A build-time generator, not application runtime, downloads or receives the exact ZIP and:

1. verifies an approved source URL, expected archive SHA-256, metadata version/date and required DBF columns;
2. reads metadata and DBF only; geometry is excluded from the application artifact;
3. normalizes display-safe whitespace/case while retaining official names;
4. groups duplicate point rows by administrative hierarchy, normalized locality name and category;
5. emits deterministically sorted JSON plus a manifest containing source URL, source title, source date/version, archive hash, generator schema version and output hash;
6. reproduces byte-identical output for identical input and generator version.

The generated `localityKey` is an opaque, version-scoped technical selector key derived deterministically from `COD_UGED`, normalized locality name and category. It is not a legal/business identifier. `COD_SNIT`, point `ID` and `ID_MGN` remain source attributes only and MUST NOT become business keys until INEC certifies their semantics and stability.

Publication of the ZIP, extracted data, or derived artifact remains blocked until license and redistribution terms are recorded. Development may use a locally generated, non-published fixture containing fictitious cases plus the separately verified Curime assertion; repository publication requires gate closure.

Alternative: query WMS at runtime. Rejected because WMS is visualization-oriented, no stable hierarchical REST/WFS contract was certified, and runtime DNS/provider availability would affect form completion.

### 5.3 Serve one versioned read-only catalog through NestJS

NestJS loads one approved immutable artifact at startup and exposes read-only endpoints; no geographic tables or runtime remote dependency are introduced:

| Endpoint | Required input | Response |
| --- | --- | --- |
| `GET /territorial-catalog/provinces` | active catalog version implicit | `{ catalogVersion, items[{ code, name }] }` |
| `GET /territorial-catalog/cantons?provinceCode=` | province code | child cantons only |
| `GET /territorial-catalog/districts?provinceCode=&cantonCode=` | full parent path | child districts only |
| `GET /territorial-catalog/localities?provinceCode=&cantonCode=&districtCode=` | full parent path | `{ localityKey, name, category }` children only |
| `POST /territorial-catalog/validate` | version and complete selected hierarchy | canonical hierarchy or validation error |

Unknown parent codes, mixed-parent paths, unknown/ambiguous locality keys and unsupported catalog versions return a non-sensitive `400` validation response. An unavailable or invalid configured artifact fails closed for validation and returns `503 CATALOG_UNAVAILABLE`; it never falls back to accepting browser labels. Responses include `catalogVersion` and may use immutable-version ETags/cache headers. Validation is authoritative in NestJS; React filtering is usability only.

The validation result means only “this hierarchy exists in this catalog version.” It does not verify residence, ADI coverage, territorial eligibility, or a Junta decision.

### 5.4 Keep four dependent React selectors consistent

React renders Province → Canton → District → Locality from the NestJS API. Changing a parent synchronously clears every descendant value, validation message and cached selection before requesting new children. Each query key contains catalog version and complete parent path. Disabled descendants cannot submit stale values.

Requests are abortable or guarded by request identity: a late response is ignored unless its parent path still equals current form state. A locality is represented by `localityKey` plus canonical display data returned by backend; free-text locality labels never satisfy selector validation. Homonyms remain separate options scoped by full hierarchy and category. The exact address remains a separate complementary input.

On submit, NestJS validates the complete hierarchy/version and snapshots canonical codes, labels, locality/category, source version and integrity metadata together with the existing descriptive address. Historical rows and clients without certified catalog metadata remain readable through nullable fields; no address or old declaration is backfilled or reinterpreted.

### 6. Separate catalog validity from eligibility

Backend evaluation has three layers:

```text
Submitted residence
       │
       ▼
Catalog hierarchy valid? ── no ──> reject payload
       │ yes
       ▼
Coverage policy supports review? ── no/unknown ──> MANUAL_REVIEW_REQUIRED
       │
       ▼
Authorized human decision ──> ELIGIBLE / INELIGIBLE
       │
       ▼
Matching Junta agreement evidence ──> terminal approve/reject allowed
```

A valid code proves only syntactic/catalog consistency. `ELIGIBLE` is a human administrative result under one policy version; it does not assert legal identity or GPS residence.

### 7. Keep terminal transaction design conditional

After policy and agreement closure, approval continues as a serializable transaction. It locks/reads the `PENDING` request and selected review evidence, verifies evidence is current, territorial outcome is `ELIGIBLE`, proposed outcome is `APPROVE`, policy remains applicable, agreement reference is complete, Person identity remains consistent, and no Affiliate exists. It then creates Affiliate, conditionally claims the request, binds the resolution-evidence id, and writes audits.

After that same closure, rejection transaction verifies `PENDING`, current evidence, proposed outcome `REJECT`, complete agreement reference, and non-empty rejection reason; then conditionally claims the request, binds evidence, and writes audit. Ineligible territorial review supports rejection but never auto-rejects.

Optimistic evidence version plus existing conditional `updateMany` and serializable isolation prevent stale or double resolution. Unique/conflict errors remain non-enumerating where public identity is involved.

### 8. Preserve historical rows without inferred backfill

Migration adds nullable fields and new evidence relations only. Historical terminal rows stay unchanged and readable. Historical `PENDING` rows expose `territorialEvidenceStatus = INCOMPLETE` as a response projection, not a fabricated persisted fact.

To resolve a historical pending request, an authorized operator records new administrative review evidence using independently verified information. This does not alter its null submitted-territory snapshot. Approval remains blocked until evidence meets the active policy.

### 9. Minimize personal data exposure

Detailed residence appears only in public submission response behavior already required by the flow and protected administrative detail. List responses should expose only review status needed for workflow unless full residence is already contractually required. Notifications remain generic.

Audit records action, actor, request id, review evidence id/version, result, policy version, and changed field names. It does not duplicate address, community, identification, full rationale, or complete agreement content. Retention and access rules for review evidence must be approved before implementation.

### 10. Preserve current authorization semantics

“Secretaría” remains an operational responsibility statement. Existing backend guards remain authoritative. Governance appointment, `GovernancePosition`, `Role` name, frontend visibility, or client claims never grant review access. General RBAC reconciliation remains separate.

### 11. Evaluate current agreement model without Assembly dependency

`AssemblyResolution` is an existing formal-resolution model, but it requires `assemblyId` and belongs to `Assembly`. Repository rule `ASM-R11` explicitly states that not every Junta Directiva decision is recorded as `AssemblyResolution`; the DINADECO mapping also states that `Assembly.id` is not a legal act/agreement number and that Assembly is not the Junta act book. Therefore it cannot be the required persistence basis for affiliation decisions.

For a future agreement reference, allow an optional contextual link to `AssemblyResolution` only when an independently valid institutional source identifies it. The minimum agreement contract remains pending and must support a Junta agreement without `Assembly` relation. Recording user authorization remains a system-security fact; Junta approval remains institutional evidence. Neither proves the other.

## Blocking Decisions Before Apply

1. **ADI coverage evidence:** authoritative statute/article/resolution, approved boundary description, issuing authority, effective date, and custodian.
2. **Coverage policy contract:** exact included/excluded communities or other review criteria; no district-wide inference.
3. **Agreement reference contract:** minimum structured fields that uniquely identify a Junta Directiva agreement and whether date/session/act number are required.
4. **Legal lifecycle:** resolution period, effect of no response, notification duties, and appeal/reconsideration rules. Until approved, no timers or automatic legal effects are permitted.
5. **Catalog certification:** selected INEC/IGN source, official endpoint or distribution artifact, availability, license, hierarchy semantics, version identifier, update policy, and integrity method.
6. **Privacy governance:** lawful purpose, access, retention, correction, and minimization for structured residence and review evidence.

Tasks that activate territorial eligibility, alter terminal approval/rejection, or model agreement evidence remain blocked. The additive capture/snapshot increment has a separate, narrower Apply gate; structural validation alone never authorizes either increment.

## Risks / Trade-offs

- [Statutory boundary is wrong or incomplete] → block policy activation until ADI evidence and owner approval identify exact scope and version.
- [Official catalog changes codes or labels] → snapshot submitted labels/source/version/integrity and validate against an immutable local artifact.
- [Valid code is mistaken for actual residence] → require human outcome and explicit UI/backend language; never auto-approve.
- [Historical requests lack structure] → retain null snapshots, show incomplete status, and require new review evidence without backfill.
- [Concurrent evidence edits and approval] → expected evidence version, serializable transaction, conditional claim, and terminal evidence binding.
- [Sensitive location leaks through logs/list/notifications] → minimize projections and audit metadata; prohibit full residence in notifications/audit.
- [Append-only evidence increases complexity] → accept one narrow review model to preserve legal traceability rather than mutable columns.
- [Frontend and backend deploy out of order] → nullable expansion, tolerant reads, additive responses, coordinated required-field activation, and no destructive migration.
- [Current authorization drift remains] → preserve current guard contract and test 401/403; do not solve RBAC in this change.
- [Person First regression] → never write submitted territory into Person during request/review; keep snapshot and live profile ownership separate.

## Migration Plan

1. **Minimum capture/snapshot:** close only DTO, privacy/minimization, compatibility, and explicit Apply authorization; add nullable submitted-territory declaration fields. No inferred backfill, catalog validation, eligibility, review evidence, or terminal route change.
2. Deploy tolerant reads and public/admin display of declared snapshots; continue accepting historical rows and existing clients.
3. Validate focused unit, HTTP, frontend, accessibility, and disposable-PostgreSQL cases for the additive scope.
4. **Separate later increment:** close all institutional/legal/catalog decisions, freeze review/terminal contracts, then add review evidence and terminal binding.
5. Activate required codes, catalog validation, eligibility gate, and agreement reference only after later owner acceptance.
6. Rollback application behavior by disabling new capture UI/consumers if needed. Retain additive snapshot evidence; do not destructively roll it back.
