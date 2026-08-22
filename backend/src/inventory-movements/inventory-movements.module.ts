import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { InventoryItemOperationsController } from './inventory-item-operations.controller';
import { InventoryMovementsController } from './inventory-movements.controller';
import { InventoryMovementsService } from './inventory-movements.service';

@Module({
  imports: [AuthModule],
  controllers: [
    InventoryItemOperationsController,
    InventoryMovementsController,
  ],
  providers: [InventoryMovementsService],
})
export class InventoryMovementsModule {}
