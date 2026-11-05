import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  CapabilityGuard,
  RequireCapabilities,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '../auth';
import { AdminReportsService } from './admin-reports.service';
import { AttendanceReportQueryDto } from './dto/report-query.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('admin-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, CapabilityGuard)
  @RequireCapabilities('erp.dashboard.read')
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.service.dashboard(
      this.generatedBy(req),
      req.user.permissionCodes ?? [],
    );
  }
  @Get('affiliates-summary')
  @Roles('Administrador')
  affiliates(@Req() req: AuthenticatedRequest) {
    return this.service.affiliatesSummary(this.generatedBy(req));
  }
  @Get('attendance-summary')
  @Roles('Administrador')
  attendance(
    @Query() q: AttendanceReportQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.attendanceSummary(q, this.generatedBy(req));
  }
  @Get('justifications-summary')
  @Roles('Administrador')
  justifications(@Req() req: AuthenticatedRequest) {
    return this.service.justificationsSummary(this.generatedBy(req));
  }
  @Get('sanctions-summary')
  @Roles('Administrador')
  sanctions(@Req() req: AuthenticatedRequest) {
    return this.service.sanctionsSummary(this.generatedBy(req));
  }

  private generatedBy(req: AuthenticatedRequest) {
    return { id: req.user.id, fullName: req.user.fullName };
  }
}
