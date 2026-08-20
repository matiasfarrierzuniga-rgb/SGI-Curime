import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AbsenceJustificationsController } from './absence-justifications.controller';
import { AbsenceJustificationsService } from './absence-justifications.service';
@Module({
  imports: [AuthModule],
  controllers: [AbsenceJustificationsController],
  providers: [AbsenceJustificationsService],
})
export class AbsenceJustificationsModule {}
