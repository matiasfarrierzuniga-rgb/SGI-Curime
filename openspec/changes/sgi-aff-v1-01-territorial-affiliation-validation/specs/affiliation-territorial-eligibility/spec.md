# Spec Delta

## Purpose

Define evidencia de residencia territorial declarada y su snapshot inmutable, separado de una futura revisión administrativa de elegibilidad. Ningún código, localidad o dirección acredita por sí mismo residencia real o jurisdicción estatutaria.

## ADDED Requirements

### Requirement: Structured declared residence
The system SHALL capture declared territorial codes when provided, declared community or locality, and descriptive address as distinct values in an affiliation request. The capture/snapshot increment MUST NOT represent a submitted code as officially validated until catalog strategy and source certification are approved. Selecting Curime or any code MUST NOT prove residence or produce an automatic eligibility decision.

#### Scenario: Applicant submits declared residence
- **WHEN** an applicant submits territorial code strings, a declared community or locality, and a descriptive address
- **THEN** the system stores the request as `PENDING` with each declared residence value kept distinct

#### Scenario: Applicant selects Curime
- **WHEN** an applicant selects or enters Curime as the declared community
- **THEN** the system records the declaration without marking residence verified or the request eligible

#### Scenario: Catalog certification is absent
- **WHEN** the territorial source/catalog strategy has not been approved
- **THEN** the system preserves submitted code strings as declarations and does not infer hierarchy, eligibility, or official provenance

#### Scenario: Certified hierarchy is later activated
- **WHEN** an approved catalog version is active and submitted codes do not form a valid hierarchy under that version
- **THEN** the backend rejects the territorial payload and does not create the request

### Requirement: Immutable territorial submission evidence
The system SHALL preserve territorial values as submitted evidence on `AffiliateRequest`. Later changes to Person, Affiliate, institutional profile, territorial catalogs, or coverage policy MUST NOT rewrite that evidence.

#### Scenario: Person address changes after submission
- **WHEN** a linked Person address changes after an affiliation request was submitted
- **THEN** the request retains its original territorial and descriptive residence snapshot

#### Scenario: Territorial catalog label changes
- **WHEN** an official catalog publishes a new label or code version after submission
- **THEN** the request retains the submitted code, label where captured, source, and version used at submission

### Requirement: Territorial source provenance
The system SHALL identify source and version only when it interprets codes under an approved catalog contract. The official INEC localities catalog is the candidate source for Curime, but it MUST remain inactive until endpoint/distribution, availability, licensing, hierarchy, integrity, and version behavior are certified.

#### Scenario: Certified catalog is used
- **WHEN** the system accepts codes from a certified catalog
- **THEN** the request records sufficient source and version metadata to interpret those codes later

#### Scenario: Source strategy is not selected
- **WHEN** no certified source strategy is active during capture
- **THEN** the system does not fabricate codes, infer residence from the address, or silently label declarations as official

### Requirement: Confirmed functional territorial scope
The future coverage-policy design SHALL use Curime locality, Nicoya district, Nicoya canton, Guanacaste province as the confirmed functional scope. It MUST remain inactive until statutory documentary support and catalog certification are approved.

#### Scenario: Functional scope lacks statutory documentary support
- **WHEN** Curime locality scope has no approved statute, article, or resolution with authority, effective date, and custody reference
- **THEN** the system does not activate a coverage policy or determine eligibility from that scope

#### Scenario: Certified hierarchy drives future selectors
- **WHEN** an approved INEC catalog version is active
- **THEN** the public capture flow limits Canton by Province, District by Canton, and Locality by District without deciding residence or eligibility

### Requirement: Reproducible INEC locality artifact
Before catalog activation, the system SHALL generate a deterministic minimal artifact from an approved INEC Localidades 2024 archive. The manifest MUST identify source, version/date, input hash, generator schema and output hash, and publication MUST remain blocked until license and redistribution are approved.

#### Scenario: Identical certified input is generated twice
- **WHEN** the same archive and generator version are processed twice
- **THEN** both runs produce byte-identical ordered catalog output and the same output hash

#### Scenario: Source schema or hash differs
- **WHEN** the archive hash, metadata version, or required DBF columns differ from the approved manifest
- **THEN** generation fails without publishing or activating an artifact

#### Scenario: Redistribution terms are unresolved
- **WHEN** license or redistribution permission for source or derived data is not documented
- **THEN** the generated artifact is not published or deployed

### Requirement: Catalog identity and homonym disambiguation
The catalog SHALL identify a locality within its catalog version, complete administrative hierarchy and category. Locality name, `COD_SNIT`, point `ID`, and `ID_MGN` MUST NOT independently serve as business identity without semantic certification.

#### Scenario: Curime target is resolved
- **WHEN** the certified artifact is queried for `GUANACASTE / NICOYA / NICOYA`
- **THEN** it includes `CURIME`, `COD_UGED 50201`, category `POBLADO`

#### Scenario: Homonymous locality exists elsewhere
- **WHEN** two records share the name `CURIME` under different hierarchy or category
- **THEN** the system exposes distinct scoped options and rejects name-only validation

### Requirement: Read-only hierarchical catalog API
The backend SHALL expose versioned read endpoints for provinces, cantons, districts and localities, plus authoritative hierarchy validation. Child responses MUST require and honor their complete parent path; the API MUST NOT query the remote INEC service at form runtime.

#### Scenario: Valid dependent path is requested
- **WHEN** a client requests children using a valid parent path from the active version
- **THEN** the API returns only direct children and identifies the catalog version

#### Scenario: Mixed-parent hierarchy is validated
- **WHEN** submitted province, canton, district or locality do not belong to one hierarchy
- **THEN** validation returns `400` and no request is accepted with that hierarchy

