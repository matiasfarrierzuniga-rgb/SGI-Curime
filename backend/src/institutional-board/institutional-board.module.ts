import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth';
import { InstitutionalBoardController } from './institutional-board.controller';
import { InstitutionalBoardService } from './institutional-board.service';
@Module({ imports: [AuthModule, AuditModule], controllers: [InstitutionalBoardController], providers: [InstitutionalBoardService] })
export class InstitutionalBoardModule {}
