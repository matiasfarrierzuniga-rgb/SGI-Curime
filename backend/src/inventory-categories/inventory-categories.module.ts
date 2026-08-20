import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryCategoriesController } from './inventory-categories.controller';
import { InventoryCategoriesService } from './inventory-categories.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryCategoriesController],
  providers: [InventoryCategoriesService],
})
export class InventoryCategoriesModule {}
