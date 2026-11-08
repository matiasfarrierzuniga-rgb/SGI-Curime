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
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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
