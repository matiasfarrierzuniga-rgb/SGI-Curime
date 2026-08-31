import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities, type AuthenticatedUser } from '../auth';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { EventsService } from './events.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('events')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @RequireCapabilities('pub.events.manage')
  findAll() { return this.service.findAll(); }

  @Post()
  @RequireCapabilities('pub.events.manage')
  create(@Body() dto: CreateEventDto, @Req() req: AuthRequest) { return this.service.create(dto, req.user.id, this.context(req)); }

  @Patch(':id')
  @RequireCapabilities('pub.events.manage')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto, @Req() req: AuthRequest) { return this.service.update(id, dto, req.user.id, this.context(req)); }

  @Patch(':id/publish')
  @RequireCapabilities('pub.events.publish')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) { return this.service.publish(id, req.user.id, this.context(req)); }

  @Patch(':id/archive')
  @RequireCapabilities('pub.events.publish')
  archive(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) { return this.service.archive(id, req.user.id, this.context(req)); }

  private context(req: Request) { return { ipAddress: req.ip, userAgent: req.get('user-agent') }; }
}

@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  findAll() { return this.service.findPublic(); }
}
