import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../domain/entities/role';
import {
  ROLES_REPOSITORY,
  type RolesRepository,
} from '../../domain/repositories/roles-repository';

@Injectable()
export class ListRolesUseCase {
  constructor(
    @Inject(ROLES_REPOSITORY)
    private readonly repository: RolesRepository,
  ) {}

  execute(): Promise<Role[]> {
    return this.repository.findActive();
  }
}
