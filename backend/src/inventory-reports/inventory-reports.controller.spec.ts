import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard, RolesGuard } from '../auth';
import { ROLES_KEY } from '../auth/presentation/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth';
import { InventoryReportsController } from './inventory-reports.controller';
import type { InventoryReportsService } from './inventory-reports.service';

describe('InventoryReportsController', () => {
  const reportsService = {
    summary: jest.fn(),
    stock: jest.fn(),
    movements: jest.fn(),
    loans: jest.fn(),
  };
  const controller = new InventoryReportsController(
    reportsService as unknown as InventoryReportsService,
  );
  const request = {
    user: {
      id: 7,
      fullName: 'Persona Gestora',
      email: 'gestora@example.com',
      status: 'ACTIVE',
      role: 'Gestor de Inventario',
      canAccessErp: true,
    } satisfies AuthenticatedUser,
  };
  const query = { page: 1, limit: 20 };

  beforeEach(() => jest.clearAllMocks());

  it('protects reports with authentication and the existing inventory roles', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, InventoryReportsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, InventoryReportsController)).toEqual([
      'Administrador',
      'Gestor de Inventario',
    ]);
  });

  it.each([
    ['summary', undefined],
    ['stock', query],
    ['movements', query],
    ['loans', query],
  ] as const)('passes only safe generatedBy fields to %s', (method, dto) => {
    if (dto) controller[method](dto, request as never);
    else controller[method](request as never);

    expect(reportsService[method]).toHaveBeenCalledWith(
      ...(dto ? [dto] : []),
      { id: 7, fullName: 'Persona Gestora' },
    );
    expect(reportsService[method]).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.anything() }),
    );
  });
});
