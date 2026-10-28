import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { FinancialService } from './financial.service';
import { FinancialTreasuryController } from './financial-treasury.controller';

describe('FinancialTreasuryController', () => {
  const service = { summarizeTreasury: jest.fn() };
  const controller = new FinancialTreasuryController(
    service as unknown as FinancialService,
  );

  it('requires movement and charge read capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, FinancialTreasuryController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        // Metadata is attached to the prototype method itself.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        FinancialTreasuryController.prototype.summary,
      ),
    ).toEqual(['fin.movements.read', 'fin.charges.read']);
  });

  it('forwards the requested period', () => {
    const query = {
      dateFrom: '2026-10-01T06:00:00.000Z',
      dateTo: '2026-11-01T05:59:59.999Z',
    };
    void controller.summary(query);
    expect(service.summarizeTreasury).toHaveBeenCalledWith(query);
  });
});
