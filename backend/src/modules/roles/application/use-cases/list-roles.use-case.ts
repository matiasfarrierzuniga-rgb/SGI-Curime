import { Inject, Injectable } from '@nestjs/common';
import { ROLES_REPOSITORY } from '../../domain/repositories/roles-repository';
import type { Role } from '../../domain/entities/role';
import type { RolesRepository } from '../../domain/repositories/roles-repository';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLES_REPOSITORY) private readonly repository: RolesRepository) {}

  execute(): Promise<Role[]> {
    return this.repository.findActive();
  }
}
