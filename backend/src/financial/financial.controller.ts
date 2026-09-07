import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities, type AuthenticatedUser } from '../auth';
import { QueryFinancialChargesDto } from './dto/query-financial-charges.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { FinancialService } from './financial.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('financial/charges')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  @RequireCapabilities('fin.charges.read')
  findAll(@Query() query: QueryFinancialChargesDto) {
    return this.financialService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('fin.charges.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financialService.findOne(id);
  }

  @Post(':id/payments')
  @RequireCapabilities('fin.payments.record')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.recordPayment(id, dto, req.user.id);
  }
}
