import { ConflictException, NotFoundException } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';

describe('AffiliatesService deactivation', () => {
  const tx = {
    affiliate: { findUnique: jest.fn(), update: jest.fn() },
    role: { findUnique: jest.fn() },
    user: { update: jest.fn() },
    session: { updateMany: jest.fn() },
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
      personId: 8,
      person: { user: { id: 12 } },
    });
    tx.role.findUnique.mockResolvedValue({ id: 1, isActive: true });
    tx.affiliate.update.mockResolvedValue({ id: 4, status: 'INACTIVE' });
    tx.user.update.mockResolvedValue({ id: 12, status: 'ACTIVE', roleId: 1 });
    tx.session.updateMany.mockResolvedValue({ count: 2 });
    audit.log.mockResolvedValue({ id: 99 });
  });

  it('atomically inactivates the affiliate, keeps the user active, resets role, revokes sessions, and audits', async () => {
    await expect(service.deactivate(4, 2)).resolves.toMatchObject({
      status: 'INACTIVE',
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { roleId: 1 },
    });
    expect(tx.user.update.mock.calls[0][0].data).not.toHaveProperty('status');
    expect(tx.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 12, revokedAt: null },
        data: expect.objectContaining({
          revocationReason: 'AFFILIATE_DEACTIVATED',
        }),
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 4 }),
      tx,
    );
  });

  it.each([
    ['missing affiliate', null, NotFoundException],
    [
      'inactive affiliate',
      { id: 4, status: 'INACTIVE', personId: 8, person: { user: { id: 12 } } },
      ConflictException,
    ],
    [
      'missing person',
      { id: 4, status: 'ACTIVE', personId: null, person: { user: null } },
      ConflictException,
    ],
    [
      'missing person relation',
      { id: 4, status: 'ACTIVE', personId: 8, person: null },
      ConflictException,
    ],
    [
      'missing user',
      { id: 4, status: 'ACTIVE', personId: 8, person: { user: null } },
      ConflictException,
    ],
  ])('rejects %s before writes', async (_label, affiliate, error) => {
    tx.affiliate.findUnique.mockResolvedValueOnce(affiliate);
    await expect(service.deactivate(4, 2)).rejects.toBeInstanceOf(error);
    expect(tx.affiliate.update).not.toHaveBeenCalled();
  });

  it('rejects an unavailable general role before writes', async () => {
    tx.role.findUnique.mockResolvedValueOnce({ id: 1, isActive: false });
    await expect(service.deactivate(4, 2)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(tx.affiliate.update).not.toHaveBeenCalled();
  });

  it('propagates an audit failure so Prisma rolls the complete transaction back', async () => {
    audit.log.mockRejectedValueOnce(new Error('audit failed'));
    await expect(service.deactivate(4, 2)).rejects.toThrow('audit failed');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
