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
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
} from '../auth';
import type { AuthenticatedUser } from '../auth';
import { AffiliatesService } from './affiliates.service';
import { QueryAffiliatesDto } from './dto/query-affiliates.dto';
import { UpdateAffiliateDto } from './dto/update-affiliate.dto';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly service: AffiliatesService) {}
  @Get()
  @RequireCapabilities('adm.affiliates.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() q: QueryAffiliatesDto) {
    return this.service.findAll(q);
  }
  @Get(':id')
  @RequireCapabilities('adm.affiliates.read')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch(':id')
  @RequireCapabilities('padron.affiliate.update')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAffiliateDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }
  @Patch(':id/activate')
  @RequireCapabilities('padron.affiliate.status')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  activate(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.setStatus(id, 'ACTIVE', req.user.id, this.context(req));
  }
  @Patch(':id/deactivate')
  @RequireCapabilities('padron.affiliate.status')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  deactivate(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.deactivate(id, req.user.id, this.context(req));
  }
  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
