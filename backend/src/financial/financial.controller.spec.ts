import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PaymentMethod } from '../../generated/prisma/client';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';

describe('FinancialController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    recordPayment: jest.fn(),
  };
  const controller = new FinancialController(service as unknown as FinancialService);

  beforeEach(() => jest.clearAllMocks());

  it('protects all financial endpoints with JWT and capability guard', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, FinancialController)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);
    expect(
      Reflect.getMetadata(CAPABILITIES_KEY, FinancialController.prototype.findAll),
    ).toEqual(['fin.charges.read']);
    expect(
      Reflect.getMetadata(CAPABILITIES_KEY, FinancialController.prototype.findOne),
    ).toEqual(['fin.charges.read']);
    expect(
      Reflect.getMetadata(CAPABILITIES_KEY, FinancialController.prototype.recordPayment),
    ).toEqual(['fin.payments.record']);
  });

  it('passes only JWT actor identity to payment registration', () => {
    const dto = { amount: '2500', method: PaymentMethod.CASH };
    const request = { user: { id: 7 } };

    controller.recordPayment(1, dto, request as never);

    expect(service.recordPayment).toHaveBeenCalledWith(1, dto, 7);
  });
});
