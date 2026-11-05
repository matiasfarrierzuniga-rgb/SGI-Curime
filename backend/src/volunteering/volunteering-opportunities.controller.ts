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
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../auth';
import {
  CreateVolunteerOpportunityDto,
  CreateVolunteerSessionDto,
  QueryPublicVolunteerOpportunitiesDto,
  QueryVolunteerOpportunitiesDto,
  UpdateVolunteerOpportunityDto,
} from './dto/volunteer-opportunity.dto';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';
import {
  CreateVolunteerApplicationDto,
  ApproveVolunteerApplicationDto,
  RejectVolunteerApplicationDto,
} from './dto/volunteer-application.dto';
import { VolunteeringApplicationsService } from './volunteering-applications.service';

type AuthRequest = Request & { user: AuthenticatedUser };

@Controller('volunteering/opportunities')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class VolunteeringOpportunitiesController {
  constructor(private readonly service: VolunteeringOpportunitiesService) {}

  @Get()
  @RequireCapabilities('vol.opportunities.read')
  findAll(@Query() query: QueryVolunteerOpportunitiesDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequireCapabilities('vol.opportunities.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @RequireCapabilities('vol.opportunities.create')
  create(@Body() dto: CreateVolunteerOpportunityDto, @Req() req: AuthRequest) {
    return this.service.create(dto, req.user.id, this.context(req));
  }

  @Patch(':id')
  @RequireCapabilities('vol.opportunities.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVolunteerOpportunityDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user.id, this.context(req));
  }

  @Get(':id/sessions')
  @RequireCapabilities('vol.opportunities.read')
  sessions(@Param('id', ParseIntPipe) id: number) {
    return this.service.findSessions(id);
  }

  @Post(':id/sessions')
  @RequireCapabilities('vol.opportunities.update')
  addSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVolunteerSessionDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.addSession(id, dto, req.user.id, this.context(req));
  }

  @Patch(':id/publish')
  @RequireCapabilities('vol.opportunities.update')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.publish(id, req.user.id, this.context(req));
  }

  @Patch(':id/close')
  @RequireCapabilities('vol.opportunities.update')
  close(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
    return this.service.close(id, req.user.id, this.context(req));
  }

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}

@Controller('public/volunteering/opportunities')
export class PublicVolunteeringOpportunitiesController {
  constructor(
    private readonly service: VolunteeringOpportunitiesService,
    private readonly applications: VolunteeringApplicationsService,
  ) {}

  @Get()
  findAll(@Query() query: QueryPublicVolunteerOpportunitiesDto) {
    return this.service.findPublic(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPublicOne(id);
  }

  @Post(':id/applications')
  @UseGuards(ThrottlerGuard)
  apply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVolunteerApplicationDto,
    @Req() req: Request,
  ) {
    return this.applications.submit(id, dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}

@Controller('volunteering')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class VolunteeringApplicationsController {
  constructor(private readonly applications: VolunteeringApplicationsService) {}

  @Get('opportunities/:id/applications')
  @RequireCapabilities('vol.opportunities.read')
  list(@Param('id', ParseIntPipe) id: number) {
    return this.applications.list(id);
  }

  @Patch('applications/:id/approve')
  @RequireCapabilities('vol.opportunities.update')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveVolunteerApplicationDto,
    @Req() req: AuthRequest,
  ) {
    return this.applications.approve(id, dto, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  @Patch('applications/:id/reject')
  @RequireCapabilities('vol.opportunities.update')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectVolunteerApplicationDto,
    @Req() req: AuthRequest,
  ) {
    return this.applications.reject(id, dto, req.user.id, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}
