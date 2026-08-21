import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@Controller('inventory/movements')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryMovementsController {
  constructor(private readonly movementsService: InventoryMovementsService) {}

  @Get()
  findAll(@Query() query: QueryMovementsDto) {
    return this.movementsService.findAll(query);
  }
}
