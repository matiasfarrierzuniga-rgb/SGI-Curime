import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities } from '../auth';
import { AuditService } from './audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Controller('audit-logs')
@RequireCapabilities('aud.logs.read')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Get() findAll(@Query() query: QueryAuditLogsDto) {
    return this.audit.findAll(query);
  }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.audit.findOne(id);
  }
}
