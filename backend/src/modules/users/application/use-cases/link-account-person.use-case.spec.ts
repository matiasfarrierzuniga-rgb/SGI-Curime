import type { UsersRepository } from '../../domain/repositories/users-repository';
import { LinkAccountPersonUseCase } from './link-account-person.use-case';

describe('LinkAccountPersonUseCase', () => {
  const repository = { linkAccountToPerson: jest.fn() };
  const useCase = new LinkAccountPersonUseCase(repository as unknown as UsersRepository);

  beforeEach(() => jest.clearAllMocks());

  it('delegates only explicit account, Person and administrative evidence', async () => {
    const input = {
      userId: 7,
      personId: 12,
      actorId: 3,
      evidenceReference: 'ACTA-2026-014',
      reason: 'Revisión administrativa de identidad.',
    };
    repository.linkAccountToPerson.mockResolvedValue({ id: 7, personId: '12' });

    await expect(useCase.execute(input)).resolves.toMatchObject({ id: 7, personId: '12' });
    expect(repository.linkAccountToPerson).toHaveBeenCalledWith(input);
  });
});
