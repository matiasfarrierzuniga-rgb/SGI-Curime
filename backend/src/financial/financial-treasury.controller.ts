import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CapabilityGuard, JwtAuthGuard, RequireCapabilities } from '../auth';
import { QueryTreasurySummaryDto } from './dto/query-treasury-summary.dto';
import { FinancialService } from './financial.service';

@Controller('financial/treasury')
@UseGuards(JwtAuthGuard, CapabilityGuard)
export class FinancialTreasuryController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  @RequireCapabilities('fin.movements.read', 'fin.charges.read')
  summary(@Query() query: QueryTreasurySummaryDto) {
    return this.financialService.summarizeTreasury(query);
  }
}
