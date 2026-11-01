# Spec Delta

## Purpose

Permite configurar y consultar rondas de convocatoria de una asamblea sin afirmar su validez legal o institucional.

## ADDED Requirements

### Requirement: Authorized call-round management
The system SHALL allow a user with `adm.assemblies.manage` to replace all call rounds of a scheduled, unlocked assembly with one or more configured rounds.

#### Scenario: Replace call rounds
- **WHEN** an authorized user saves valid call rounds for a scheduled unlocked assembly
- **THEN** the system persists exactly those rounds and returns them ordered by call number

#### Scenario: Protected mutation
- **WHEN** a user without `adm.assemblies.manage` attempts to replace call rounds
- **THEN** the system rejects the request through backend authorization

### Requirement: Call-round data integrity
The system SHALL reject a call-round replacement with a non-positive or duplicate call number, an invalid quorum configuration, or duplicate scheduled timestamps.

#### Scenario: Invalid round set
- **WHEN** an authorized user submits duplicate call numbers or invalid quorum data
- **THEN** the system rejects the complete replacement without partial persistence

### Requirement: Call-round lifecycle protection
The system SHALL reject call-round changes when the assembly is not `SCHEDULED` or its convocations are locked.

#### Scenario: Started assembly
- **WHEN** an authorized user attempts to change call rounds after an assembly has started
- **THEN** the system preserves existing call rounds and returns a validation error

### Requirement: Call-round consultation
The system SHALL expose configured call rounds in the authorized assembly detail and render them in the administrative assembly management screen.

#### Scenario: Read call rounds
- **WHEN** a user with administrative assembly read access opens an assembly detail
- **THEN** the system returns and displays call number, scheduled time, quorum type, and quorum value for every configured round
