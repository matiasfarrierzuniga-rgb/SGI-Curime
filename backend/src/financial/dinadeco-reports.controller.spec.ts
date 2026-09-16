import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { DinadecoReportsController } from './dinadeco-reports.controller';
import { DinadecoReportsService } from './dinadeco-reports.service';

describe('DinadecoReportsController', () => {
  const reports = { annual: jest.fn() };
  const controller = new DinadecoReportsController(
    reports as unknown as DinadecoReportsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('requires JWT and the dedicated DINADECO capability', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, DinadecoReportsController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        DinadecoReportsController.prototype.annual,
      ),
    ).toEqual(['fin.dinadeco.read']);
  });

  it('passes the validated year and minimal authenticated identity', () => {
    controller.annual(
      { year: 2026 },
      { user: { id: 7, fullName: 'Persona Tesorera' } } as never,
    );
    expect(reports.annual).toHaveBeenCalledWith(2026, {
      id: 7,
      fullName: 'Persona Tesorera',
    });
  });
});
