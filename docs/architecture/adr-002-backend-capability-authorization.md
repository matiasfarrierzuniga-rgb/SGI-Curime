# ADR-002 — Backend Capability Authorization Strategy

## Status

Accepted

## Context

Frontend already projects capability visibility. Backend currently enforces
roles through `RolesGuard`. Future V3 modules need backend capability checks
without changing legacy authorization behavior.

## Decision

- Add centralized capability identifiers and role-to-capability mapping.
- Add `@RequireCapabilities(...)` and `CapabilityGuard` for incremental use.
- A capability-protected route requires every declared capability (`ALL`).
- Unknown role, unknown capability, missing authenticated user, or missing
  grant denies access.
- Routes without capability metadata are allowed so `CapabilityGuard` composes
  safely with existing guards; this does not grant access to protected routes.
- `RolesGuard` remains unchanged. Existing controllers remain role-based until
  their domain adopts capability authorization deliberately.

## Consequences

Backend is authoritative. Frontend visibility does not enforce access. Future
modules combine `JwtAuthGuard` and `CapabilityGuard` and declare capabilities
explicitly. Role mappings may expand only with an approved consumer.

## Rejected Alternatives

- Replace all `RolesGuard` usage now: broad behavioral migration without need.
- Trust frontend capability checks: not a security boundary.
