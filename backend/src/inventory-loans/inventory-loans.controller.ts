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
  UnsupportedOperationGuard,
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

  @Post()
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  create(@Body() dto: CreateLoanDto, @Req() req: AuthenticatedRequest) {
    return this.loansService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() query: QueryLoansDto) {
    return this.loansService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loansService.findOne(id);
  }

  @Patch(':id/return')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  return(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnLoanDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loansService.return(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
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
