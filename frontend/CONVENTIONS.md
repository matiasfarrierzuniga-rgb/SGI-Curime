# Frontend conventions

## Dependency boundaries

Dependencies flow from `app` to `features` to `shared`.

- `shared` must not depend on features.
- Features must use another feature's public API (`index.ts`), never its internals.
- `app` composes features through their public APIs.
- Server state belongs in TanStack Query; do not add parallel global state for it.

## Legacy zones

The following directories are legacy and follow `NO_NEW_CODE`:

- `src/pages`
- `src/services`
- `src/types`
- `src/components`

Allowed exceptions: urgent bug fixes, security fixes, temporary compatibility work, or an explicit module migration. Document the exception in its pull request.
