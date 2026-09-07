import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { FinancialController } from './financial.controller';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialService } from './financial.service';

@Module({
  imports: [AuthModule],
  controllers: [FinancialController, FinancialMovementsController],
  providers: [FinancialService],
})
export class FinancialModule {}
