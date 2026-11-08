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
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { InventoryItemsService } from './inventory-items.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/items')
export class InventoryItemsController {
  constructor(private readonly itemsService: InventoryItemsService) {}

  @Post()
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  create(
    @Body() dto: CreateInventoryItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() query: QueryInventoryItemsDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.update(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/activate')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  activate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.setActive(
      id,
      true,
      req.user.id,
      this.context(req),
    );
  }

  @Patch(':id/deactivate')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.setActive(
      id,
      false,
      req.user.id,
      this.context(req),
    );
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
