import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
@Module({
  imports: [AuthModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService],
})
export class AdminReportsModule {}
