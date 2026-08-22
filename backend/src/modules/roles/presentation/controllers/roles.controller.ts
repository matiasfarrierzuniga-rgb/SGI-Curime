import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../../../../auth';
import { ListRolesUseCase } from '../../application/use-cases/list-roles.use-case';

@Controller('roles')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly listRoles: ListRolesUseCase) {}

  @Get()
  async findActive() {
    const roles = await this.listRoles.execute();
    return roles.map((role) => ({ id: role.id, name: role.name }));
  }
}
