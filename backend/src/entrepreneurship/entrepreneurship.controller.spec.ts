import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import { QueryPublicVenturesDto, QueryVenturesDto } from './dto/venture.dto';
import { EntrepreneurshipController, PublicEntrepreneurshipController } from './entrepreneurship.controller';
import { EntrepreneurshipService } from './entrepreneurship.service';

describe('EntrepreneurshipController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    publish: jest.fn(),
    unpublish: jest.fn(),
  };
  const controller = new EntrepreneurshipController(
    service as unknown as EntrepreneurshipService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('protects every route with JWT and persisted venture capabilities', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, EntrepreneurshipController)).toEqual([
      JwtAuthGuard,
      CapabilityGuard,
    ]);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.findAll)).toEqual(['ent.ventures.read']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.findOne)).toEqual(['ent.ventures.read']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.create)).toEqual(['ent.ventures.create']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.update)).toEqual(['ent.ventures.update']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.publish)).toEqual(['ent.ventures.publish']);
    expect(Reflect.getMetadata(CAPABILITIES_KEY, EntrepreneurshipController.prototype.unpublish)).toEqual(['ent.ventures.publish']);
  });

  it('parses frontend list query parameters and forwards each query independently', async () => {
    const filtered = plainToInstance(QueryVenturesDto, {
      search: ' postre ',
      status: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
      page: '2',
      limit: '10',
    });
    const reset = plainToInstance(QueryVenturesDto, { page: '1', limit: '20' });

    expect(await validate(filtered)).toEqual([]);
    expect(filtered).toMatchObject({
      search: 'postre',
      status: 'ACTIVE',
      publicationStatus: 'PUBLISHED',
      page: 2,
      limit: 10,
    });
    expect(await validate(reset)).toEqual([]);

    await controller.findAll(filtered);
    await controller.findAll(reset);

    expect(service.findAll).toHaveBeenNthCalledWith(1, filtered);
    expect(service.findAll).toHaveBeenNthCalledWith(2, reset);
  });

  it('forwards create actor and audit context', async () => {
    const dto = { name: 'Café Curime', incorporatedAt: new Date('2026-01-02') };
    const req = { user: { id: 9 }, ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent') };
    service.create.mockResolvedValue({ id: 4, ...dto });

    await expect(controller.create(dto as never, req as never)).resolves.toEqual({ id: 4, ...dto });
    expect(service.create).toHaveBeenCalledWith(dto, 9, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });

  it('forwards publication transitions with actor and audit context', async () => {
    const req = { user: { id: 9 }, ip: '127.0.0.1', get: jest.fn().mockReturnValue('test-agent') };

    await controller.publish(4, req as never);
    await controller.unpublish(4, req as never);

    const context = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };
    expect(service.publish).toHaveBeenCalledWith(4, 9, context);
    expect(service.unpublish).toHaveBeenCalledWith(4, 9, context);
  });
});

describe('PublicEntrepreneurshipController', () => {
  const service = {
    findPublic: jest.fn(),
    findPublicOne: jest.fn(),
  };
  const controller = new PublicEntrepreneurshipController(
    service as unknown as EntrepreneurshipService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('validates and forwards anonymous public list queries without internal filters', async () => {
    const query = plainToInstance(QueryPublicVenturesDto, {
      search: ' café ',
      page: '2',
      limit: '10',
    });

    expect(await validate(query)).toEqual([]);
    expect(query).toMatchObject({ search: 'café', page: 2, limit: 10 });

    await controller.findAll(query);

    expect(service.findPublic).toHaveBeenCalledWith(query);
    expect(Reflect.getMetadata(GUARDS_METADATA, PublicEntrepreneurshipController)).toBeUndefined();
  });

  it.each(['0', '1.5', '101'])(
    'rejects invalid public list limit %s',
    async (limit) => {
      const query = plainToInstance(QueryPublicVenturesDto, { limit });

      const errors = await validate(query);

      expect(errors.some((error) => error.property === 'limit')).toBe(true);
    },
  );

  it('forwards public detail identifiers without authentication', async () => {
    await controller.findOne(7);

    expect(service.findPublicOne).toHaveBeenCalledWith(7);
  });
});
