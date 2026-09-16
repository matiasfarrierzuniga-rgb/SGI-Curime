import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FinancialController } from './financial.controller';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialService } from './financial.service';
import { DinadecoReportsController } from './dinadeco-reports.controller';
import { DinadecoReportsService } from './dinadeco-reports.service';

@Module({
  imports: [AuthModule],
  controllers: [
    FinancialController,
    FinancialMovementsController,
    DinadecoReportsController,
  ],
  providers: [FinancialService, DinadecoReportsService],
  exports: [FinancialService],
})
export class FinancialModule {}
