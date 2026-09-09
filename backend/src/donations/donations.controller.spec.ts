import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { DONATION_CAPABILITIES } from '../auth/presentation/capabilities/capability-policy';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

describe('DonationsController', () => {
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    remove: jest.fn(),
  };
  const controller = new DonationsController(
    service as unknown as DonationsService,
  );

  it('protects every donation endpoint with its canonical capability', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, DonationsController)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);

    const routes = [
      ['create', DONATION_CAPABILITIES.create],
      ['findAll', DONATION_CAPABILITIES.read],
      ['findOne', DONATION_CAPABILITIES.read],
      ['update', DONATION_CAPABILITIES.update],
      ['cancel', DONATION_CAPABILITIES.cancel],
      ['remove', DONATION_CAPABILITIES.delete],
    ] as const;

    for (const [handler, capability] of routes) {
      expect(
        Reflect.getMetadata(
          CAPABILITIES_KEY,
          DonationsController.prototype[handler],
        ),
      ).toEqual([capability]);
    }
  });
});
