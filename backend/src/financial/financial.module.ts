import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { InstitutionalProfileModule } from '../institutional-profile/institutional-profile.module';
import { FinancialController } from './financial.controller';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialService } from './financial.service';
import { DinadecoReportsController } from './dinadeco-reports.controller';
import { DinadecoReportsService } from './dinadeco-reports.service';
import { FinancialTreasuryController } from './financial-treasury.controller';

@Module({
  imports: [AuthModule, InstitutionalProfileModule],
  controllers: [
    FinancialController,
    FinancialMovementsController,
    DinadecoReportsController,
    FinancialTreasuryController,
  ],
  providers: [FinancialService, DinadecoReportsService],
  exports: [FinancialService],
})
export class FinancialModule {}
