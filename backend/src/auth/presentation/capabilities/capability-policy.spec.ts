import {
  DONATION_CAPABILITIES,
  hasCapability,
} from './capability-policy';

describe('donation capability policy', () => {
  it('grants institutional profile administration only to Administrador', () => {
    for (const capability of ['adm.institutional-profile.read', 'adm.institutional-profile.update']) {
      expect(hasCapability('Administrador', capability)).toBe(true);
      expect(hasCapability('Tesorero', capability)).toBe(false);
      expect(hasCapability('Gestor de Inventario', capability)).toBe(false);
      expect(hasCapability('Vecino/Afiliado', capability)).toBe(false);
      expect(hasCapability('Subscription_L1', capability)).toBe(false);
    }
  });
  it('grants board capabilities only to Administrador', () => {
    for (const capability of ['adm.institutional-board.read', 'adm.institutional-board.manage']) {
      expect(hasCapability('Administrador', capability)).toBe(true);
      for (const role of ['Tesorero', 'Gestor de Inventario', 'Vecino/Afiliado']) expect(hasCapability(role, capability)).toBe(false);
    }
  });
  it('grants DINADECO reporting only to Administrador and Tesorero', () => {
    expect(hasCapability('Administrador', 'fin.dinadeco.read')).toBe(true);
    expect(hasCapability('Tesorero', 'fin.dinadeco.read')).toBe(true);
    expect(hasCapability('Gestor de Inventario', 'fin.dinadeco.read')).toBe(false);
    expect(hasCapability('Vecino/Afiliado', 'fin.dinadeco.read')).toBe(false);
  });

  it('grants every donation capability to Administrador', () => {
    for (const capability of Object.values(DONATION_CAPABILITIES)) {
      expect(hasCapability('Administrador', capability)).toBe(true);
    }
  });

  it('grants read, create, update, and cancel to Tesorero only', () => {
    expect(hasCapability('Tesorero', DONATION_CAPABILITIES.read)).toBe(true);
    expect(hasCapability('Tesorero', DONATION_CAPABILITIES.create)).toBe(true);
    expect(hasCapability('Tesorero', DONATION_CAPABILITIES.update)).toBe(true);
    expect(hasCapability('Tesorero', DONATION_CAPABILITIES.cancel)).toBe(true);
    expect(hasCapability('Tesorero', DONATION_CAPABILITIES.delete)).toBe(false);
  });

  it('denies donation capabilities to unassigned roles and unknown capabilities', () => {
    expect(
      hasCapability('Gestor de Inventario', DONATION_CAPABILITIES.read),
    ).toBe(false);
    expect(hasCapability('Administrador', 'don.donations.archive')).toBe(false);
  });
});
