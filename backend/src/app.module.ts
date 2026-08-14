import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserRequestsModule } from './user-requests/user-requests.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, UserRequestsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
