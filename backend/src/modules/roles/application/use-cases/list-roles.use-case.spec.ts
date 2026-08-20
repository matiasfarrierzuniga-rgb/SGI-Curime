import type { Role } from '../../domain/entities/role';
import { ListRolesUseCase } from './list-roles.use-case';

describe('ListRolesUseCase', () => {
  const repository = { findActive: jest.fn() };
  let useCase: ListRolesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListRolesUseCase(repository);
  });

  it('returns the active roles from the repository', async () => {
    const roles: Role[] = [
      { id: 1, name: 'Administrador', description: null, isActive: true },
    ];
    repository.findActive.mockResolvedValue(roles);

    const result = await useCase.execute();

    expect(repository.findActive).toHaveBeenCalledTimes(1);
    expect(result).toEqual(roles);
  });
});
