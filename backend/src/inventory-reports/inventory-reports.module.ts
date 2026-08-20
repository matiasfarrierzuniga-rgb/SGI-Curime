import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryReportsController } from './inventory-reports.controller';
import { InventoryReportsService } from './inventory-reports.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryReportsController],
  providers: [InventoryReportsService],
})
export class InventoryReportsModule {}
