import { IdentityLookupService } from './identity-lookup.service';

describe('IdentityLookupService — affiliation contract', () => {
  const service = new IdentityLookupService();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('provides editable structured names alongside the full name returned by Hacienda', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nombre: 'MARIA JOSE PEREZ LOPEZ',
        tipoIdentificacion: '01',
      }),
    } as Response);

    await expect(service.lookup('123456789')).resolves.toEqual({
      found: true,
      normalizedIdentification: '123456789',
      identificationType: 'NATIONAL',
      sourceIdentificationType: '01',
      nombreCompleto: 'MARIA JOSE PEREZ LOPEZ',
      suggestedNames: {
        firstName: 'MARIA JOSE',
        firstSurname: 'PEREZ',
        secondSurname: 'LOPEZ',
      },
    });
  });

  it('preserves the manual-entry fallback when Hacienda is unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable'));

    await expect(service.lookup('123456789')).resolves.toEqual(
      expect.objectContaining({
        found: false,
        normalizedIdentification: '123456789',
      }),
    );
  });
});
