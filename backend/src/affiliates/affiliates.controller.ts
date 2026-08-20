import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/domain/entities/auth-user';
import { AffiliatesService } from './affiliates.service';
import { QueryAffiliatesDto } from './dto/query-affiliates.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('affiliates')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliatesController {
  constructor(private readonly service: AffiliatesService) {}
  @Get() findAll(@Query() q: QueryAffiliatesDto) {
    return this.service.findAll(q);
  }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAffiliateDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }
  @Patch(':id/activate') activate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.service.setStatus(id, 'ACTIVE', req.user.id, this.context(req));
  }
  @Patch(':id/deactivate') deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    return this.service.setStatus(
      id,
      'INACTIVE',
      req.user.id,
      this.context(req),
    );
  }
  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
