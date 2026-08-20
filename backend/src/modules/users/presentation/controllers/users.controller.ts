import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../auth/interfaces/authenticated-user.interface';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersService } from '../../application/users.service';

@Controller('users')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.usersService.update(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto, @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.usersService.changeRole(id, dto.roleId, req.user.id, this.context(req));
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.usersService.activate(id, req.user.id, this.context(req));
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.usersService.deactivate(id, req.user.id, this.context(req));
  }

  @Patch(':id/unlock')
  unlock(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { user: AuthenticatedUser }) {
    return this.usersService.unlock(id, req.user.id, this.context(req));
  }
  private context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
}
