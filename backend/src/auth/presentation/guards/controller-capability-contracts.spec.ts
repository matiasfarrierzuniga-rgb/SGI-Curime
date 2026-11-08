import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AffiliateRequestsController } from '../../../affiliate-requests/affiliate-requests.controller';
import { AffiliatesController } from '../../../affiliates/affiliates.controller';
import { AuditController } from '../../../audit/audit.controller';
import { AdminReportsController } from '../../../admin-reports/admin-reports.controller';
import { InventoryAlertsController } from '../../../inventory-alerts/inventory-alerts.controller';
import { InventoryCategoriesController } from '../../../inventory-categories/inventory-categories.controller';
import { InventoryItemsController } from '../../../inventory-items/inventory-items.controller';
import { InventoryLoansController } from '../../../inventory-loans/inventory-loans.controller';
import { InventoryItemOperationsController } from '../../../inventory-movements/inventory-item-operations.controller';
import { InventoryMovementsController } from '../../../inventory-movements/inventory-movements.controller';
import { InventoryReportsController } from '../../../inventory-reports/inventory-reports.controller';
import { SanctionsController } from '../../../sanctions/sanctions.controller';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';
import { CapabilityGuard } from './capability.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnsupportedOperationGuard } from './unsupported-operation.guard';

function handler(controller: { prototype: object }, name: string): object {
  return Reflect.getOwnPropertyDescriptor(controller.prototype, name)
    ?.value as object;
}

describe('migrated controller authorization contracts', () => {
  it.each([
    [AffiliateRequestsController, 'findAll', 'padron.application.review'],
    [AffiliateRequestsController, 'findOne', 'padron.application.review'],
    [AffiliateRequestsController, 'approve', 'padron.application.approve'],
    [AffiliateRequestsController, 'reject', 'padron.application.approve'],
    [AffiliatesController, 'findAll', 'adm.affiliates.read'],
    [AffiliatesController, 'findOne', 'adm.affiliates.read'],
    [AffiliatesController, 'update', 'padron.affiliate.update'],
    [AffiliatesController, 'activate', 'padron.affiliate.status'],
    [AffiliatesController, 'deactivate', 'padron.affiliate.status'],
    [InventoryCategoriesController, 'findAll', 'inv.inventory.read'],
    [InventoryCategoriesController, 'findOne', 'inv.inventory.read'],
    [InventoryItemsController, 'findAll', 'inv.inventory.read'],
    [InventoryItemsController, 'findOne', 'inv.inventory.read'],
    [InventoryLoansController, 'findAll', 'inv.inventory.read'],
    [InventoryLoansController, 'findOne', 'inv.inventory.read'],
    [
      InventoryItemOperationsController,
      'findItemMovements',
      'inv.inventory.read',
    ],
  ])('%s.%s uses persisted capability %s', (controller, method, capability) => {
    const target = handler(controller, method);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, target)).toEqual([capability]);
    expect(Reflect.getMetadata(GUARDS_METADATA, target)).toEqual(
      expect.arrayContaining([JwtAuthGuard, CapabilityGuard]),
    );
  });

  it.each([
    ['create', 'padron.sanction.apply'],
    ['byAffiliate', 'padron.affiliate.read'],
    ['findAll', 'padron.affiliate.read'],
    ['findOne', 'padron.affiliate.read'],
    ['update', 'padron.sanction.apply'],
  ])('SanctionsController.%s uses persisted capability %s', (method, capability) => {
    expect(Reflect.getMetadata(CAPABILITIES_KEY, handler(SanctionsController, method))).toEqual([
      capability,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, SanctionsController)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);
  });

  it.each([
    [InventoryAlertsController, 'inv.inventory.read'],
    [InventoryMovementsController, 'inv.inventory.read'],
    [InventoryReportsController, 'inv.inventory.read'],
    [AuditController, 'aud.logs.read'],
  ])('%s uses persisted class capability %s', (controller, capability) => {
    expect(Reflect.getMetadata(CAPABILITIES_KEY, controller)).toEqual([
      capability,
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);
  });

  it('requires dashboard entry capability; data domains are isolated in the service', () => {
    const target = handler(AdminReportsController, 'dashboard');

    expect(Reflect.getMetadata(CAPABILITIES_KEY, target)).toEqual([
      'erp.dashboard.read',
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, target)).toEqual(
      expect.arrayContaining([JwtAuthGuard, CapabilityGuard]),
    );
  });

  it.each([
    [InventoryCategoriesController, 'create'],
    [InventoryCategoriesController, 'update'],
    [InventoryCategoriesController, 'activate'],
    [InventoryCategoriesController, 'deactivate'],
    [InventoryItemsController, 'create'],
    [InventoryItemsController, 'update'],
    [InventoryItemsController, 'activate'],
    [InventoryItemsController, 'deactivate'],
    [InventoryLoansController, 'create'],
    [InventoryLoansController, 'return'],
    [InventoryLoansController, 'cancel'],
    [InventoryItemOperationsController, 'recordEntry'],
    [InventoryItemOperationsController, 'recordExit'],
    [InventoryItemOperationsController, 'recordAdjustment'],
  ])(
    '%s.%s remains default-deny without an approved canonical capability',
    (controller, method) => {
      const target = handler(controller, method);
      expect(Reflect.getMetadata(CAPABILITIES_KEY, target)).toBeUndefined();
      expect(Reflect.getMetadata(GUARDS_METADATA, target)).toEqual(
        expect.arrayContaining([JwtAuthGuard, UnsupportedOperationGuard]),
      );
    },
  );
});
