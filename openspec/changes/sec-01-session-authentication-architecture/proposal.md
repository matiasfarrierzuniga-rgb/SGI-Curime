# Proposal

## Why

SGI-Curime already persists and rotates server-side refresh sessions, but login and refresh responses also expose the refresh credential in JSON while the browser retains the access token in Web Storage. SEC-01 must establish one approved frontend/backend contract, control intentional compatibility breaks and preserve account lifecycle rules before authentication behavior changes.

## What Changes

- Define the target browser session contract for login, refresh, logout, reload recovery, expiration and revocation.
- **BREAKING:** remove refresh credentials from login/refresh response bodies and refresh/logout request bodies for every current alias. No confidential legacy client is evidenced, so SEC-01 does not retain a browser-selectable compatibility mode.
- Move the browser access token from `sessionStorage` to memory and recover a session after reload through cookie-backed refresh followed by authoritative user retrieval.
- Define cookie, origin, CORS, CSRF, rotation, invalid-credential rejection and concurrent-refresh requirements without claiming unsupported replay-family detection.
- Propose a 30-day absolute refresh maximum plus a separately approved inactivity expiry; distinguish rollout observation from recovery objectives.
- Define revocation behavior for logout, password change/reset and account deactivation while preserving backend authority and current RBAC behavior.
- Define an incremental deployment sequence, safe rollback criteria and security certification gates that never restore browser-visible refresh credentials.
- Preserve existing endpoint aliases during transition unless a later approved implementation task proves a versioned replacement necessary.
- Define immediate account-wide bearer invalidation, individual and global logout behavior, concurrent-session policy and canonical password-change fields.
- Require focused evidence that generation validation rejects already-issued access tokens after account-wide invalidation; static design intent is not certification.
- Mark the target architecture and all implementation work as **PROPOSED** until human architectural approval and a separate `APPLY` authorization.

## Capabilities

### New Capabilities

- `security/session-authentication`: Browser and API session lifecycle, credential transport and storage, renewal, revocation, compatibility and security controls.

### Modified Capabilities

None.

## Impact

- Future backend implementation: auth controller response shaping, refresh-cookie policy, origin/CSRF enforcement, session rotation and revocation behavior.
- Future frontend implementation: `AuthContext`, HTTP interceptor, session storage boundary, login/reload/logout recovery and error handling.
- API compatibility: current `/login`, `/refresh`, `/logout`, `/auth/*`, `/users/me` and `/auth/me` consumers require a staged transition; body-refresh test contracts will intentionally break.
- Security operations: deployment-specific `Secure`, `SameSite`, trusted origin and CORS configuration require explicit certification.
- Future API scope may add an authenticated global-logout operation after approval; no endpoint or executable change occurs in PROPOSE.
- No Prisma, RBAC, Inventario, ERP, dependency or executable-code change is authorized by this proposal. Replay-family persistence is explicitly excluded from the preferred design.
