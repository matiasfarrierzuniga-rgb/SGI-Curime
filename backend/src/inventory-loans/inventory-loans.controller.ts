import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  Roles,
  RolesGuard,
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { InventoryLoansService } from './inventory-loans.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/loans')
export class InventoryLoansController {
  constructor(private readonly loansService: InventoryLoansService) {}

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() dto: CreateLoanDto, @Req() req: AuthenticatedRequest) {
    return this.loansService.create(dto, req.user.id, this.context(req));
  }

  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @Get()
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/return')
  return(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnLoanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loansService.return(id, dto, req.user.id, this.context(req));
  }

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loansService.cancel(id, req.user.id, this.context(req));
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
