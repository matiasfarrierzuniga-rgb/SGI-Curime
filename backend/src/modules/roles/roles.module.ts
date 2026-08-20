import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { PrismaRolesRepository } from './infrastructure/prisma-roles.repository';
import { RolesController } from './presentation/controllers/roles.controller';

@Module({
  imports: [AuthModule],
  controllers: [RolesController],
  providers: [PrismaRolesRepository, ListRolesUseCase],
})
export class RolesModule {}
