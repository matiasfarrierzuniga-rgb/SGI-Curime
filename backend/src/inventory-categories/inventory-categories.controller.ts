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
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { QueryInventoryCategoriesDto } from './dto/query-inventory-categories.dto';
import { InventoryCategoriesService } from './inventory-categories.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/categories')
export class InventoryCategoriesController {
  constructor(private readonly categoriesService: InventoryCategoriesService) {}

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Body() dto: CreateInventoryCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.create(dto, req.user.id, this.context(req));
  }

  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @Get()
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() query: QueryInventoryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @Get(':id')
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.update(
      id,
      dto,
      req.user.id,
      this.context(req),
    );
  }

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/activate')
  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  activate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.setActive(
      id,
      true,
      req.user.id,
      this.context(req),
    );
  }

  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/deactivate')
  @Roles('Administrador', 'Gestor de Inventario')
  @UseGuards(JwtAuthGuard, RolesGuard)
  deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.setActive(
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
