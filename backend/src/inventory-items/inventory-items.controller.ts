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
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryItemsDto } from './dto/query-inventory-items.dto';
import { InventoryItemsService } from './inventory-items.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/items')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryItemsController {
  constructor(private readonly itemsService: InventoryItemsService) {}

  @Post()
  create(
    @Body() dto: CreateInventoryItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  findAll(@Query() query: QueryInventoryItemsDto) {
    return this.itemsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.itemsService.update(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/activate')
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
