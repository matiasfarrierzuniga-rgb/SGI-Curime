import type { UsersRepository } from '../../domain/repositories/users-repository';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  const repository = { findPage: jest.fn() };
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListUsersUseCase(repository as unknown as UsersRepository);
  });

  it('delegates the query to the repository', async () => {
    const query = {
      name: 'ana',
      page: 2,
      limit: 5,
    };
    repository.findPage.mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      limit: 5,
    });

    const result = await useCase.execute(query);

    expect(repository.findPage).toHaveBeenCalledWith(query);
    expect(result).toEqual({ data: [], total: 0, page: 2, limit: 5 });
  });
});
