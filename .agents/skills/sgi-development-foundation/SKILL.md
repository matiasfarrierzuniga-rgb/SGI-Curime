---
name: sgi-development-foundation
description: Core development guardrails for SGI-Curime. Use for implementation, refactoring, bug fixes, architecture work, frontend/backend integration, testing, and quality validation in this repository.
---

# SGI Development Foundation

Apply these rules to all SGI-Curime development unless the task explicitly
defines a narrower or different contract.

## 1. Repository safety

Work only inside the currently opened SGI-Curime repository.

Before modifying code:
- check branch
- check HEAD
- check worktree
- fetch origin when baseline validation is required
- compare against the expected baseline supplied by the task

If unexpected local changes, Git operation state, or baseline drift exists:
STOP and report it.

Never perform automatically:
- destructive reset
- rebase
- merge of unrelated work
- force push
- dependency upgrades
- npm audit fix

Preserve existing local work.

## 2. Architecture

Frontend dependency direction:

app -> features -> shared

Rules:
- shared must not depend on features
- domain-specific code starts inside its feature
- move code to shared only after genuine domain independence is demonstrated
- TanStack Query owns server state
- avoid duplicating server state in local React state
- backend contracts are authoritative
- frontend authorization never replaces backend enforcement
- preserve default-deny authorization behavior
- legacy areas are NO_NEW_CODE unless the task explicitly performs controlled migration

Follow existing Architecture v2 conventions and architecture checks.

## 3. Implementation discipline

Prefer the smallest change that satisfies the requested phase.

Reuse established project patterns before inventing abstractions.

Use existing Foundation UI where appropriate.

Do not create generic abstractions such as DataTable or FilterBar until repeated
real use cases justify them.

Do not expand scope into adjacent modules unless required for correctness.

Do not invent:
- backend endpoints
- domain states
- capabilities
- business rules
- fields not present in the authoritative contract

## 4. Testing

Tests must isolate network dependencies.

Never allow real HTTP requests in unit, routing, or feature tests unless the task
explicitly defines an integration/e2e test.

For changed behavior:
- add focused tests
- test success and relevant error states
- preserve authorization behavior
- validate cache invalidation when mutations affect server state

Frontend UI must preserve:
- keyboard usability
- meaningful accessible names
- visible semantic state
- no color-only communication

## 5. Quality gate

After implementation:

1. run focused tests for the changed scope
2. run `npm run verify` from frontend when frontend is affected
3. run the corresponding backend tests/build when backend is affected
4. inspect final git diff
5. confirm no out-of-scope changes

Do not duplicate every verify subcommand unless diagnosing a failure.

A known non-blocking warning must not be treated as a new failure unless its
behavior changed.

## 6. Git completion

Commit only when:
- requested scope is complete
- tests pass
- quality gates pass
- final diff is clean in scope

Prefer one logical commit per implementation gate.

Do not push unless explicitly requested.

## 7. Reporting

Finish with a compact report containing only:

STATUS
BRANCH
HEAD_INITIAL
FILES_CHANGED
FOCUSED_TESTS
VERIFY_OR_RELEVANT_GATES
OUT_OF_SCOPE_CHANGES
COMMIT
HEAD_FINAL
WORKTREE_FINAL
READY_FOR_NEXT_PHASE

If blocked, report the blocker and stop instead of repairing unrelated state.
