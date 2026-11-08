# Tasks

## 1. Contract and authorization

- [ ] 1.1 Confirm `system.identity.manage` is a persisted recognized capability and expose the protected identity-link HTTP contract; verify controller authorization tests cover 401 and 403.
- [x] 1.2 Add a validated link DTO and response contract with bounded administrative evidence fields; verify DTO tests reject invalid IDs, unsupported method and overlong evidence.

## 2. Transactional identity link

- [ ] 2.1 Implement a dedicated User-to-Person link use case that updates only an unlinked User and writes audit in the same transaction; verify valid, missing, linked and audit-failure unit cases.
- [ ] 2.2 Map one-to-one and concurrent relation conflicts to a stable HTTP conflict outcome; verify duplicate and conditional-update conflict tests.
- [ ] 2.3 Preserve session, role, affiliate, governance and personal-data boundaries; verify tests assert unchanged unrelated fields and no role/capability grant.

## 3. Administrative presentation

- [ ] 3.1 Expose account-root listing of unlinked accounts and canonical Person candidates using existing protected query patterns; verify minimal response projection and capability behavior.
- [ ] 3.2 Add Users administrative UI for unlinked accounts and explicit Base UI Dialog confirmation; verify selection, evidence validation, cancel, success, conflict and permission states.
- [ ] 3.3 Present account status context for Board appointments without creating a second account-management module; verify read-only account-state rendering and absent-access behavior.

## 4. Verification and delivery

- [ ] 4.1 Run focused backend and frontend tests plus affected lint, architecture and build gates; record disposable-PostgreSQL concurrency test as pending without DB authorization.
- [ ] 4.2 Review scoped diff, complete OpenSpec task status and create `SGI_CP04_ACCOUNT_PERSON_LINKING_FINAL_REPORT`; verify no migration, reconciliation bulk write or BOARD-UI-02 change is included.

## Workflow follow-up

- Archive only after required review and any authorized disposable-PostgreSQL verification are complete.
