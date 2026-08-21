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
import { JwtAuthGuard, Roles, RolesGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import {
  CreateSanctionDto,
  QuerySanctionsDto,
  UpdateSanctionDto,
} from './dto/sanction.dto';
import { SanctionsService } from './sanctions.service';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller()
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SanctionsController {
  constructor(private readonly service: SanctionsService) {}
  @Post('affiliates/:id/sanctions') create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSanctionDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.create(id, dto, req.user.id, this.context(req));
  }
  @Get('affiliates/:id/sanctions') byAffiliate(
    @Param('id', ParseIntPipe) id: number,
    @Query() q: QuerySanctionsDto,
  ) {
    q.affiliateId = id;
    return this.service.findAll(q);
  }
  @Get('sanctions') findAll(@Query() q: QuerySanctionsDto) {
    return this.service.findAll(q);
  }
  @Get('sanctions/:id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch('sanctions/:id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSanctionDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }
  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
