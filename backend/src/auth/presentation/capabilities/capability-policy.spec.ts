import {
  DONATION_CAPABILITIES,
  hasCapability,
} from './capability-policy';

describe('donation capability policy', () => {
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
