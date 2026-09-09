import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  imports: [AuthModule],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule {}
