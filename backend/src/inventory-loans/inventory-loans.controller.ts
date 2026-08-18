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
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
import { InventoryLoansService } from './inventory-loans.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/loans')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryLoansController {
  constructor(private readonly loansService: InventoryLoansService) {}

  @Post()
  create(@Body() dto: CreateLoanDto, @Req() req: AuthenticatedRequest) {
    return this.loansService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @Patch(':id/return')
  return(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnLoanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loansService.return(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.loansService.cancel(id, req.user.id, this.context(req));
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
