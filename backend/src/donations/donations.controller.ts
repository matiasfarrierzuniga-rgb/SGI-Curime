import {
  Body,
  Controller,
  Delete,
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
  type AuthenticatedUser,
} from '../auth';
import { DONATION_CAPABILITIES } from '../auth/presentation/capabilities/capability-policy';
import { CancelDonationDto } from './dto/cancel-donation.dto';
import { CreateDonationDto } from './dto/create-donation.dto';
import { QueryDonationsDto } from './dto/query-donations.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { DonationsService } from './donations.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('donations')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @RequireCapabilities(DONATION_CAPABILITIES.create)
  create(@Body() dto: CreateDonationDto, @Req() req: AuthenticatedRequest) {
    return this.donationsService.create(dto, req.user.id, this.context(req));
  }

  @Get()
  @RequireCapabilities(DONATION_CAPABILITIES.read)
  findAll(@Query() query: QueryDonationsDto) {
    return this.donationsService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities(DONATION_CAPABILITIES.read)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.donationsService.findOne(id);
  }

  @Patch(':id')
  @RequireCapabilities(DONATION_CAPABILITIES.update)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDonationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.donationsService.update(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/cancel')
  @RequireCapabilities(DONATION_CAPABILITIES.cancel)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelDonationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.donationsService.cancel(id, dto, req.user.id, this.context(req));
  }

  @Delete(':id')
  @RequireCapabilities(DONATION_CAPABILITIES.delete)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: AuthenticatedRequest) {
    return this.donationsService.remove(id, req.user.id, this.context(req));
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
