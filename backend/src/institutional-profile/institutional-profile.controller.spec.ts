import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { InstitutionalProfileController } from './institutional-profile.controller';
import { InstitutionalProfileService } from './institutional-profile.service';

describe('InstitutionalProfileController', () => {
  const service = { get: jest.fn(), update: jest.fn() };
  const controller = new InstitutionalProfileController(service as unknown as InstitutionalProfileService);

  it('requires JWT and capability guards with distinct read/update capabilities', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, InstitutionalProfileController)).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, InstitutionalProfileController.prototype.get)).toEqual(['adm.institutional-profile.read']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, InstitutionalProfileController.prototype.update)).toEqual(['adm.institutional-profile.update']);
  });

  it('passes actor and request context to updates', async () => {
    const dto = { legalName: 'Asociación de Prueba' };
    const request = { user: { id: 9 }, ip: '127.0.0.1', get: jest.fn().mockReturnValue('agent') };
    await controller.update(dto, request as never);
    expect(service.update).toHaveBeenCalledWith(dto, 9, { ipAddress: '127.0.0.1', userAgent: 'agent' });
  });
});
