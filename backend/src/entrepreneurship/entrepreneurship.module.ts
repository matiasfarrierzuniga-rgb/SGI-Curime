import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth';
import { EntrepreneurshipController, PublicEntrepreneurshipController } from './entrepreneurship.controller';
import { EntrepreneurshipService } from './entrepreneurship.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [EntrepreneurshipController, PublicEntrepreneurshipController],
  providers: [EntrepreneurshipService],
})
export class EntrepreneurshipModule {}
