import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { PrismaRolesRepository } from './infrastructure/prisma-roles.repository';
import { RolesController } from './presentation/controllers/roles.controller';
import { ROLES_REPOSITORY } from './domain/repositories/roles-repository';

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [PrismaRolesRepository, { provide: ROLES_REPOSITORY, useExisting: PrismaRolesRepository }, ListRolesUseCase],
})
export class RolesModule {}
