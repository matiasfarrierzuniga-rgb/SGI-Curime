import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CapabilityGuard, JwtAuthGuard } from '../auth';
import { QueryPublicReservationOccupancyDto } from './dto/public-reservations.dto';
import { PublicReservationsController, ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

describe('public reservations contract', () => {
  const service = { findPublicActiveResources: jest.fn(), findPublicOccupancy: jest.fn(), checkAvailability: jest.fn() };
  const controller = new PublicReservationsController(service as unknown as ReservationsService);

  beforeEach(() => jest.clearAllMocks());

  it('allows anonymous read endpoints, throttles them, and keeps reservation creation JWT-protected', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PublicReservationsController)).toEqual([ThrottlerGuard]);
    expect(Reflect.getMetadata(GUARDS_METADATA, ReservationsController)).toEqual([JwtAuthGuard, CapabilityGuard]);
  });

  it('validates bounded public occupancy parameters before querying private reservations', async () => {
    const valid = plainToInstance(QueryPublicReservationOccupancyDto, { resourceId: '4', from: '2030-01-01', to: '2030-01-31' });
    expect(await validate(valid)).toEqual([]);
    expect(await validate(plainToInstance(QueryPublicReservationOccupancyDto, { resourceId: '0', from: '01-01-2030', to: 'invalid' }))).not.toEqual([]);
  });

  it('returns only public resource and occupancy projections', async () => {
    service.findPublicActiveResources.mockResolvedValue([{ id: 1, name: 'Salón', description: null, location: 'Curime', capacity: 50, pricingType: 'FREE', price: null, currency: 'CRC' }]);
    service.findPublicOccupancy.mockResolvedValue({ resourceId: 1, slots: [{ startAt: new Date('2030-01-01T10:00:00Z'), endAt: new Date('2030-01-01T12:00:00Z') }] });
    await expect(controller.findActiveResources()).resolves.toEqual([{ id: 1, name: 'Salón', description: null, location: 'Curime', capacity: 50, pricingType: 'FREE', price: null, currency: 'CRC' }]);
    await expect(controller.occupancy({ resourceId: 1, from: '2030-01-01', to: '2030-01-01' })).resolves.toEqual({ resourceId: 1, slots: [{ startAt: new Date('2030-01-01T10:00:00Z'), endAt: new Date('2030-01-01T12:00:00Z') }] });
  });
});
