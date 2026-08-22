import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  async execute(id: number): Promise<User> {
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError();
    return user;
  }
}
