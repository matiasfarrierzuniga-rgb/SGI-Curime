import { Inject, Injectable } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class ListPersonLinkCandidatesUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  execute(query: string) {
    return this.repository.findLinkablePersonCandidates(query);
  }
}
