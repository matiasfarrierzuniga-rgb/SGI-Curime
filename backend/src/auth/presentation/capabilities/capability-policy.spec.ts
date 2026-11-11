import {
  hasPersistedCapability,
  isKnownCapability,
  RBAC_V2_CAPABILITIES,
} from './capability-policy';

describe('capability policy', () => {
  it('recognizes the reviewed V2 catalog and rejects unapproved codes', () => {
    expect(RBAC_V2_CAPABILITIES).toHaveLength(47);
    expect(isKnownCapability('system.rbac.manage')).toBe(true);
    expect(isKnownCapability('system.unapproved.manage')).toBe(false);
  });

  it('authorizes only persisted capability codes', () => {
    expect(hasPersistedCapability(['inv.inventory.read'], 'inv.inventory.read')).toBe(true);
    expect(hasPersistedCapability([], 'inv.inventory.read')).toBe(false);
    expect(hasPersistedCapability(['inv.inventory.read'], 'inventory.unapproved')).toBe(false);
  });
});
