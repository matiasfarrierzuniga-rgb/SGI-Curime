import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserRequestsModule } from './user-requests/user-requests.module';

@Module({
  imports: [PrismaModule, AuthModule, UserRequestsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
