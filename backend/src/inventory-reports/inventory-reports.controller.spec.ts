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
