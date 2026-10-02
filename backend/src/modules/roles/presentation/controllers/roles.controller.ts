import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  RolesGuard,
} from '../../../../auth';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, CapabilityGuard)
export class RolesController {
  constructor(private readonly listRoles: ListRolesUseCase) {}

  @Get()
  @RequireCapabilities('usr.roles.read')
  async findActive() {
    const roles = await this.listRoles.execute();
    return roles.map((role) => ({ id: role.id, name: role.name }));
  }
}
