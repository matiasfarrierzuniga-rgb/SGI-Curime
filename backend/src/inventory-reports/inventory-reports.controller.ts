import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '../auth';
import { QueryReportsDto } from './dto/query-reports.dto';
import { InventoryReportsService } from './inventory-reports.service';

@Controller('inventory/reports')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryReportsController {
  constructor(private readonly reportsService: InventoryReportsService) {}

  @Get('summary')
  summary(@Req() req: AuthenticatedRequest) {
    return this.reportsService.summary(this.generatedBy(req));
  }

  @Get('stock')
  stock(@Query() query: QueryReportsDto, @Req() req: AuthenticatedRequest) {
    return this.reportsService.stock(query, this.generatedBy(req));
  }

  @Get('movements')
  movements(@Query() query: QueryReportsDto, @Req() req: AuthenticatedRequest) {
    return this.reportsService.movements(query, this.generatedBy(req));
  }

  @Get('loans')
  loans(@Query() query: QueryReportsDto, @Req() req: AuthenticatedRequest) {
    return this.reportsService.loans(query, this.generatedBy(req));
  }

  private generatedBy(req: AuthenticatedRequest) {
    return { id: req.user.id, fullName: req.user.fullName };
  }
}

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
