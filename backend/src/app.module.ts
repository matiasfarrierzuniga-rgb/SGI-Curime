import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserRequestsModule } from './user-requests/user-requests.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { RolesModule } from './roles/roles.module';
import { AffiliateRequestsModule } from './affiliate-requests/affiliate-requests.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { AssembliesModule } from './assemblies/assemblies.module';
import { AbsenceJustificationsModule } from './absence-justifications/absence-justifications.module';
import { SanctionsModule } from './sanctions/sanctions.module';
import { AdminReportsModule } from './admin-reports/admin-reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    UserRequestsModule,
    UsersModule,
    RolesModule,
    AffiliateRequestsModule,
    AffiliatesModule,
    AssembliesModule,
    AbsenceJustificationsModule,
    SanctionsModule,
    AdminReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
