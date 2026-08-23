## Purpose

Define evidence and decision requirements for the Phase 0 frontend architecture baseline, without implementing the proposed architecture.

## ADDED Requirements

### Requirement: Evidence-based frontend inventory
The change SHALL classify current frontend files and feature ownership from source and consumers. Each material claim SHALL be labelled VERIFIED, INFERRED, PROPOSED, or PENDING and include a path or executed-command reference.

#### Scenario: Horizontal folder contains multiple domains
- **WHEN** a horizontal folder is assessed
- **THEN** the inventory SHALL identify actual domain files and consumers rather than infer a problem from its name alone

### Requirement: Behavior-preserving architecture proposal
The change SHALL document a proposed modular frontend monolith with vertical slices, dependency direction, and a `shared/` ownership policy. It SHALL not change frontend behavior, HTTP contracts, auth/session handling, router library, dependencies, or production source.

#### Scenario: Target architecture is reviewed
- **WHEN** a target rule is not approved by the team
- **THEN** it SHALL be marked Proposed or Deferred, not Accepted

### Requirement: Migration readiness evidence
The change SHALL document current routes, guards, auth flow, HTTP/state classification, UX, visual/accessibility/form baselines, tests, hotspots, and a staged Auth-to-Users-to-Roles migration proposal.

#### Scenario: Pilot slice is selected
- **WHEN** Auth, Users, and Roles are compared
- **THEN** selection SHALL cite complexity, dependencies, test coverage, risk, and value as a reusable pattern

### Requirement: Non-destructive validation and Git preservation
The change SHALL record branch, HEAD, existing local work, `git diff --check`, Node/npm, lint, tests, and build. Existing local changes SHALL remain unmodified; no commit or push is permitted.

#### Scenario: Existing worktree changes are present
- **WHEN** unrelated local changes exist
- **THEN** phase documentation changes SHALL be scoped separately and report the preserved paths
