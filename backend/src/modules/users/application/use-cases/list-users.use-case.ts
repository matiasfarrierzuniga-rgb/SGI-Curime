import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../domain/repositories/users-repository';
import type {
  UserPage,
  UserQuery,
  UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly repository: UsersRepository) {}

  execute(query: UserQuery): Promise<UserPage> {
    return this.repository.findPage(query);
  }
}
