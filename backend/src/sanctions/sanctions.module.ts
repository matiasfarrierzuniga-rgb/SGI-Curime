import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { SanctionsController } from './sanctions.controller';
import { SanctionsService } from './sanctions.service';
@Module({
  imports: [AuthModule],
  controllers: [SanctionsController],
  providers: [SanctionsService],
})
export class SanctionsModule {}
