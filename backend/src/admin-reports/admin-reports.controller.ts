import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/presentation/guards/roles.guard';
import { AdminReportsService } from './admin-reports.service';
import { AttendanceReportQueryDto } from './dto/report-query.dto';
@Controller('admin-reports')
@Roles('Administrador')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminReportsController {
  constructor(private readonly service: AdminReportsService) {}
  @Get('affiliates-summary') affiliates() {
    return this.service.affiliatesSummary();
  }
  @Get('attendance-summary') attendance(@Query() q: AttendanceReportQueryDto) {
    return this.service.attendanceSummary(q);
  }
  @Get('justifications-summary') justifications() {
    return this.service.justificationsSummary();
  }
  @Get('sanctions-summary') sanctions() {
    return this.service.sanctionsSummary();
  }
}
