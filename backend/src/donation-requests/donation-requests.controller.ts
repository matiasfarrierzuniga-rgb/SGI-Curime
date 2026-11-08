import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../auth';
import { CloseDonationRequestDto } from './dto/close-donation-request.dto';
import { CreateDonationRequestDto } from './dto/create-donation-request.dto';
import { QueryDonationRequestsDto } from './dto/query-donation-requests.dto';
import { DonationRequestsService } from './donation-requests.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('public/donation-requests')
export class PublicDonationRequestsController {
  constructor(private readonly service: DonationRequestsService) {}
  @Post()
  @UseGuards(ThrottlerGuard)
  create(
    @Body() dto: CreateDonationRequestDto,
    @Headers('idempotency-key') key: string | undefined,
  ) {
    return this.service.create(dto, key);
  }
}

@Controller('donation-requests')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class DonationRequestsController {
  constructor(private readonly service: DonationRequestsService) {}
  @Get()
  @RequireCapabilities('don.requests.read')
  findAll(@Query() query: QueryDonationRequestsDto) {
    return this.service.findAll(query);
  }
  @Get(':id')
  @RequireCapabilities('don.requests.read')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id/review')
  @RequireCapabilities('don.requests.review')
  review(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.service.transition(id, 'IN_REVIEW', req.user.id);
  }
  @Patch(':id/reject')
  @RequireCapabilities('don.requests.review')
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CloseDonationRequestDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.transition(id, 'REJECTED', req.user.id, dto.reason);
  }
  @Patch(':id/cancel')
  @RequireCapabilities('don.requests.review')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CloseDonationRequestDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.transition(id, 'CANCELLED', req.user.id, dto.reason);
  }
}
