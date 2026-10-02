import { GUARDS_METADATA } from '@nestjs/common/constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { CAPABILITIES_KEY } from '../auth/presentation/decorators/require-capabilities.decorator';
import {
  CreateVolunteerOpportunityDto,
  QueryVolunteerOpportunitiesDto,
  UpdateVolunteerOpportunityDto,
} from './dto/volunteer-opportunity.dto';
import { VolunteeringOpportunitiesController } from './volunteering-opportunities.controller';
import { VolunteeringOpportunitiesService } from './volunteering-opportunities.service';

describe('VolunteeringOpportunitiesController', () => {
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const controller = new VolunteeringOpportunitiesController(
    service as unknown as VolunteeringOpportunitiesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('protects every route with JWT and volunteer opportunity capabilities', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, VolunteeringOpportunitiesController),
    ).toEqual([JwtAuthGuard, CapabilityGuard]);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        VolunteeringOpportunitiesController.prototype.findAll,
      ),
    ).toEqual(['vol.opportunities.read']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        VolunteeringOpportunitiesController.prototype.findOne,
      ),
    ).toEqual(['vol.opportunities.read']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        VolunteeringOpportunitiesController.prototype.create,
      ),
    ).toEqual(['vol.opportunities.create']);
    expect(
      Reflect.getMetadata(
        CAPABILITIES_KEY,
        VolunteeringOpportunitiesController.prototype.update,
      ),
    ).toEqual(['vol.opportunities.update']);
  });

  it('validates and transforms list, create, and update DTO input', async () => {
    const query = plainToInstance(QueryVolunteerOpportunitiesDto, {
      search: '  parque  ',
      status: 'PUBLISHED',
      page: '2',
      limit: '10',
    });
    const create = plainToInstance(CreateVolunteerOpportunityDto, {
      title: '  Limpieza del parque  ',
      capacity: '20',
      applicationDeadline: '2026-02-01T12:00:00.000Z',
    });
    const update = plainToInstance(UpdateVolunteerOpportunityDto, {
      location: '  Salón comunal  ',
      capacity: '25',
    });

    expect(await validate(query)).toEqual([]);
    expect(query).toMatchObject({
      search: 'parque',
      status: 'PUBLISHED',
      page: 2,
      limit: 10,
    });
    expect(await validate(create)).toEqual([]);
    expect(create).toMatchObject({
      title: 'Limpieza del parque',
      capacity: 20,
      applicationDeadline: new Date('2026-02-01T12:00:00.000Z'),
    });
    expect(await validate(update)).toEqual([]);
    expect(update).toMatchObject({ location: 'Salón comunal', capacity: 25 });
  });

  it('forwards list query and create/update audit actor context', async () => {
    const query = plainToInstance(QueryVolunteerOpportunitiesDto, {
      status: 'DRAFT',
      page: '1',
      limit: '20',
    });
    const create = { title: 'Limpieza del parque' };
    const update = { capacity: 25 };
    const req = {
      user: { id: 9 },
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-agent'),
    };

    await controller.findAll(query);
    await controller.create(create as never, req as never);
    await controller.update(4, update as never, req as never);

    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(service.create).toHaveBeenCalledWith(create, 9, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
    expect(service.update).toHaveBeenCalledWith(4, update, 9, {
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    });
  });
});
