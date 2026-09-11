/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { AssembliesController } from './assemblies.controller';

describe('AssembliesController contracts', () => {
  const service = {
    create: jest.fn(),
    findMine: jest.fn(),
    findOneAllowed: jest.fn(),
    start: jest.fn(),
    complete: jest.fn(),
    remove: jest.fn(),
    replaceConvocations: jest.fn(),
  };
  const controller = new AssembliesController(service as never);

  it('requires manage capability for create and convocation mutations', () => {
    for (const handler of [
      'create',
      'update',
      'replaceConvocations',
      'start',
      'complete',
      'remove',
      'record',
    ] as const) {
      expect(
        Reflect.getMetadata(
          CAPABILITIES_KEY,
          AssembliesController.prototype[handler],
        ),
      ).toEqual(['adm.assemblies.manage']);
    }
  });

  it('requires read capability for administrative reads', () => {
    for (const handler of [
      'findAll',
      'eligibleAffiliates',
      'convocations',
      'quorum',
      'attendance',
    ] as const) {
      expect(
        Reflect.getMetadata(
          CAPABILITIES_KEY,
          AssembliesController.prototype[handler],
        ),
      ).toEqual(['adm.assemblies.read']);
    }
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

  it('rejects mine/detail when internal access is no longer valid', () => {
    const request = {
      user: { id: 42, role: 'Vecino/Afiliado', canAccessErp: false },
    } as never;
    expect(() => controller.findMine(request)).toThrow(ForbiddenException);
    expect(() => controller.findOne(1, request)).toThrow(ForbiddenException);
  });
});
