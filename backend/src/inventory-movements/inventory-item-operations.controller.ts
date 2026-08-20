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
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/domain/entities/auth-user';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { CreateEntryDto } from './dto/create-entry.dto';
import { CreateExitDto } from './dto/create-exit.dto';
import { QueryMovementsDto } from './dto/query-movements.dto';
import { InventoryMovementsService } from './inventory-movements.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/items')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryItemOperationsController {
  constructor(private readonly movementsService: InventoryMovementsService) {}

  @Post(':id/entries')
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
