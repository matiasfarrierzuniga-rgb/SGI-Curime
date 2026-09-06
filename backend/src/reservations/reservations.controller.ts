import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationAvailabilityDto } from './dto/query-reservation-availability.dto';
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

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('availability')
  availability(@Query() query: QueryReservationAvailabilityDto) {
    return this.reservationsService.checkAvailability(query);
  }

  @Post()
  create(
    @Body() dto: CreateReservationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationsService.create(dto, req.user.id);
  }
}
