import { GUARDS_METADATA } from '@nestjs/common/constants';
import { FinancialMovementType } from '../../generated/prisma/client';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialService } from './financial.service';

describe('FinancialMovementsController', () => {
  const service = {
    createMovement: jest.fn(),
    findMovements: jest.fn(),
    findMovement: jest.fn(),
    summarizeMovements: jest.fn(),
  };
  const controller = new FinancialMovementsController(
    service as unknown as FinancialService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('protects movement endpoints with the expected capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, FinancialMovementsController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        FinancialMovementsController.prototype.create,
      ),
    ).toEqual(['fin.movements.create']);

    for (const handler of ['findAll', 'findOne', 'summary'] as const) {
      expect(
        Reflect.getMetadata(
          CAPABILITIES_KEY,
          FinancialMovementsController.prototype[handler],
        ),
      ).toEqual(['fin.movements.read']);
    }
  });

  it('passes only the JWT actor and request context to creation', () => {
    const dto = {
      type: FinancialMovementType.INCOME,
      amount: '25000.00',
      description: 'Alquiler del salón comunal',
      occurredAt: '2026-09-06T16:00:00.000Z',
    };
    const request = {
      user: { id: 17 },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };

    controller.create(dto, request as never);

    expect(service.createMovement).toHaveBeenCalledWith(dto, 17, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });
});
