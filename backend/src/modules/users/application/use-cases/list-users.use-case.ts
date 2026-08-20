import { Injectable } from '@nestjs/common';
import type {
  UserPage,
  UserQuery,
  UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly repository: UsersRepository) {}

  execute(query: UserQuery): Promise<UserPage> {
    return this.repository.findPage(query);
  }
}
