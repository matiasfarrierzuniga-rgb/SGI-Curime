import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ActivationTokenDeliveryService } from './activation-token-delivery.service';
import { ActivationTokenService } from './activation-token.service';
import { UserRequestsController } from './user-requests.controller';
import { UserRequestsService } from './user-requests.service';

@Module({
  imports: [AuthModule],
  controllers: [UserRequestsController],
  providers: [
    UserRequestsService,
    ActivationTokenService,
    ActivationTokenDeliveryService,
  ],
})
export class UserRequestsModule {}
