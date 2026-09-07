import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  type AuthenticatedUser,
} from '../auth';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { QueryFinancialMovementSummaryDto } from './dto/query-financial-movement-summary.dto';
import { QueryFinancialMovementsDto } from './dto/query-financial-movements.dto';
import { FinancialService } from './financial.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('financial/movements')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class FinancialMovementsController {
  constructor(private readonly financialService: FinancialService) {}

  @Post()
  @RequireCapabilities('fin.movements.create')
  create(
    @Body() dto: CreateFinancialMovementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financialService.createMovement(
      dto,
      req.user.id,
      this.context(req),
    );
  }

  @Get()
  @RequireCapabilities('fin.movements.read')
  findAll(@Query() query: QueryFinancialMovementsDto) {
    return this.financialService.findMovements(query);
  }

  @Get('summary')
  @RequireCapabilities('fin.movements.read')
  summary(@Query() query: QueryFinancialMovementSummaryDto) {
    return this.financialService.summarizeMovements(query);
  }

  @Get(':id')
  @RequireCapabilities('fin.movements.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financialService.findMovement(id);
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
