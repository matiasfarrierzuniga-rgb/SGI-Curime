import { CAPABILITIES, CAPABILITY_CATALOG } from './capabilities';
import {
  resolveCapabilitiesForRole,
  ROLE_CAPABILITIES,
  UNIVERSAL_AUTHENTICATED_CAPABILITIES,
} from './role-capabilities.policy';
import { LEGACY_ROLE_NAMES, ROLE_NAMES } from './roles';

const ADMINISTRATIVE_PREFIXES = ['adm.', 'aud.', 'inv.'];

function hasAdministrativeCapability(capabilities: readonly string[]): boolean {
  return capabilities.some((capability) =>
    ADMINISTRATIVE_PREFIXES.some((prefix) => capability.startsWith(prefix)),
  );
}

describe('role capabilities policy', () => {
  it('grants every catalog capability to Administrador', () => {
    expect(resolveCapabilitiesForRole(ROLE_NAMES.ADMIN)).toEqual(
      CAPABILITY_CATALOG,
    );
  });

  it('limits Gestor de Inventario to dashboard, profile and inventory', () => {
    const capabilities = resolveCapabilitiesForRole(
      ROLE_NAMES.INVENTORY_MANAGER,
    );

    expect(capabilities).toEqual([
      CAPABILITIES.PROFILE_READ,
      CAPABILITIES.ERP_DASHBOARD_READ,
      CAPABILITIES.INVENTORY_READ,
      CAPABILITIES.INVENTORY_MANAGE,
    ]);
    expect(capabilities).not.toContain(CAPABILITIES.USERS_MANAGE);
    expect(capabilities).not.toContain(CAPABILITIES.AFFILIATES_MANAGE);
  });

  it('gives Usuario only universal account capabilities', () => {
    const capabilities = resolveCapabilitiesForRole(ROLE_NAMES.USER);

    expect(capabilities).toEqual(UNIVERSAL_AUTHENTICATED_CAPABILITIES);
    expect(hasAdministrativeCapability(capabilities)).toBe(false);
    expect(capabilities).not.toContain(CAPABILITIES.INVENTORY_READ);
    expect(capabilities).not.toContain(CAPABILITIES.AUDIT_LOGS_READ);
  });

  it('keeps legacy Vecino/Afiliado at the safe Usuario level', () => {
    const capabilities = resolveCapabilitiesForRole(
      LEGACY_ROLE_NAMES.COMMUNITY_MEMBER,
    );

    expect(capabilities).toEqual(UNIVERSAL_AUTHENTICATED_CAPABILITIES);
    expect(hasAdministrativeCapability(capabilities)).toBe(false);
  });

  it('does not invent operational or financial permissions for Tesorero', () => {
    expect(resolveCapabilitiesForRole(ROLE_NAMES.TREASURER)).toEqual(
      UNIVERSAL_AUTHENTICATED_CAPABILITIES,
    );
  });

  it('denies unknown and missing roles by default', () => {
    expect(resolveCapabilitiesForRole('Rol inventado')).toEqual([]);
    expect(resolveCapabilitiesForRole(null)).toEqual([]);
    expect(resolveCapabilitiesForRole(undefined)).toEqual([]);
  });

  it('contains no duplicate capabilities in the official catalog', () => {
    expect(new Set(CAPABILITY_CATALOG).size).toBe(CAPABILITY_CATALOG.length);
  });

  it('only returns capabilities from the official catalog', () => {
    const catalog = new Set<string>(CAPABILITY_CATALOG);

    for (const capabilities of Object.values(ROLE_CAPABILITIES)) {
      expect(capabilities.every((capability) => catalog.has(capability))).toBe(
        true,
      );
    }
  });
});
