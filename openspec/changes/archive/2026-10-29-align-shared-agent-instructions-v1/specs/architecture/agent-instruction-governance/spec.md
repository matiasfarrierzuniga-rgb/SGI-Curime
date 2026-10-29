# Spec Delta

## Purpose

Defines durable governance for how SGI-Curime coding agents resolve instructions, select skills, protect repository state, move through OpenSpec phases, and report validation evidence.

## ADDED Requirements

### Requirement: Instruction precedence
Agents SHALL resolve instructions in this order: explicit user scope, verified backend and domain contracts, root `AGENTS.md`, directory-local `AGENTS.md`, current standards documentation, local SGI skills, generic skills, and OpenSpec or historical material according to its documented status. Narrower rules SHALL apply only inside their owned directory or task domain.

#### Scenario: Local frontend rule applies
- **WHEN** an agent works inside `frontend/` and no higher-authority instruction conflicts
- **THEN** it applies root governance together with `frontend/AGENTS.md` and `frontend/CONVENTIONS.md`

#### Scenario: Historical material conflicts with current evidence
- **WHEN** OpenSpec, `PROJECT-STATE.md`, or historical documentation conflicts with current Git, code, tests, or configuration
- **THEN** the agent reports the discrepancy and does not silently treat historical material as current fact

### Requirement: Explicit OpenSpec phase transitions
Agents SHALL distinguish `EXPLORE`, `PROPOSE`, `APPLY`, `VERIFY`, and `ARCHIVE`. Authorization for one phase MUST NOT authorize a later phase, and Archive MUST occur only after implementation and required verification are complete and a separate archive action is authorized.

#### Scenario: Proposal is completed
- **WHEN** an agent finishes planning artifacts during PROPOSE
- **THEN** it stops without editing product code and requests explicit APPLY authorization

#### Scenario: Implementation is not verified
- **WHEN** implementation exists but required verification is incomplete
- **THEN** the change remains unarchived and its validation state is reported accurately

### Requirement: Repository operation authorization
Agents MUST inspect current Git state before mutative work and preserve unrelated tracked and untracked files. They MUST NOT create a worktree, change branches, clean files, stash, reset, rebase, merge, commit, push, or archive without authorization appropriate to that operation.

#### Scenario: Existing worktree is dirty
- **WHEN** an agent detects unrelated tracked or untracked changes
- **THEN** it preserves them and limits work to an approved non-conflicting scope or reports a blocker

#### Scenario: Worktree creation is not authorized
- **WHEN** a workflow could benefit from an isolated worktree but the user has not approved one
- **THEN** the agent does not create it and asks before using that strategy

### Requirement: Selective skill discovery
Agents SHALL select the minimum task-relevant skills by specialty. Local SGI skills SHALL constrain generic skills, and provider-specific duplicate copies SHALL be treated as interchangeable references rather than cumulative mandatory instructions.

#### Scenario: Frontend visual task begins
- **WHEN** a task changes SGI-Curime interface appearance
- **THEN** the agent leads with `sgi-frontend-design`, adds only relevant specialty skills, and validates with responsive and accessibility guardrails

#### Scenario: Installed copies overlap
- **WHEN** equivalent skill content exists under multiple agent-provider directories
- **THEN** the agent uses one accessible authoritative copy and does not combine duplicate guidance as separate requirements

### Requirement: Frontend architecture and typography alignment
Frontend instructions SHALL preserve `app -> features -> shared`, feature public APIs, TanStack Query server-state ownership, and legacy `NO_NEW_CODE` zones. Visual instructions SHALL use DM Sans for interface text and MAY use DM Serif Display only for approved display headings through existing semantic tokens.

#### Scenario: Architecture skill conflicts with conventions
- **WHEN** a skill recommends horizontal roots that conflict with `frontend/CONVENTIONS.md`
- **THEN** the agent follows current slice conventions and treats the skill text as requiring alignment

#### Scenario: Display heading is designed
- **WHEN** an approved expressive or institutional display heading is needed
- **THEN** the interface uses the existing heading token without introducing another font or component-local font family

### Requirement: Proportional validation and truthful reporting
Validation SHALL match the risk and affected surface. Agents MUST record executed commands and outcomes as `PASSED` or `FAILED`, unexecuted applicable checks as `NOT_EXECUTED`, and irrelevant checks as `NOT_APPLICABLE`; modifying or destructive checks require explicit authorization and a safe environment.

#### Scenario: Documentation-only change is reviewed
- **WHEN** an instruction-only change affects no runtime behavior
- **THEN** validation covers artifact structure, references, contradictions, OpenSpec validity, and Git scope without requiring unrelated application suites

#### Scenario: Check was not run
- **WHEN** a test or build was skipped because it was unauthorized, mutative, unavailable, or disproportionate
- **THEN** the agent states `NOT_EXECUTED` with the reason and does not claim success

### Requirement: Contract and authorization preservation
Instruction alignment MUST NOT invent or change backend endpoints, DTO fields, domain states, persistence models, routes, roles, capabilities, or RBAC behavior. Protected operations SHALL continue to require frontend visibility controls, frontend route controls, and authoritative backend enforcement.

#### Scenario: Governance text discusses permissions
- **WHEN** an instruction change references roles or capabilities
- **THEN** it points to verified backend contracts and does not grant or redefine authorization

### Requirement: Evidence-based Git integration policy
Shared changes SHALL use reviewed Pull Requests toward `development`, with controlled promotion to stable `main`. Instructions MUST describe this as project policy and MUST NOT claim that branch protections or Rulesets are active unless current repository evidence verifies them.

#### Scenario: Agent reports merge readiness
- **WHEN** an agent summarizes a proposed or completed change
- **THEN** it distinguishes policy expectations from verified remote protection configuration

### Requirement: Thin cross-tool instruction adapters
Tool-specific instruction files SHALL point to the repository instruction hierarchy and add only tool-specific activation details. They MUST NOT duplicate the complete shared governance contract.

#### Scenario: Copilot instructions are introduced
- **WHEN** a GitHub Copilot adapter is approved for creation
- **THEN** it references root and directory-local authorities, states precedence, and contains no divergent copy of shared architecture, Git, or validation rules

### Requirement: Design System V1 deferral
Agent instructions SHALL identify component standards as future Design System V1 decisions until separately specified and implemented. This includes buttons, forms, inputs, tables, iconography, DatePicker, DateRangePicker, CalendarView, toasts, dialogs, notifications, localization, and accessibility details beyond current baseline rules.

#### Scenario: Deferred component guidance is referenced
- **WHEN** planning mentions a future Design System V1 component family
- **THEN** it labels the item proposed or pending and does not present it as an existing shared component contract
