import { UserStatus } from '../../domain/entities/user';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { UsersRepository } from '../../domain/repositories/users-repository';
import { GetUserUseCase } from './get-user.use-case';

const domainUser = {
  id: 2,
  fullName: 'Persona Usuaria',
  identification: '2-2222',
  email: 'persona@example.com',
  phone: null,
  address: null,
  status: UserStatus.ACTIVE,
  lockedAt: null,
  roleId: 2,
  role: { id: 2, name: 'Tesorero', description: null, isActive: true },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('GetUserUseCase', () => {
  const repository = { findById: jest.fn() };
  let useCase: GetUserUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetUserUseCase(repository as unknown as UsersRepository);
  });

  it('returns the user when it exists', async () => {
    repository.findById.mockResolvedValue(domainUser);

    await expect(useCase.execute(2)).resolves.toEqual(domainUser);
    expect(repository.findById).toHaveBeenCalledWith(2);
  });

  it('throws UserNotFoundError for an unknown user', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute(99)).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
