import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth';
import { PrismaModule } from './prisma/prisma.module';
import { UserRequestsModule } from './user-requests/user-requests.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './audit/audit.module';
import { RolesModule } from './modules/roles/roles.module';
import { AffiliateRequestsModule } from './affiliate-requests/affiliate-requests.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { AssembliesModule } from './assemblies/assemblies.module';
import { AbsenceJustificationsModule } from './absence-justifications/absence-justifications.module';
import { SanctionsModule } from './sanctions/sanctions.module';
import { AdminReportsModule } from './admin-reports/admin-reports.module';
import { InventoryCategoriesModule } from './inventory-categories/inventory-categories.module';
import { InventoryItemsModule } from './inventory-items/inventory-items.module';
import { InventoryMovementsModule } from './inventory-movements/inventory-movements.module';
import { InventoryLoansModule } from './inventory-loans/inventory-loans.module';
import { InventoryAlertsModule } from './inventory-alerts/inventory-alerts.module';
import { InventoryReportsModule } from './inventory-reports/inventory-reports.module';
import { EventsModule } from './events/events.module';
import { IdentityModule } from './identity/identity.module';
import { ReservationsModule } from './reservations/reservations.module';
import { FinancialModule } from './financial/financial.module';
import { DonationsModule } from './donations/donations.module';
import { InstitutionalProfileModule } from './institutional-profile/institutional-profile.module';
import { InstitutionalBoardModule } from './institutional-board/institutional-board.module';

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
    InventoryCategoriesModule,
    InventoryItemsModule,
    InventoryMovementsModule,
    InventoryLoansModule,
    InventoryAlertsModule,
    InventoryReportsModule,
    EventsModule,
    IdentityModule,
    ReservationsModule,
    FinancialModule,
    DonationsModule,
    InstitutionalProfileModule,
    InstitutionalBoardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
