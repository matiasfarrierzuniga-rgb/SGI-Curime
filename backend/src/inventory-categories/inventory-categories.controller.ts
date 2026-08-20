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
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/domain/entities/auth-user';
import { CreateInventoryCategoryDto } from './dto/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from './dto/update-inventory-category.dto';
import { QueryInventoryCategoriesDto } from './dto/query-inventory-categories.dto';
import { InventoryCategoriesService } from './inventory-categories.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('inventory/categories')
@Roles('Administrador', 'Gestor de Inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryCategoriesController {
  constructor(private readonly categoriesService: InventoryCategoriesService) {}

  @Post()
  create(
    @Body() dto: CreateInventoryCategoryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  findAll(@Query() query: QueryInventoryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
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
