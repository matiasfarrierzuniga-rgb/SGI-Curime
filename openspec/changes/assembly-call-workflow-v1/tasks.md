# Tasks

## 1. Backend call-round contract

- [x] 1.1 Add bounded DTO validation and protected controller endpoint for full call-round replacement; verify controller metadata test covers read/manage capability boundaries.
- [x] 1.2 Implement ordered retrieval and atomic replacement with lifecycle and set validation; verify focused service tests cover valid persistence, malformed sets and locked assemblies.
- [x] 1.3 Add an audit action for call-round replacement; verify transactional audit test asserts actor and action.

## 2. Administrative workflow

- [x] 2.1 Extend assemblies API, types and query mutations for call rounds; verify successful mutations invalidate assembly list/detail query keys.
- [x] 2.2 Render editable configured call rounds only for authorized managers and read-only rows for readers; verify component tests cover save and disabled lifecycle behavior.

## 3. Focused verification

- [x] 3.1 Run backend assembly focused tests and frontend assemblies focused tests; verify exit status zero.
- [x] 3.2 Run relevant backend/frontend builds, `git diff --check`, and strict OpenSpec validation; verify no out-of-scope or whitespace errors.

## Workflow follow-up

- Do not archive this change in this increment.
