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
  type AuthenticatedUser,
} from '../auth';
import {
  CreateVolunteerOpportunityDto,
  QueryVolunteerOpportunitiesDto,
  UpdateVolunteerOpportunityDto,
} from './dto/volunteer-opportunity.dto';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

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

  private context(req: Request) {
    return { ipAddress: req.ip, userAgent: req.get('user-agent') };
  }
}
