import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
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
