import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FinancialModule } from '../financial/financial.module';
import { InventoryReportsModule } from '../inventory-reports/inventory-reports.module';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
@Module({
  imports: [AuthModule, FinancialModule, InventoryReportsModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService],
})
export class AdminReportsModule {}