#### Scenario: Catalog artifact is unavailable
- **WHEN** the configured artifact is missing, invalid, or unsupported
- **THEN** validation fails closed with `503 CATALOG_UNAVAILABLE` and does not trust browser labels

### Requirement: Consistent dependent territorial selectors
The public form SHALL present Province, Canton, District and Locality as dependent selectors. A parent change MUST clear all descendants before loading new options, and late responses MUST NOT restore values for an obsolete parent path.

#### Scenario: Parent selection changes
- **WHEN** the applicant changes province, canton, or district
- **THEN** all descendant selections and errors are cleared and descendants remain disabled until valid options load

#### Scenario: Earlier request finishes late
- **WHEN** a child-options response arrives after its parent path changed
- **THEN** the form ignores that response and preserves selections for the current path only

#### Scenario: Exact address is entered
- **WHEN** the applicant provides an exact descriptive address
- **THEN** the system keeps it as complementary snapshot data and does not derive or override selector values

### Requirement: Evidence-backed coverage policy
The system SHALL evaluate territorial eligibility only in a later, separately activated increment against an active, versioned coverage policy backed by an approved institutional source. The capture/snapshot increment SHALL NOT evaluate eligibility. A future policy MUST limit its functional scope to Curime locality and MUST NOT infer coverage for all Nicoya district, canton, or province.

#### Scenario: Active policy has statutory evidence
- **WHEN** an authorized reviewer evaluates a request under an active policy
- **THEN** the review records the policy version and institutional evidence reference used

#### Scenario: Coverage policy is not confirmed
- **WHEN** no evidence-backed coverage policy is active
- **THEN** the system keeps territorial eligibility unresolved; no new approval gate is activated by the capture/snapshot increment

#### Scenario: Official code lies inside a broad administrative area
- **WHEN** a request code belongs to an administrative area that is broader than the evidenced ADI coverage
- **THEN** the system does not treat that code alone as eligible

### Requirement: Explicit administrative territorial review
After policy approval, the system SHALL require an authorized human review that records an eligibility result, review timestamp, recording user, policy version, and non-sensitive rationale or evidence reference. A catalog match MAY support review but MUST NOT replace it. The recording user is distinct from the Junta Directiva institutional decision-maker.

#### Scenario: Residence is confirmed within coverage
- **WHEN** an authorized reviewer confirms the evidence is compatible with the active coverage policy
- **THEN** the system records an eligible territorial review without resolving the `PENDING` request automatically

#### Scenario: Residence is outside coverage
- **WHEN** an authorized reviewer determines that residence is outside the active coverage policy
- **THEN** the system records an ineligible review and prevents approval

#### Scenario: Residence evidence is ambiguous
- **WHEN** codes, locality, address, or supporting evidence are incomplete or contradictory
- **THEN** the system records a manual-review-required outcome and prevents approval until resolved

### Requirement: Append-only territorial review evidence
After the separately authorized review increment, the system SHALL append review evidence only for a `PENDING` request. It MUST preserve previous evidence and its version when a newer record supersedes it, and MUST NOT rewrite submitted residence.

#### Scenario: Reviewer replaces current evidence
- **WHEN** an authorized reviewer submits a replacement with the expected current evidence version
- **THEN** the system appends a new version, links it to the superseded evidence, and keeps the request `PENDING`

#### Scenario: Concurrent reviewer submits stale evidence
- **WHEN** an authorized reviewer submits an expected version different from the current version
- **THEN** the system returns `409 REVIEW_EVIDENCE_VERSION_CONFLICT` and creates no replacement evidence

#### Scenario: Terminal request receives review evidence
- **WHEN** a reviewer attempts to record or supersede evidence for an `APPROVED` or `REJECTED` request
- **THEN** the system returns `409 REQUEST_ALREADY_RESOLVED` and creates no evidence

### Requirement: Protected review-evidence availability
The future review-evidence resource SHALL retain existing server-side affiliation-review authorization. Its absence on a request SHALL be represented as no review record, not as an eligibility outcome or inferred territorial fact.

#### Scenario: Unauthorized caller requests review evidence
- **WHEN** a caller does not satisfy existing server-side affiliation-review authorization
- **THEN** the system returns `403` without disclosing or changing review evidence

#### Scenario: Request has no recorded review
- **WHEN** an authorized operator reads a request with no territorial review record
- **THEN** the response exposes no review result and identifies the review as not recorded

### Requirement: Historical request compatibility
The system SHALL retain historical affiliation requests that lack structured territorial data. It MUST NOT infer codes, community, eligibility, or policy version from historical free-text addresses.

#### Scenario: Historical pending request is reviewed
- **WHEN** a `PENDING` historical request has only a free-text address
- **THEN** the system marks territorial evidence incomplete and requires deliberate administrative review before approval

#### Scenario: Historical terminal request is read
- **WHEN** an `APPROVED` or `REJECTED` historical request lacks territorial fields
- **THEN** the system returns it without manufacturing territorial evidence or changing its terminal state

### Requirement: Territorial privacy and audit minimization
The system SHALL restrict detailed residence and review evidence to the existing protected affiliation-review surfaces. Audit and operational notifications MUST use identifiers, action metadata, policy version, and result without duplicating full address or unnecessary personal data.

#### Scenario: Territorial review is audited
- **WHEN** an authorized operator records or replaces a territorial review while the request is `PENDING`
- **THEN** the audit identifies recording actor, request, action, result, and policy version without storing the full residence snapshot

#### Scenario: Public request notification is emitted
- **WHEN** a territorially structured request is created
- **THEN** the operational notification remains generic and excludes codes, locality, address, identity, and review evidence
