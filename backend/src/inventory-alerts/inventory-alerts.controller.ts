import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import { InventoryAlertsService } from './inventory-alerts.service';

@Controller('inventory/alerts')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryAlertsController {
  constructor(private readonly alertsService: InventoryAlertsService) {}

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }
}
