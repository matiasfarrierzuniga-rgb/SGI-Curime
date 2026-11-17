import { UpdateDisplayNameUseCase } from './update-display-name.use-case';

describe('UpdateDisplayNameUseCase', () => {
  const repository = { updateDisplayName: jest.fn() };
  const useCase = new UpdateDisplayNameUseCase(repository as never);

  beforeEach(() => jest.clearAllMocks());

  it('updates only the authenticated account display name', async () => {
    repository.updateDisplayName.mockResolvedValue(true);

    await expect(useCase.execute(7, 'Ana Comunidad')).resolves.toEqual({
      displayName: 'Ana Comunidad',
    });
    expect(repository.updateDisplayName).toHaveBeenCalledWith(7, 'Ana Comunidad');
  });

  it('does not report success when the authenticated account is unavailable', async () => {
    repository.updateDisplayName.mockResolvedValue(false);

    await expect(useCase.execute(7, 'Ana Comunidad')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
