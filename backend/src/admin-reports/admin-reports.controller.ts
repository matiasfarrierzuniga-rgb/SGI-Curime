import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  CapabilityGuard,
  RequireCapabilities,
  UnsupportedOperationGuard,
  type AuthenticatedUser,
} from '../auth';
import { AdminReportsService } from './admin-reports.service';
import { AttendanceReportQueryDto } from './dto/report-query.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('admin-reports')
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
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  affiliates(@Req() req: AuthenticatedRequest) {
    return this.service.affiliatesSummary(this.generatedBy(req));
  }
  @Get('attendance-summary')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  attendance(
    @Query() q: AttendanceReportQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.attendanceSummary(q, this.generatedBy(req));
  }
  @Get('justifications-summary')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  justifications(@Req() req: AuthenticatedRequest) {
    return this.service.justificationsSummary(this.generatedBy(req));
  }
  @Get('sanctions-summary')
  @UseGuards(JwtAuthGuard, UnsupportedOperationGuard)
  sanctions(@Req() req: AuthenticatedRequest) {
    return this.service.sanctionsSummary(this.generatedBy(req));
  }

  private generatedBy(req: AuthenticatedRequest) {
    return { id: req.user.id, fullName: req.user.fullName };
  }
}
