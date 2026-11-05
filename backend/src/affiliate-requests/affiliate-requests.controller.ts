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
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateAffiliateRequestDto } from './dto/create-affiliate-request.dto';
import { QueryAffiliateRequestsDto } from './dto/query-affiliate-requests.dto';
import { RejectAffiliateRequestDto } from './dto/review-affiliate-request.dto';
import { AffiliateRequestsService } from './affiliate-requests.service';
type AuthRequest = Request & { user: AuthenticatedUser };
@Controller('affiliate-requests')
export class AffiliateRequestsController {
  constructor(private readonly service: AffiliateRequestsService) {}
  @Post() @UseGuards(ThrottlerGuard) create(
    @Body() dto: CreateAffiliateRequestDto,
    @Req() req: Request,
  ) {
    return this.service.create(dto, this.context(req));
  }
  @Get()
  @RequireCapabilities('padron.application.review')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findAll(@Query() query: QueryAffiliateRequestsDto) {
    return this.service.findAll(query);
  }
  @Get(':id')
  @RequireCapabilities('padron.application.review')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
  @Patch(':id/approve')
  @RequireCapabilities('padron.application.approve')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  approve(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.approve(id, req.user.id, this.context(req));
  }
  @Patch(':id/reject')
  @RequireCapabilities('padron.application.approve')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectAffiliateRequestDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.reject(
      id,
      dto.rejectionReason,
      req.user.id,
      this.context(req),
    );
  }
  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
