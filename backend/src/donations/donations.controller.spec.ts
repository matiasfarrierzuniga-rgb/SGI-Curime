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

  it('registers a donation and returns the service representation', async () => {
    const dto = {
      amount: '1250.50',
      method: 'SINPE_MOVIL',
      receivedAt: '2026-09-09T16:00:00.000Z',
    };
    const createdDonation = {
      id: 41,
      amount: '1250.50',
      status: 'CONFIRMED',
      originalMovementId: 84,
    };
    const request = {
      user: { id: 17 },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };
    service.create.mockResolvedValueOnce(createdDonation);

    await expect(controller.create(dto as never, request as never)).resolves.toEqual(
      createdDonation,
    );
    expect(service.create).toHaveBeenCalledWith(dto, 17, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });

  it('returns the paginated donation collection from the service', async () => {
    const query = { status: 'CONFIRMED', page: 2, limit: 10 };
    const result = {
      data: [{ id: 41, amount: '1250.50', status: 'CONFIRMED' }],
      total: 1,
      page: 2,
      limit: 10,
    };
    service.findAll.mockResolvedValueOnce(result);

    await expect(controller.findAll(query as never)).resolves.toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('returns the authoritative donation detail by id', async () => {
    const result = {
      id: 41,
      amount: '1250.50',
      status: 'CANCELLED',
      cancellationReason: 'Registro duplicado',
      originalMovementId: 84,
      reversalMovementId: 85,
    };
    service.findOne.mockResolvedValueOnce(result);

    await expect(controller.findOne(41)).resolves.toEqual(result);
    expect(service.findOne).toHaveBeenCalledWith(41);
  });

  it('updates a donation using the authenticated actor and request context', async () => {
    const dto = { amount: '1500.00', reference: 'REF-2' };
    const request = {
      user: { id: 23 },
      ip: '192.0.2.4',
      get: jest.fn().mockReturnValue('update-agent'),
    };
    service.update.mockResolvedValueOnce({ id: 41, ...dto });

    await expect(
      controller.update(41, dto as never, request as never),
    ).resolves.toEqual({ id: 41, ...dto });
    expect(service.update).toHaveBeenCalledWith(41, dto, 23, {
      ipAddress: '192.0.2.4',
      userAgent: 'update-agent',
    });
  });

  it('cancels a donation using the authenticated actor and request context', async () => {
    const dto = { cancellationReason: 'Registro duplicado' };
    const request = {
      user: { id: 24 },
      ip: '192.0.2.5',
      get: jest.fn().mockReturnValue('cancel-agent'),
    };
    service.cancel.mockResolvedValueOnce({ id: 41, status: 'CANCELLED' });

    await expect(
      controller.cancel(41, dto as never, request as never),
    ).resolves.toEqual({ id: 41, status: 'CANCELLED' });
    expect(service.cancel).toHaveBeenCalledWith(41, dto, 24, {
      ipAddress: '192.0.2.5',
      userAgent: 'cancel-agent',
    });
  });

  it('deletes a donation using the authenticated actor and request context', async () => {
    const request = {
      user: { id: 25 },
      ip: '192.0.2.6',
      get: jest.fn().mockReturnValue('delete-agent'),
    };
    service.remove.mockResolvedValueOnce({ deleted: true, id: 41 });

    await expect(controller.remove(41, request as never)).resolves.toEqual({
      deleted: true,
      id: 41,
    });
    expect(service.remove).toHaveBeenCalledWith(41, 25, {
      ipAddress: '192.0.2.6',
      userAgent: 'delete-agent',
    });
  });
});
