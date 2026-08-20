import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryLoansController } from './inventory-loans.controller';
import { InventoryLoansService } from './inventory-loans.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryLoansController],
  providers: [InventoryLoansService],
})
export class InventoryLoansModule {}
