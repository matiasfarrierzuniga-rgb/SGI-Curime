import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { UsersController } from './presentation/controllers/users.controller';
import { UsersService } from './application/users.service';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaUsersRepository],
})
export class UsersModule {}
