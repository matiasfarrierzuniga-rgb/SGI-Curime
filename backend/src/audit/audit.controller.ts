import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit-logs') @Roles('Administrador') @UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get() findAll(@Query() query: QueryAuditLogsDto) { return this.audit.findAll(query); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.audit.findOne(id); }
}
