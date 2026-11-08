import { Inject, Injectable } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type AccountPage,
  type UserQuery,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class ListAccountsUseCase {
  constructor(@Inject(USERS_REPOSITORY) private readonly repository: UsersRepository) {}

  execute(query: UserQuery): Promise<AccountPage> {
    return this.repository.findAccountsPage(query);
  }
}
