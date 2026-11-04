import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities } from '../auth';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { InventoryMovementsService } from './inventory-movements.service';

@Controller('inventory/movements')
@RequireCapabilities('inv.inventory.read')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class InventoryMovementsController {
  constructor(private readonly movementsService: InventoryMovementsService) {}

  @Get()
  findAll(@Query() query: QueryMovementsDto) {
    return this.movementsService.findAll(query);
  }
}
