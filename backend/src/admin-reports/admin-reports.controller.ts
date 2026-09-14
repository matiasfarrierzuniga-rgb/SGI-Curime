import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  JwtAuthGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '../auth';
import { AdminReportsService } from './admin-reports.service';
import { AttendanceReportQueryDto } from './dto/report-query.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('admin-reports')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}
  @Get('dashboard') dashboard(@Req() req: AuthenticatedRequest) {
    return this.service.dashboard(this.generatedBy(req));
  }
  @Get('affiliates-summary') affiliates(@Req() req: AuthenticatedRequest) {
    return this.service.affiliatesSummary(this.generatedBy(req));
  }
  @Get('attendance-summary') attendance(
    @Query() q: AttendanceReportQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.attendanceSummary(q, this.generatedBy(req));
  }
  @Get('justifications-summary') justifications(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.justificationsSummary(this.generatedBy(req));
  }
  @Get('sanctions-summary') sanctions(@Req() req: AuthenticatedRequest) {
    return this.service.sanctionsSummary(this.generatedBy(req));
  }

  private generatedBy(req: AuthenticatedRequest) {
    return { id: req.user.id, fullName: req.user.fullName };
  }
}
