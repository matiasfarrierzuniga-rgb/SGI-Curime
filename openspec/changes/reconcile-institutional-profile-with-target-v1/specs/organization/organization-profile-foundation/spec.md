## ADDED Requirements

### Requirement: Reconciliation preserves shared history
The system SHALL reconcile the current institutional implementation through new forward-only migrations and SHALL preserve every migration already shared through `main`. Reconciliation SHALL NOT reset databases, rewrite applied migration history, or require deletion of current institutional or board data.

#### Scenario: Current-main database enters reconciliation
- **WHEN** a database contains the shared `InstitutionalProfile` and institutional-board migrations
- **THEN** reconciliation advances it with new migration history while preserving the applied migration records and existing rows

#### Scenario: Applied history differs from the expected baseline
- **WHEN** preflight finds a database whose migration history or institutional tables do not match an approved reconciliation state
- **THEN** reconciliation stops before mutation and reports the unsupported state for reviewed recovery

### Requirement: Institutional authority is singular and deterministic
The system SHALL designate exactly one authoritative institutional root during every reconciliation phase. Temporary coexistence of legacy and canonical representations SHALL have deterministic read rules, SHALL prohibit unsynchronized authoritative writes, and SHALL end at an explicit retirement gate. The final authority SHALL be `OrganizationProfile` with `id = 1`.

#### Scenario: Compatibility phase is active
- **WHEN** legacy compatibility remains available during cutover
- **THEN** all supported institutional reads and writes resolve to the phase's declared single authority and cannot independently mutate two roots

#### Scenario: Canonical cutover completes
- **WHEN** the canonical cutover gate passes
- **THEN** `OrganizationProfile` is the only authoritative institutional root and legacy `InstitutionalProfile` storage is no longer writable or authoritative

### Requirement: Canonical values are reconciled without invention
The system SHALL reconcile institutional values using explicit field rules and accountable authoritative evidence. Directly equivalent nonblank values MAY be preserved after validation. `dinadecoRegion` SHALL populate `region` only after authoritative confirmation; `correspondenceAddress` and `locality` SHALL NOT be silently converted or concatenated into `physicalAddress`; and `organizationType` SHALL use an explicit reviewed mapping from current enum meaning to canonical text. Missing, ambiguous, or conflicting required values SHALL require controlled configuration or re-attestation and SHALL stop cutover rather than inventing data.

#### Scenario: Direct fields are valid and consistent
- **WHEN** direct legal, geographic, and contact mappings are nonblank, within canonical bounds, and agree with authoritative evidence
- **THEN** reconciliation preserves them under the canonical fields without changing their meaning

#### Scenario: Region evidence is insufficient
- **WHEN** `dinadecoRegion` is present but its equivalence to canonical `region` has not been attested
- **THEN** reconciliation does not copy it automatically and requires an authoritative canonical `region`

#### Scenario: Address meanings are not proven equivalent
- **WHEN** only `correspondenceAddress` or `locality` is available and no authority confirms canonical `physicalAddress`
- **THEN** reconciliation stops before canonical enforcement and does not derive a physical address

#### Scenario: Required current value is missing
- **WHEN** any canonical required value cannot be obtained from validated current data or controlled authoritative configuration
- **THEN** reconciliation performs no cutover and reports the missing canonical field names

#### Scenario: Existing roots conflict
- **WHEN** legacy and canonical rows both exist and any mapped institutional value conflicts
- **THEN** reconciliation stops without overwrite, deletion, or automatic winner selection

### Requirement: Existing institutional interfaces remain compatible during cutover
The system SHALL preserve the current `/institutional-profile` read and update routes, authorization capabilities, DINADECO report contract, and corresponding frontend behavior during reconciliation. Compatibility field names SHALL translate deterministically to canonical fields, while canonical persistence remains the single authority. Compatibility support SHALL be explicitly transitional and SHALL NOT require a permanent second table.

#### Scenario: Existing profile client reads after canonical cutover
- **WHEN** an authorized existing client requests `/institutional-profile`
- **THEN** it receives the compatible current response shape derived from the canonical `OrganizationProfile`

#### Scenario: Existing profile client updates a mapped field
- **WHEN** an authorized existing client updates a supported compatibility field
- **THEN** the system validates and writes only its canonical field mapping in the authoritative row and returns the compatible response shape

#### Scenario: Existing profile client clears a canonical required field
- **WHEN** a compatibility update attempts to set a canonical required field to null or blank
- **THEN** the system rejects the request and preserves the authoritative row

#### Scenario: DINADECO report runs after cutover
- **WHEN** an authorized user generates the annual DINADECO report
- **THEN** its institutional section remains available with the established external shape and values sourced from canonical `OrganizationProfile`

### Requirement: Board functionality survives institutional-root cutover
The system SHALL preserve every `BoardTerm` and `BoardAppointment` row and the existing board API/frontend behavior while moving the board root relation to canonical `OrganizationProfile`. This reconciliation SHALL treat `BoardTerm`, `BoardAppointment`, and `BoardPosition` as transitional compatibility models and SHALL NOT claim to implement Target DB-4 governance entities.

#### Scenario: Existing board rows are repointed
- **WHEN** institutional-root cutover occurs
- **THEN** every valid board term continues to reference singleton identity `1`, its appointments remain unchanged, and foreign-key integrity targets canonical `OrganizationProfile`

#### Scenario: Board operations continue after cutover
- **WHEN** authorized clients list or mutate supported board terms and appointments after cutover
- **THEN** the existing board routes and behavior remain operational without recreating governance data

### Requirement: Audit history and future audit meaning remain continuous
The system SHALL preserve historical audit records without rewriting their action or entity labels. After canonical cutover, institutional mutations SHALL emit one canonical audit event referencing `OrganizationProfile`, and audit readers that expose institutional history SHALL keep both historical legacy events and future canonical events understandable without duplicate logging.

#### Scenario: Historical audit is read after cutover
- **WHEN** an audit reader encounters an existing `INSTITUTIONAL_PROFILE_UPDATED` event for entity type `InstitutionalProfile`
- **THEN** the event remains unchanged and is identifiable as pre-cutover institutional history

#### Scenario: Canonical profile is updated after cutover
- **WHEN** an authorized mutation changes canonical institutional data
- **THEN** exactly one sanitized canonical organization-profile audit event records actor, context, entity identity, and changed field names without full institutional payloads

### Requirement: Reconciliation exit and legacy retirement are gated
The reconciliation SHALL pass only after proving one canonical row with `id = 1`, complete required values, no data loss, no dual authoritative writes, preserved profile and DINADECO interfaces, preserved board rows and foreign keys, preserved audit continuity, unchanged Target v1 semantics, preserved shared migration history, and reconciled Current/AS-IS documentation. Legacy institutional storage SHALL be retired only after all readers, writers, and foreign keys have cut over and a rollback checkpoint exists.

#### Scenario: Any exit evidence is incomplete
- **WHEN** any required data, consumer, board, audit, migration, documentation, or authority verification is missing or fails
- **THEN** the exit gate remains blocked and legacy storage is not destructively retired

#### Scenario: Reconciliation exit gate passes
- **WHEN** all reconciliation evidence passes on the intended deployment environment
- **THEN** `OrganizationProfile` is verified as the sole authority, legacy `InstitutionalProfile` is non-authoritative and eligible for reviewed retirement, and DB-4 remains explicitly deferred
