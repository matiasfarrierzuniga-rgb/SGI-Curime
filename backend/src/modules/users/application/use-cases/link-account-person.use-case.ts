import { Inject, Injectable } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type AccountPersonLinkData,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class LinkAccountPersonUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  execute(data: AccountPersonLinkData) {
    return this.repository.linkAccountToPerson(data);
  }
}
