## Purpose

Defines the evidence-based architectural baseline and target-state gap analysis required to plan later SGI-Curime phases without assumptions or premature implementation.

## ADDED Requirements

### Requirement: Evidence-based repository inventory
The baseline SHALL inspect Git state, project structure, package metadata, frontend, backend, API surface, persistence, authentication and authorization, environment handling, infrastructure, validation tooling, tests, and existing documentation. Every material statement SHALL be traceable to repository evidence or an executed command, and unavailable information SHALL be identified as unknown or unverified rather than inferred as fact.

#### Scenario: Repository evidence is available
- **WHEN** a baseline statement is supported by source, configuration, documentation, Git metadata, or command output
- **THEN** the statement is recorded as a verified fact with sufficient path or command context to locate its evidence

#### Scenario: Evidence is unavailable
- **WHEN** the repository and available environment do not establish a material fact
- **THEN** the baseline labels that fact unknown or unverified and does not invent a conclusion

### Requirement: Current architecture document
The Phase 0 implementation SHALL create `docs/architecture/current-state.md` describing the architecture actually found. It SHALL cover repository and Git organization, detected stack and versions, project structure, frontend, backend modules and API surface, Prisma and PostgreSQL persistence, authentication and authorization, environment configuration, infrastructure, builds, tests, documentation, implemented capabilities, and relevant operational limitations.

#### Scenario: Current-state document is reviewed
- **WHEN** a reviewer reads `docs/architecture/current-state.md`
- **THEN** the reviewer can distinguish implemented behavior, configured but unverified behavior, missing behavior, and unknowns without consulting future-state assumptions

### Requirement: Target-state gap analysis
The Phase 0 implementation SHALL create `docs/architecture/gap-analysis.md` comparing the verified current state with the approved target architecture. The comparison SHALL identify aligned, partial, missing, and unverified capabilities; risks; technical debt; existing and missing functionality; architectural decisions already reflected in code; and decisions that still require formalization or approval.

#### Scenario: Target capability is compared
- **WHEN** a target capability from the execution plan is assessed
- **THEN** the gap analysis records its current status, supporting evidence, resulting gap, impact or risk, and the future phase responsible for addressing it when known

#### Scenario: New architectural choice is encountered
- **WHEN** closing a gap would require a decision not justified by the plan or repository
- **THEN** the gap analysis marks it as a proposal or pending decision without presenting it as approved

### Requirement: Transparent validation reporting
The baseline SHALL attempt the existing non-destructive build, test, lint, typecheck, and infrastructure validation commands that are applicable and supported by the environment. It SHALL record each command and its result, including failures, missing prerequisites, skipped modifying commands, and environmental blockers, without claiming success for an unexecuted validation.

#### Scenario: Validation succeeds or fails
- **WHEN** a validation command is executed
- **THEN** the baseline records the command, outcome, and material diagnostic information

#### Scenario: Validation cannot run safely
- **WHEN** a validation requires unavailable tooling, missing prerequisites, secrets, destructive actions, or would modify files during this audit
- **THEN** the baseline records the validation as blocked or not run with the specific reason

### Requirement: Phase 0 scope boundary
The Phase 0 implementation MUST limit changes to the two required architecture documents and any directories needed to contain them. It MUST NOT change application code, dependencies, generated files, migrations, database state, authentication, infrastructure, CI, ADRs, or runtime configuration, and it MUST stop after reporting the Phase 0 Definition of Done.

#### Scenario: Audit discovers a defect
- **WHEN** inspection or validation reveals a defect, security gap, incompatibility, or missing capability
- **THEN** the issue is documented with its evidence and risk but is not corrected as part of Phase 0

#### Scenario: Phase 0 documentation is complete
- **WHEN** both required documents exist and all applicable Phase 0 checks have been reported
- **THEN** the result includes a checked Definition of Done, lists unresolved observations and pending decisions, and requires explicit approval before Phase 1 begins
