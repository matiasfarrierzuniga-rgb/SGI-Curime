import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AffiliateRequestsController } from '../../../affiliate-requests/affiliate-requests.controller';
import { AffiliatesController } from '../../../affiliates/affiliates.controller';
import { AuditController } from '../../../audit/audit.controller';
import { InventoryAlertsController } from '../../../inventory-alerts/inventory-alerts.controller';
import { InventoryCategoriesController } from '../../../inventory-categories/inventory-categories.controller';
import { InventoryItemsController } from '../../../inventory-items/inventory-items.controller';
import { InventoryLoansController } from '../../../inventory-loans/inventory-loans.controller';
import { InventoryItemOperationsController } from '../../../inventory-movements/inventory-item-operations.controller';
import { InventoryMovementsController } from '../../../inventory-movements/inventory-movements.controller';
import { InventoryReportsController } from '../../../inventory-reports/inventory-reports.controller';
import { CAPABILITIES_KEY } from '../decorators/require-capabilities.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CapabilityGuard } from './capability.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function handler(controller: { prototype: object }, name: string): object {
  return Reflect.getOwnPropertyDescriptor(controller.prototype, name)
    ?.value as object;
}

describe('migrated controller authorization contracts', () => {
  it.each([
    [AffiliateRequestsController, 'findAll', 'adm.requests.read'],
    [AffiliateRequestsController, 'findOne', 'adm.requests.read'],
    [AffiliatesController, 'findAll', 'adm.affiliates.read'],
    [AffiliatesController, 'findOne', 'adm.affiliates.read'],
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

  it.each([
    [AffiliateRequestsController, 'approve', ['Administrador']],
    [AffiliateRequestsController, 'reject', ['Administrador']],
    [AffiliatesController, 'update', ['Administrador']],
    [AffiliatesController, 'activate', ['Administrador']],
    [AffiliatesController, 'deactivate', ['Administrador']],
    [
      InventoryCategoriesController,
      'create',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryCategoriesController,
      'update',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryItemsController,
      'create',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryItemsController,
      'update',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryLoansController,
      'create',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryLoansController,
      'return',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryLoansController,
      'cancel',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryItemOperationsController,
      'recordEntry',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryItemOperationsController,
      'recordExit',
      ['Administrador', 'Gestor de Inventario'],
    ],
    [
      InventoryItemOperationsController,
      'recordAdjustment',
      ['Administrador', 'Gestor de Inventario'],
    ],
  ])(
    '%s.%s retains legacy roles when no canonical capability exists',
    (controller, method, roles) => {
      const target = handler(controller, method);
      expect(Reflect.getMetadata(ROLES_KEY, target)).toEqual(roles);
      expect(Reflect.getMetadata(CAPABILITIES_KEY, target)).toBeUndefined();
      expect(Reflect.getMetadata(GUARDS_METADATA, target)).toEqual(
        expect.arrayContaining([JwtAuthGuard, RolesGuard]),
      );
    },
  );
});
