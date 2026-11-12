import type { UsersRepository } from '../../domain/repositories/users-repository';
import { CreatePersonUseCase } from './create-person.use-case';

const input = {
  identificationType: 'NATIONAL' as const,
  identification: '123456789',
  firstName: 'Ana',
  firstSurname: 'Pérez',
  actorId: 7,
  reason: 'Alta administrativa para aprovisionamiento RBAC.',
};

describe('CreatePersonUseCase', () => {
  const repository = { createPerson: jest.fn() };
  const useCase = new CreatePersonUseCase(
    repository as unknown as UsersRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('delegates canonical Person creation without assigning access', async () => {
    repository.createPerson.mockResolvedValue({
      personId: 12,
      created: true,
      person: { id: 12 },
    });

    await expect(useCase.execute(input)).resolves.toMatchObject({
      personId: 12,
      created: true,
    });
    expect(repository.createPerson).toHaveBeenCalledWith(input);
  });
});
