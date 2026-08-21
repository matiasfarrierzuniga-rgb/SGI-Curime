import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatesService } from './affiliates.service';
@Module({
  imports: [AuthModule],
  controllers: [AffiliatesController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
