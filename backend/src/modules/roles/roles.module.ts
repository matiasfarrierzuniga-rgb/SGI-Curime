import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { ROLES_REPOSITORY } from './domain/repositories/roles-repository';
import { PrismaRolesRepository } from './infrastructure/prisma-roles.repository';
import { RolesController } from './presentation/controllers/roles.controller';

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [
    PrismaRolesRepository,
    { provide: ROLES_REPOSITORY, useExisting: PrismaRolesRepository },
    ListRolesUseCase,
  ],
})
export class RolesModule {}
