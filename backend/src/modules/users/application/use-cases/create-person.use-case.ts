import { Inject, Injectable } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type PersonCreateData,
  type PersonCreateResult,
  type UsersRepository,
} from '../../domain/repositories/users-repository';

@Injectable()
export class CreatePersonUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repository: UsersRepository,
  ) {}

  execute(data: PersonCreateData): Promise<PersonCreateResult> {
    return this.repository.createPerson(data);
  }
}
