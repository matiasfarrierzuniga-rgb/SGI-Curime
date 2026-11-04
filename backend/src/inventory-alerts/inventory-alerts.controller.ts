import { Controller, Get, UseGuards } from '@nestjs/common';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities } from '../auth';
import { InventoryAlertsService } from './inventory-alerts.service';

@Controller('inventory/alerts')
@RequireCapabilities('inv.inventory.read')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class InventoryAlertsController {
  constructor(private readonly alertsService: InventoryAlertsService) {}

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }
}
