import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
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
