# Proposal

## Why

`AssemblyCall` is persisted in the current Prisma model but is not reachable through API or frontend. As a result, the institutional assembly workflow can schedule an assembly and its invitees but cannot record its configured call rounds.

## What Changes

- Add protected read and replacement operations for call rounds of a scheduled assembly.
- Validate positive, unique call numbers; valid quorum configuration; and no duplicate scheduled times.
- Lock call-round changes when the assembly begins, is cancelled, or is otherwise no longer scheduled.
- Expose call rounds in assembly detail and let authorized administrators manage them from the existing assembly screen.
- Preserve existing assembly, convocation, attendance and quorum behavior. This change does not determine legal validity of a call or calculate legal quorum.

## Capabilities

### New Capabilities
- `assembly-calls`: Authorized configuration and consultation of call rounds attached to an assembly.

### Modified Capabilities
- None.

## Impact

- Backend assemblies controller, service, DTOs, audit actions and focused tests.
- Existing `AssemblyCall` persistence table; no schema or migration change.
- Frontend assemblies feature API, query types/hooks, management view and tests.
