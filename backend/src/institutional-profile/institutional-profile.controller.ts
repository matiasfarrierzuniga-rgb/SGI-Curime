import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities, type AuthenticatedUser } from '../auth';
import { UpdateInstitutionalProfileDto } from './dto/update-institutional-profile.dto';
import { InstitutionalProfileService } from './institutional-profile.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('institutional-profile')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class InstitutionalProfileController {
  constructor(private readonly profile: InstitutionalProfileService) {}

  @Get()
  @RequireCapabilities('adm.institutional-profile.read')
  get() { return this.profile.get(); }

  @Patch()
  @RequireCapabilities('adm.institutional-profile.update')
  update(@Body() dto: UpdateInstitutionalProfileDto, @Req() req: AuthenticatedRequest) {
    return this.profile.update(dto, req.user.id, { ipAddress: req.ip, userAgent: req.get('user-agent') });
  }
}
