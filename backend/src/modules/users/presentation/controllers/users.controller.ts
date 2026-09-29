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
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  Roles,
  RolesGuard,
} from '../../../../auth';
import type { AuthenticatedUser } from '../../../../auth';
import { UserStatus } from '../../domain/entities/user';
import type { UserQuery } from '../../domain/repositories/users-repository';
import { ActivateUserUseCase } from '../../application/use-cases/activate-user.use-case';
import { ChangeUserRoleUseCase } from '../../application/use-cases/change-user-role.use-case';
import { DeactivateUserUseCase } from '../../application/use-cases/deactivate-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UnlockUserUseCase } from '../../application/use-cases/unlock-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { UpdateSubscriptionExpirationUseCase } from '../../application/use-cases/update-subscription-expiration.use-case';
import { ChangeRoleDto } from '../dto/change-role.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateIsActiveDto } from '../dto/update-is-active.dto';
import { UpdateSubscriptionExpirationDto } from '../dto/update-subscription-expiration.dto';
import {
  toAdminUserResponse,
  toUserResponse,
} from '../mappers/user-response.mapper';
import { toHttpError } from '../mappers/users-error.mapper';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, CapabilityGuard)
export class UsersController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly changeUserRole: ChangeUserRoleUseCase,
    private readonly activateUser: ActivateUserUseCase,
    private readonly deactivateUser: DeactivateUserUseCase,
    private readonly unlockUser: UnlockUserUseCase,
    private readonly updateSubscriptionExpiration: UpdateSubscriptionExpirationUseCase,
  ) {}

  @Get()
  @RequireCapabilities('usr.users.read')
  findAll(
    @Query() query: QueryUsersDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const page = await this.listUsers.execute(this.toQuery(query));
      return {
        data: page.data.map((user) => this.toAdminResponse(user, req.user)),
        total: page.total,
        page: page.page,
        limit: page.limit,
      };
    });
  }

  @Get('me')
  @Roles()
  me(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.run(async () => {
      const { user, affiliation } = await this.getUser.executeWithAffiliation(
        req.user.id,
      );
      return {
        ...toUserResponse(user),
        ...affiliation,
        permissionCodes: [...(req.user.permissionCodes ?? [])],
      };
    });
  }

  @Get(':id')
  @RequireCapabilities('usr.users.read')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const person = await this.getUser.executeAdminPerson(id);
      return this.toAdminResponse(person, req.user);
    });
  }

  @Patch(':id/is-active')
  @Roles('Administrador')
  updateIsActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIsActiveDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = dto.isActive
        ? await this.activateUser.execute(id, req.user.id, this.context(req))
        : await this.deactivateUser.execute(id, req.user.id, this.context(req));
      return toUserResponse(user);
    });
  }

  @Patch(':id/subscription-expiration')
  @Roles('Administrador')
  updateSubscriptionExpirationDate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionExpirationDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.updateSubscriptionExpiration.execute(
        id,
        new Date(dto.subscriptionExpirationDate),
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  @Patch(':id')
  @Roles('Administrador')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.updateUser.execute(
        id,
        dto,
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  @Patch(':id/role')
  @Roles('Administrador')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.changeUserRole.execute(
        id,
        dto.roleId,
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  @Patch(':id/activate')
  @Roles('Administrador')
  activate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.activateUser.execute(
        id,
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  @Patch(':id/deactivate')
  @Roles('Administrador')
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.deactivateUser.execute(
        id,
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  @Patch(':id/unlock')
  @Roles('Administrador')
  unlock(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: AuthenticatedUser },
  ) {
    return this.run(async () => {
      const user = await this.unlockUser.execute(
        id,
        req.user.id,
        this.context(req),
      );
      return toUserResponse(user);
    });
  }

  private toQuery(query: QueryUsersDto): UserQuery {
    return {
      name: query.name,
      email: query.email,
      identification: query.identification,
      status: query.status as UserStatus | undefined,
      roleId: query.roleId,
      blocked: query.blocked,
      page: query.page,
      limit: query.limit,
    };
  }

  private toAdminResponse(
    person: Parameters<typeof toAdminUserResponse>[0],
    actor: AuthenticatedUser,
  ) {
    return {
      ...toAdminUserResponse(person),
      actions: {
        read: actor.permissionCodes?.includes('usr.users.read') === true,
      },
    };
  }

  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      toHttpError(error);
    }
  }

  private context(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };
  }
}
