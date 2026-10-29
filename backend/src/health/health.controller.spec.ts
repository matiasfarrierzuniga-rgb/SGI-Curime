import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  it('reports readiness when PostgreSQL responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.ready()).resolves.toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns only a generic failure when PostgreSQL is unavailable', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('private connection detail')) };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
    await expect(controller.ready()).rejects.toThrow('Service unavailable');
  });
});
