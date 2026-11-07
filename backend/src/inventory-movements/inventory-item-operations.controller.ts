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
  UnsupportedOperationGuard,
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateExitDto } from './dto/create-exit.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { InventoryMovementsService } from './inventory-movements.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/items')
export class InventoryItemOperationsController {
  constructor(private readonly movementsService: InventoryMovementsService) {}

  @Post(':id/entries')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  recordEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEntryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movementsService.recordEntry(
      id,
      dto,
      req.user.id,
      this.context(req),
    );
  }

  @Post(':id/exits')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  recordExit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateExitDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movementsService.recordExit(
      id,
      dto,
      req.user.id,
      this.context(req),
    );
  }

  @Post(':id/adjustments')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  recordAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAdjustmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.movementsService.recordAdjustment(
      id,
      dto,
      req.user.id,
      this.context(req),
    );
  }

  @Get(':id/movements')
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findItemMovements(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryMovementsDto,
  ) {
    return this.movementsService.findItemMovements(id, query);
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
