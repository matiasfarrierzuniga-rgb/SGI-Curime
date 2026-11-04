/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ANY_CAPABILITIES_KEY } from '../auth/presentation/decorators/require-any-capabilities.decorator';
import { AssembliesController } from './assemblies.controller';

describe('AssembliesController contracts', () => {
  const service = {
    create: jest.fn(),
    findMine: jest.fn(),
    detail: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    remove: jest.fn(),
    replaceConvocations: jest.fn(),
  };
  const controller = new AssembliesController(service as never);

  it('maps notice configuration, session actions and attendance to canonical capabilities', () => {
    for (const handler of [
      'create',
      'update',
      'replaceConvocations',
      'remove',
      'replaceCalls',
    ] as const) {
      expect(Reflect.getMetadata(ANY_CAPABILITIES_KEY, AssembliesController.prototype[handler])).toContain('governance.assembly.create');
    }
    for (const handler of [
      'start',
      'complete',
    ] as const) {
      expect(Reflect.getMetadata(ANY_CAPABILITIES_KEY, AssembliesController.prototype[handler])).toContain('governance.assembly.session');
    }
    expect(Reflect.getMetadata(ANY_CAPABILITIES_KEY, AssembliesController.prototype.record)).toContain('governance.attendance.scan');
  });

  it('uses session capability for institutional assembly reads', () => {
    for (const handler of [
      'findAll',
        'convocations',
        'findOne',
        'quorum',
      'attendance',
      'calls',
    ] as const) {
      expect(
        Reflect.getMetadata(
          ANY_CAPABILITIES_KEY,
          AssembliesController.prototype[handler],
        ),
      ).toContain('governance.assembly.session');
    }
    expect(Reflect.getMetadata(ANY_CAPABILITIES_KEY, AssembliesController.prototype.eligibleAffiliates)).toContain('governance.assembly.create');
  });

  it('declares static mine and eligible-affiliates paths independently of :id', () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AssembliesController.prototype.findMine,
      ),
    ).toBe('mine');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AssembliesController.prototype.eligibleAffiliates,
      ),
    ).toBe('eligible-affiliates');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AssembliesController.prototype.findOne,
      ),
    ).toBe(':id');
  });

  it('does not trust an affiliate id when listing mine', async () => {
    service.findMine.mockResolvedValue([]);
    await controller.findMine({
      user: { id: 42, canAccessErp: true },
    } as never);
    expect(service.findMine).toHaveBeenCalledWith(42);
  });

  it('rejects mine when internal access is no longer valid', () => {
    const request = {
      user: { id: 42, role: 'Vecino/Afiliado', canAccessErp: false },
    } as never;
    expect(() => controller.findMine(request)).toThrow(ForbiddenException);
  });
});
