import { Injectable } from '@nestjs/common';
import type { Role } from '../../domain/entities/role';
import type { RolesRepository } from '../../domain/repositories/roles-repository';

@Injectable()
export class ListRolesUseCase {
  constructor(private readonly repository: RolesRepository) {}

  execute(): Promise<Role[]> {
    return this.repository.findActive();
  }
}
