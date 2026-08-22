import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import { QueryReportsDto } from './dto/query-reports.dto';
import { InventoryReportsService } from './inventory-reports.service';

@Controller('inventory/reports')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryReportsController {
  constructor(private readonly reportsService: InventoryReportsService) {}

  @Get('summary')
  summary() {
    return this.reportsService.summary();
  }

  @Get('stock')
  stock(@Query() query: QueryReportsDto) {
    return this.reportsService.stock(query);
  }

  @Get('movements')
  movements(@Query() query: QueryReportsDto) {
    return this.reportsService.movements(query);
  }

  @Get('loans')
  loans(@Query() query: QueryReportsDto) {
    return this.reportsService.loans(query);
  }
}
