import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { InventoryAlertsController } from './inventory-alerts.controller';
import { InventoryAlertsService } from './inventory-alerts.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryAlertsController],
  providers: [InventoryAlertsService],
})
export class InventoryAlertsModule {}
