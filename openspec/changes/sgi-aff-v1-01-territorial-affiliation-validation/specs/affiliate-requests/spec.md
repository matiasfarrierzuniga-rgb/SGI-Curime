# Spec Delta

## ADDED Requirements

### Requirement: Pending lifecycle remains explicit
An affiliation submission SHALL remain `PENDING` until an authorized approval or rejection commits. Territorial capture, catalog matching, territorial review, and registration of institutional evidence MUST NOT resolve the request by themselves.

#### Scenario: Eligible territorial review is recorded
- **WHEN** an authorized reviewer records an eligible territorial result for a `PENDING` request
- **THEN** the request remains `PENDING` until approval or rejection commits

#### Scenario: No response deadline is configured
- **WHEN** the legal resolution period and effects of no response have not been documented and approved
- **THEN** the system does not resolve, approve, reject, expire, or grant rights automatically

### Requirement: Institutional decision reference
After the institutional decision contract is approved, the system SHALL preserve a structured reference to the Junta Directiva agreement used to approve or reject an affiliation request. The system MUST NOT infer the agreement from a meeting date, internal database id, free text, software Role, governance position, `Assembly.id`, or `AssemblyResolution` alone. The authorized user who records the terminal operation is distinct from the Junta Directiva agreement that supports it.

#### Scenario: Approval references a board agreement
- **WHEN** an authorized operator approves a request
- **THEN** the terminal record identifies the institutional agreement reference used for admission

#### Scenario: Rejection references a board agreement
- **WHEN** an authorized operator rejects a request
- **THEN** the terminal record identifies the institutional agreement reference used for denial and preserves the rejection reason

#### Scenario: Agreement reference contract is not confirmed
- **WHEN** the ADI has not confirmed the minimum official agreement reference fields
- **THEN** implementation of terminal decision recording remains blocked

#### Scenario: Assembly resolution offers contextual support
- **WHEN** an independently valid agreement reference identifies an `AssemblyResolution`
- **THEN** the system MAY preserve that model as optional context without requiring an Assembly relation for affiliation decisions

### Requirement: Separate institutional reference from territorial review
The system SHALL preserve territorial review and the Junta Directiva agreement reference as distinct records. A territorial result SHALL NOT itself admit or deny a request, and the recording operator SHALL NOT be treated as the institutional decision-maker.

#### Scenario: Territorial review is recorded before institutional decision
- **WHEN** an authorized operator records a current territorial review for a `PENDING` request
- **THEN** the request remains `PENDING` and no approval or rejection is inferred

#### Scenario: Agreement reference is not owner-approved
- **WHEN** the owner-approved required-field profile for a Junta agreement reference is unavailable
- **THEN** no terminal decision contract treats a free-text value, `Assembly.id`, or `AssemblyResolution` alone as a valid agreement

### Requirement: Future review-evidence API failure contract
When the separately authorized review-evidence resource is implemented, it SHALL return stable protected outcomes for absent requests, insufficient authorization, terminal requests, and version conflicts without changing current approve or reject behavior.

#### Scenario: Review request does not exist
- **WHEN** an authorized operator records evidence for a nonexistent request
- **THEN** the system returns `404` and persists no evidence

#### Scenario: Current request state changed concurrently
- **WHEN** an operator records evidence using a stale expected evidence version
- **THEN** the system returns `409 REVIEW_EVIDENCE_VERSION_CONFLICT` and preserves the current evidence

#### Scenario: Current terminal routes remain unchanged
- **WHEN** the review-evidence resource has not been separately authorized and implemented
- **THEN** `PATCH /affiliate-requests/:id/approve` and `PATCH /affiliate-requests/:id/reject` retain their current routes, payloads, and behavior

### Requirement: Catalog-backed submission remains compatible
After catalog activation, a new submission SHALL preserve the validated hierarchy, canonical locality display data, catalog version/integrity and exact address as immutable evidence. Historical requests and older compatible payloads MUST remain readable without inferred catalog metadata or geographic backfill.

#### Scenario: Certified hierarchy is submitted
- **WHEN** the backend validates a complete hierarchy against the active artifact
- **THEN** the request snapshots canonical hierarchy and provenance separately from the complementary exact address

#### Scenario: Historical request lacks catalog metadata
- **WHEN** an existing request has nullable codes, locality key, source version, or integrity metadata
- **THEN** the system returns it as historical incomplete evidence without deriving values from address or current catalogs

#### Scenario: Valid catalog selection is submitted
- **WHEN** a hierarchy and locality exist in the certified catalog
- **THEN** the request remains `PENDING` and no residence verification, approval, or rejection is inferred

### Requirement: Current authorization remains unchanged
V1 SHALL retain the current authorization contract for affiliation review. Secretaría MAY be documented as the proposed operational responsibility, but the system MUST NOT derive access from a board office, create a new software Role, or change the general RBAC matrix in this change.

#### Scenario: Secretary office exists without current software authorization
- **WHEN** a Person holds a Secretaría governance appointment but lacks the existing affiliation-review authorization
- **THEN** the system denies the protected operation

#### Scenario: Currently authorized operator records the decision
- **WHEN** an operator satisfies the existing backend authorization contract
- **THEN** the system permits the operation without requiring or inferring a Secretaría appointment

