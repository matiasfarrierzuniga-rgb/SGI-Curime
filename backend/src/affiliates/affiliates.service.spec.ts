import { ConflictException, NotFoundException } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';

describe('AffiliatesService deactivation', () => {
  const tx = {
    affiliate: { findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((work: (client: typeof tx) => Promise<unknown>) =>
      work(tx),
    ),
  };
  const audit = { log: jest.fn() };
  let service: AffiliatesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AffiliatesService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
    tx.affiliate.findUnique.mockResolvedValue({
      id: 4,
      status: 'ACTIVE',
    });
    tx.affiliate.update.mockResolvedValue({ id: 4, status: 'INACTIVE' });
    audit.log.mockResolvedValue({ id: 99 });
  });

  it('atomically inactivates an affiliate without changing access or sessions', async () => {
    await expect(service.deactivate(4, 2)).resolves.toMatchObject({
      status: 'INACTIVE',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.affiliate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 4 },
        data: { status: 'INACTIVE' },
      }),
    );
    expect((tx as Record<string, unknown>).user).toBeUndefined();
    expect((tx as Record<string, unknown>).session).toBeUndefined();
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 4 }),
      tx,
    );
  });

  it.each([
    ['missing affiliate', null, NotFoundException],
    ['inactive affiliate', { id: 4, status: 'INACTIVE' }, ConflictException],
  ])('rejects %s before writes', async (_label, affiliate, error) => {
    tx.affiliate.findUnique.mockResolvedValueOnce(affiliate);
    await expect(service.deactivate(4, 2)).rejects.toBeInstanceOf(error);
    expect(tx.affiliate.update).not.toHaveBeenCalled();
  });

  it('propagates an audit failure so Prisma rolls the complete transaction back', async () => {
    audit.log.mockRejectedValueOnce(new Error('audit failed'));
    await expect(service.deactivate(4, 2)).rejects.toThrow('audit failed');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
