import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import {
  CapabilityGuard,
  JwtAuthGuard,
  RequireCapabilities,
  type AuthenticatedUser,
} from '../auth';
import { DinadecoReportsService } from './dinadeco-reports.service';
import { QueryDinadecoAnnualReportDto } from './dto/query-dinadeco-annual-report.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('financial/reports/dinadeco')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class DinadecoReportsController {
  constructor(private readonly reports: DinadecoReportsService) {}

  @Get('annual')
  @RequireCapabilities('fin.dinadeco.read')
  annual(
    @Query() query: QueryDinadecoAnnualReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reports.annual(query.year, {
      id: req.user.id,
      fullName: req.user.fullName,
    });
  }
}