## MODIFIED Requirements

### Requirement: Authoritative request detail
The system SHALL retrieve the selected request from `GET /affiliate-requests/:id` and display identity, submitted contact and territorial evidence, affiliation reason, and status. It SHALL display territorial review, policy version, institutional agreement reference, review metadata, and rejection reason only when those independently implemented records exist.

#### Scenario: Administrator selects a request
- **WHEN** the administrator selects a request from the list
- **THEN** the system loads and displays authoritative detail for that request

#### Scenario: Detail load fails
- **WHEN** the detail request fails
- **THEN** the system displays a recoverable detail error with retry and close actions

#### Scenario: Request is terminal
- **WHEN** the request status is `APPROVED` or `REJECTED`
- **THEN** the detail displays its terminal status and does not offer approve or reject actions

#### Scenario: Territorial evidence is incomplete
- **WHEN** the request lacks structured territorial evidence or has an ambiguous review result
- **THEN** the detail identifies the incomplete state without inventing codes, policy, or eligibility

### Requirement: Approve pending request
After the later eligibility/decision increment is authorized, the system SHALL allow an administrator to approve only a `PENDING` request through `PATCH /affiliate-requests/:id/approve` after explicit confirmation. Backend approval SHALL then require an eligible territorial review under the applicable active policy and a valid Junta Directiva agreement reference. The capture/snapshot increment MUST NOT alter current terminal approval behavior.

#### Scenario: Administrator confirms approval
- **WHEN** the administrator confirms approval of a `PENDING` request with required territorial and institutional evidence
- **THEN** the system sends one approval mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Approval succeeds
- **WHEN** the backend approves the request
- **THEN** the system refreshes affected request data, presents the `APPROVED` state, and reports success

#### Scenario: Approval conflicts with current backend state
- **WHEN** approval returns a conflict because the request was already resolved or an Affiliate already exists
- **THEN** the system displays the backend-derived conflict message, remains usable, and permits refreshing authoritative request data

#### Scenario: Approval fails generically
- **WHEN** approval fails for another recoverable reason
- **THEN** the system displays an error, releases the busy state, and allows a later retry

#### Scenario: Territorial eligibility is absent or stale
- **WHEN** approval is attempted without an eligible review or the review policy version is no longer applicable
- **THEN** the backend rejects approval and creates no Affiliate

#### Scenario: Board agreement reference is missing
- **WHEN** approval is attempted without a valid institutional agreement reference
- **THEN** the backend rejects approval and keeps the request `PENDING`

### Requirement: Reject pending request
After the later eligibility/decision increment is authorized, the system SHALL allow an administrator to reject only a `PENDING` request through `PATCH /affiliate-requests/:id/reject` with a non-empty rejection reason and a valid Junta Directiva agreement reference after explicit confirmation. Rejection state, reason, agreement reference, review metadata, and audit event MUST commit atomically. The capture/snapshot increment MUST NOT alter current terminal rejection behavior.

#### Scenario: Rejection reason is missing
- **WHEN** the administrator attempts to continue without a non-empty rejection reason
- **THEN** the system displays validation feedback and does not send a rejection mutation

#### Scenario: Administrator confirms rejection
- **WHEN** the administrator provides a valid reason and agreement reference and confirms rejection
- **THEN** the system sends one rejection mutation, displays busy feedback, and prevents duplicate submission while it is pending

#### Scenario: Rejection succeeds
- **WHEN** the backend rejects the request
- **THEN** the system refreshes affected request data, presents the `REJECTED` state and rejection reason, and reports success

#### Scenario: Rejection fails
- **WHEN** rejection returns a conflict or another recoverable error
- **THEN** the system displays the available backend-derived message, releases the busy state, and allows authoritative data to be refreshed

#### Scenario: Agreement reference is missing
- **WHEN** rejection is attempted without a valid institutional agreement reference
- **THEN** the backend rejects the mutation and keeps the request `PENDING`

### Requirement: Backend-owned Affiliate creation
The frontend MUST NOT create an Affiliate directly. After the later eligibility/decision increment is authorized, approval SHALL rely exclusively on one backend transaction that revalidates territorial eligibility and agreement evidence, resolves the request as `APPROVED`, creates an `ACTIVE` Affiliate, and writes required audit events. The capture/snapshot increment does not alter existing backend-owned Affiliate creation.

#### Scenario: Approval creates an Affiliate
- **WHEN** the backend completes `PATCH /affiliate-requests/:id/approve`
- **THEN** the request is `APPROVED` and the created `ACTIVE` Affiliate is available through `GET /affiliates`

#### Scenario: Request is rejected
- **WHEN** the backend completes `PATCH /affiliate-requests/:id/reject`
- **THEN** the request is `REJECTED` and no Affiliate is created by the frontend

#### Scenario: Administrative screen needs creation behavior
- **WHEN** the frontend implements the review workflow
- **THEN** it MUST NOT call or introduce `POST /affiliates`, duplicate the approval transaction, or infer new business states

#### Scenario: Approval evidence changes concurrently
- **WHEN** territorial or institutional evidence changes after an approval attempt reads stale data
- **THEN** the backend commits at most one valid terminal outcome and otherwise returns a conflict without creating a duplicate Affiliate
