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
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { QueryInventoryCategoriesDto } from './dto/query-inventory-categories.dto';
import { InventoryCategoriesService } from './inventory-categories.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/categories')
export class InventoryCategoriesController {
  constructor(private readonly categoriesService: InventoryCategoriesService) {}

  @Post()
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  create(
    @Body() dto: CreateInventoryCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() query: QueryInventoryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('inv.inventory.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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

  @Patch(':id/activate')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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

  @Patch(':id/deactivate')
  @RequireCapabilities('inventory.item.manage')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
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
