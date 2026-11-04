import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
} from '../../../../auth';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';
import {
  getCanonicalRoleLabel,
  isCanonicalRoleCode,
} from '../../../../auth/domain/policies/canonical-role-catalog';

@Controller('roles')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class RolesController {
  constructor(private readonly listRoles: ListRolesUseCase) {}

  @Get()
  @RequireCapabilities('usr.roles.read')
  async findActive() {
    const roles = await this.listRoles.execute();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      label: isCanonicalRoleCode(role.name)
        ? getCanonicalRoleLabel(role.name)
        : role.name,
    }));
  }
}
