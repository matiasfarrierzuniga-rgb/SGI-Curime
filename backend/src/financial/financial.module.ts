import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';

@Module({
  imports: [AuthModule],
  controllers: [FinancialController],
  providers: [FinancialService],
})
export class FinancialModule {}
