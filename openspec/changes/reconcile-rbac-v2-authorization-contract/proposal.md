# Proposal

## Why

The persisted development database contains an unversioned RBAC V2 role and permission set that diverges from the TypeScript authorization catalog, ERP admission policy, community-role identity, and remaining role-name guards. This causes safe but incorrect denials for valid persisted V2 assignments and leaves authorization behavior split across incompatible sources.

## What Changes

- Establish one versioned RBAC V2 capability catalog, retaining legacy identifiers during an explicit compatibility transition and rejecting unknown or unapproved persisted codes.
- **BREAKING for ERP eligibility:** separate active-account ERP admission from `Affiliate.ACTIVE`; active technical and institutional software roles can enter ERP only through approved role classification, while community accounts remain outside ERP.
- Canonicalize `ROLE_COMMUNITY_USER` as the technical community role and introduce a non-destructive data transition from legacy `Cuenta comunitaria` assignments.
- Replace verified role-name endpoint guards with persisted capability guards where an approved capability represents the same operation; retain explicitly documented role-name policy only until an approved capability exists.
- Align TypeScript policy, Prisma seed definitions, existing permission records, frontend access constants, tests, and operator migration procedure without automatically granting every persisted V2 permission.
- Preserve legacy account-request approval, activation tokens, sessions, software-role assignments, governance separation, and community self-service behavior.

## Capabilities

### New Capabilities
- `security/rbac-v2-authorization`: Defines canonical persisted RBAC V2 capabilities, ERP admission, community-role transition, legacy compatibility, and capability-first enforcement.

### Modified Capabilities
- `affiliate-requests`: Aligns administrative affiliate-request read access with the canonical persisted capability contract while retaining separate review authorization until explicitly approved.

## Impact

- Backend authorization policy, JWT account context, `CapabilityGuard`, selected controllers, Prisma role/permission seed source, and additive Prisma data migration.
- Frontend access capability declarations and route/action policy where they reference canonical identifiers.
- Existing PostgreSQL roles, permissions, and assignments require a forward-only, idempotent transition; no principal, token, session, or historical record is deleted.
- Related V2 references: CU-20, CU-21, CU-22 and institutional access roles remain `NOT_VERIFIED` because immutable V2 catalog evidence is absent locally.
