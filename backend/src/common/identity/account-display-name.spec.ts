import {
  accountDisplayNameProjection,
  formatAccountDisplayName,
} from './account-display-name';

describe('account display-name presentation', () => {
  it('keeps the account display name when available', () => {
    expect(formatAccountDisplayName({ displayName: 'Nombre elegido', fullName: 'Nombre legado' })).toBe('Nombre elegido');
  });

  it('uses only the same account legacy snapshot before the safe fallback', () => {
    expect(formatAccountDisplayName({ displayName: '  ', fullName: ' Nombre histórico ' })).toBe('Nombre histórico');
    expect(accountDisplayNameProjection({ id: 7, displayName: null, fullName: null })).toEqual({ id: 7, displayName: 'Cuenta' });
  });
});
