import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { AuditModule } from '../audit/audit.module';
import { InstitutionalProfileController } from './institutional-profile.controller';
import { InstitutionalProfileService } from './institutional-profile.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InstitutionalProfileController],
  providers: [InstitutionalProfileService],
})
export class InstitutionalProfileModule {}
