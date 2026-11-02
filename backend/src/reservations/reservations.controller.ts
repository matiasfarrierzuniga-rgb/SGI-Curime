import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities, type AuthenticatedUser } from '../auth';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationAvailabilityDto } from './dto/query-reservation-availability.dto';
import { QueryPublicReservationOccupancyDto } from './dto/public-reservations.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { RejectReservationDto } from './dto/reject-reservation.dto';
import { ReservationsService } from './reservations.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('reservable-resources')
@UseGuards(JwtAuthGuard)
export class ReservableResourcesController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  findActive() {
    return this.reservationsService.findActiveResources();
  }
}

@Controller('public/reservations')
@UseGuards(ThrottlerGuard)
export class PublicReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('resources')
  findActiveResources() {
    return this.reservationsService.findPublicActiveResources();
  }

  @Get('occupancy')
  occupancy(@Query() query: QueryPublicReservationOccupancyDto) {
    return this.reservationsService.findPublicOccupancy(query);
  }

  @Get('availability')
  availability(@Query() query: QueryReservationAvailabilityDto) {
    return this.reservationsService.checkAvailability(query);
  }
}

@Controller('reservations')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('availability')
  availability(@Query() query: QueryReservationAvailabilityDto) {
    return this.reservationsService.checkAvailability(query);
  }

  @Get()
  @RequireCapabilities('res.reservations.read')
  findAll(@Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('res.reservations.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.create(dto, req.user.id);
  }

  @Patch(':id/approve')
  @RequireCapabilities('res.reservations.approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @RequireCapabilities('res.reservations.reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectReservationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.reject(id, dto.rejectionReason, req.user.id);
  }

  @Patch(':id/cancel')
  @RequireCapabilities('res.reservations.cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.cancel(id);
  }
}
